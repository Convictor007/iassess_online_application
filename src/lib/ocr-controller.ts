/**
 * Background document analysis controller:
 * - Gemini primary: extract fields + validate document quality/authenticity
 * - OCR.space fallback when Gemini fails
 * - Per-document progress bars
 * - Continue waits for idle; App gates on validation
 */
import type { DocumentType, PendingDocument } from '../types';
import {
  AUTOFILL_DOCS,
  createEmptyOcrResult,
  extractFromDocText,
  isAutofillDocType,
  recognizeImageFile,
  type AutofillDocumentType,
  type OcrAutofillResult,
  type OcrDocProgress,
  type OcrStatusMap,
} from './ocr-autofill';
import {
  analyzeWithGemini,
  fallbackValidationFromText,
  isGeminiConfigured,
  type DocValidation,
} from './gemini-doc';

export type OcrStatusListener = (statuses: OcrStatusMap) => void;
export type OcrResultListener = (result: OcrAutofillResult) => void;
export type ValidationListener = (validations: ValidationMap) => void;

/** validation status per uploaded document type (incl. non-autofill required docs) */
export type ValidationMap = Partial<Record<DocumentType, DocValidation>>;

/** Expand progress status to also carry validation for UI. */
export interface TrackedDocStatus extends OcrDocProgress {
  validation?: DocValidation;
  engine?: 'gemini' | 'ocr_space' | null;
}

export class OcrAutofillController {
  private statuses: OcrStatusMap = {};
  private validations: ValidationMap = {};
  private result: OcrAutofillResult = createEmptyOcrResult();
  private pending = new Map<string, Promise<void>>();
  private statusListeners = new Set<OcrStatusListener>();
  private resultListeners = new Set<OcrResultListener>();
  private validationListeners = new Set<ValidationListener>();
  private generation = new Map<string, number>();

  getStatuses(): OcrStatusMap {
    return { ...this.statuses };
  }

  getValidations(): ValidationMap {
    return { ...this.validations };
  }

  getResult(): OcrAutofillResult {
    return this.result;
  }

  isProcessing(type?: DocumentType): boolean {
    if (type) return this.pending.has(type);
    return this.pending.size > 0;
  }

  /** Resolves when every currently queued job has settled. */
  async waitUntilIdle(): Promise<void> {
    while (this.pending.size > 0) {
      await Promise.allSettled([...this.pending.values()]);
    }
  }

  /**
   * Notices for Continue: errors and warnings with full messages.
   * Continue is NOT hard-blocked — App shows a modal instead.
   */
  getContinueNotices(
    documents: Partial<Record<DocumentType, PendingDocument[]>>,
  ): Array<{ docType: DocumentType; severity: 'error' | 'warning'; message: string; issues: string[] }> {
    const notices: Array<{
      docType: DocumentType;
      severity: 'error' | 'warning';
      message: string;
      issues: string[];
    }> = [];
    for (const [type, files] of Object.entries(documents)) {
      if (!files || files.length === 0) continue;
      const t = type as DocumentType;
      const v = this.validations[t];
      if (!v) {
        notices.push({
          docType: t,
          severity: 'warning',
          message: 'Analysis not finished yet for this document',
          issues: [],
        });
        continue;
      }
      if (v.severity === 'error' || !v.valid) {
        notices.push({
          docType: t,
          severity: 'error',
          message: v.message,
          issues: v.issues,
        });
      } else if (v.severity === 'warning') {
        notices.push({
          docType: t,
          severity: 'warning',
          message: v.message,
          issues: v.issues,
        });
      }
    }
    return notices;
  }

  /** Legacy: hard blockers only (errors). */
  getBlockingIssues(documents: Partial<Record<DocumentType, PendingDocument[]>>): string[] {
    return this.getContinueNotices(documents)
      .filter((n) => n.severity === 'error')
      .map((n) => n.message);
  }

  onStatus(fn: OcrStatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  onResult(fn: OcrResultListener): () => void {
    this.resultListeners.add(fn);
    return () => this.resultListeners.delete(fn);
  }

  onValidation(fn: ValidationListener): () => void {
    this.validationListeners.add(fn);
    return () => this.validationListeners.delete(fn);
  }

  /** Start background analyze+extract for a document type's files. */
  start(docType: DocumentType, files: PendingDocument[]): void {
    if (!files.length) {
      this.clearType(docType);
      return;
    }

    const gen = (this.generation.get(docType) ?? 0) + 1;
    this.generation.set(docType, gen);

    this.setStatus(docType, {
      status: 'processing',
      progress: 5,
      message: 'Scanning document…',
    });

    this.resetTypeInResult(docType);
    delete this.validations[docType];
    this.emitValidation();

    const job = this.runType(docType, files, gen)
      .catch((err) => {
        console.warn('[doc-analysis] job failed', docType, err);
        if (this.generation.get(docType) === gen) {
          this.setStatus(docType, {
            status: 'error',
            progress: 100,
            message: 'Could not analyze this document',
          });
          this.validations[docType] = {
            valid: false,
            severity: 'error',
            issues: ['unreadable_text'],
            message: 'Analysis failed — please re-upload a clearer photo',
            confidence: 0,
            engine: 'none',
          };
          this.emitValidation();
        }
      })
      .finally(() => {
        if (this.pending.get(docType) === job) {
          this.pending.delete(docType);
        }
      });

    this.pending.set(docType, job);
    this.emitStatus();
  }

  clearType(docType: DocumentType): void {
    this.generation.set(docType, (this.generation.get(docType) ?? 0) + 1);
    this.pending.delete(docType);
    delete this.statuses[docType];
    delete this.validations[docType];
    this.resetTypeInResult(docType);
    this.emitStatus();
    this.emitResult();
    this.emitValidation();
  }

  private async runType(
    docType: DocumentType,
    files: PendingDocument[],
    gen: number,
  ): Promise<void> {
    const images = files.filter(
      (f) => f.file.type.startsWith('image/') || f.file.type === 'application/pdf',
    );
    if (images.length === 0) {
      this.setStatus(docType, {
        status: 'skipped',
        progress: 100,
        message: 'Not a readable image',
      });
      this.validations[docType] = {
        valid: false,
        severity: 'error',
        issues: ['wrong_document_type'],
        message: 'Unsupported file — upload JPG, PNG, WebP, or PDF',
        confidence: 0,
        engine: 'none',
      };
      this.emitValidation();
      return;
    }

    const total = images.length;
    let lastValidation: DocValidation | null = null;
    let lastProperty: Partial<import('../types').PropertyInfo> = {};
    let lastRequestor: string | null = null;

    for (let i = 0; i < total; i++) {
      if (this.generation.get(docType) !== gen) return;

      const file = images[i];
      const basePct = Math.round((i / total) * 100);
      const span = Math.round(100 / total);
      const label = total > 1 ? `image ${i + 1}/${total}` : 'document';

      const report = (pct: number, msg: string) => {
        if (this.generation.get(docType) !== gen) return;
        this.setStatus(docType, {
          status: 'processing',
          progress: Math.min(basePct + Math.round((pct / 100) * span), 98),
          message: msg,
        });
      };

      report(5, `Scanning ${label}…`);

      // —— Primary: scan service (1 retry on failure) ——
      if (isGeminiConfigured()) {
        const maxAttempts = 2;
        let analysis: Awaited<ReturnType<typeof analyzeWithGemini>> | null = null;
        let lastErr: unknown = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          if (this.generation.get(docType) !== gen) return;
          try {
            report(
              attempt === 1 ? 8 : 25,
              attempt === 1
                ? `Scanning ${label}…`
                : `Retrying scan (${attempt}/${maxAttempts})…`,
            );
            analysis = await analyzeWithGemini(file.file, docType, (pct) =>
              report(
                attempt === 1 ? pct : Math.max(25, pct),
                attempt === 1
                  ? `Scanning ${label}…`
                  : `Retrying scan…`,
              ),
            );
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            if (this.generation.get(docType) !== gen) return;
            console.warn(
              `[doc-analysis] scan attempt ${attempt}/${maxAttempts} failed`,
              docType,
              err,
            );
            if (attempt < maxAttempts) {
              report(20, `Scan failed — retrying once…`);
              // Brief pause before retry
              await new Promise((r) => setTimeout(r, 400));
            }
          }
        }

        if (analysis) {
          if (this.generation.get(docType) !== gen) return;

          lastValidation = analysis.validation;
          lastProperty = analysis.propertyInfo;
          lastRequestor = analysis.requestorName;

          // Merge structured fields into autofill result (fills empty slots)
          if (isAutofillDocType(docType)) {
            if (analysis.text.trim()) {
              this.result.texts[docType] = analysis.text;
              this.result.ran = true;
            }
            if (docType === 'valid_id' || docType === 'spa') {
              if (analysis.requestorName && !this.result.requestorInfo.name) {
                this.result.requestorInfo.name = analysis.requestorName;
                this.result.sources.requestor = docType;
              }
            }
            if (Object.keys(analysis.propertyInfo).length > 0) {
              const merged = { ...this.result.propertyInfo };
              for (const [k, v] of Object.entries(analysis.propertyInfo)) {
                const key = k as keyof typeof merged;
                const existing = merged[key];
                const hasExisting = Array.isArray(existing)
                  ? existing.length > 0
                  : Boolean(existing);
                if (!hasExisting && v) {
                  if (Array.isArray(v)) {
                    if (v.length) merged[key] = v as never;
                  } else {
                    merged[key] = v as never;
                  }
                } else if (Array.isArray(v) && Array.isArray(existing)) {
                  for (const item of v) {
                    if (!existing.includes(item)) existing.push(item);
                  }
                }
              }
              this.result.propertyInfo = merged;
              if (
                analysis.propertyInfo.ownerName ||
                analysis.propertyInfo.taxDeclarations?.length ||
                analysis.propertyInfo.titleNo
              ) {
                this.result.sources.property = docType as AutofillDocumentType;
              }
            }
          }

          this.validations[docType] = analysis.validation;
          this.emitValidation();

          if (analysis.validation.valid || analysis.validation.issues.length > 0) {
            break;
          }
          continue;
        }

        // Both scan attempts failed → fall through to OCR.space
        if (this.generation.get(docType) !== gen) return;
        console.warn('[doc-analysis] scan failed twice, falling back to OCR.space', docType, lastErr);
        report(20, `Scan failed — basic text reading…`);
      }

      // —— Fallback: basic text scan (OCR.space) ——
      const text = await recognizeImageFile(file.file, (pct) =>
        report(pct, `Basic scan: reading ${label}…`),
      );
      if (this.generation.get(docType) !== gen) return;

      if (text.trim()) {
        if (isAutofillDocType(docType)) {
          extractFromDocText(docType, text, this.result);
          lastProperty = { ...this.result.propertyInfo };
          lastRequestor = this.result.requestorInfo.name || null;
        }
        lastValidation = fallbackValidationFromText(
          docType,
          text,
          lastProperty,
          lastRequestor,
        );
        this.validations[docType] = lastValidation;
        this.emitValidation();
        break;
      }

      lastValidation = fallbackValidationFromText(docType, '', {}, null);
      this.validations[docType] = lastValidation;
      this.emitValidation();
    }

    if (this.generation.get(docType) !== gen) return;

    const validation =
      lastValidation ??
      ({
        valid: false,
        severity: 'error',
        issues: ['unreadable_text'],
        message: 'No analysis result',
        confidence: 0,
        engine: 'none',
      } satisfies DocValidation);

    this.validations[docType] = validation;

    const statusMsg = validation.severity === 'ok'
      ? validation.message
      : validation.severity === 'warning'
        ? `Warning: ${validation.message}`
        : validation.message;

    // Warning keeps "done" so UI is amber (not hard error state)
    const status = validation.valid
      ? 'done'
      : validation.severity === 'warning'
        ? 'done'
        : 'error';

    this.setStatus(docType, {
      status: validation.valid || validation.severity === 'warning' ? 'done' : 'error',
      progress: 100,
      message: statusMsg,
    });
    void status;

    this.emitResult();
    this.emitStatus();
    this.emitValidation();
  }

  private resetTypeInResult(docType: DocumentType): void {
    if (!isAutofillDocType(docType)) return;
    delete this.result.texts[docType];
    if (this.result.sources.property === docType) {
      this.result.sources.property = null;
    }
    if (this.result.sources.requestor === docType) {
      this.result.sources.requestor = null;
    }
  }

  private setStatus(type: DocumentType, progress: OcrDocProgress): void {
    // Status map is only consumed for autofill cards today; store under any key via cast.
    (this.statuses as Partial<Record<string, OcrDocProgress>>)[type] = progress;
    this.emitStatus();
  }

  private emitStatus(): void {
    const snap = { ...this.statuses };
    for (const fn of this.statusListeners) fn(snap);
  }

  private emitResult(): void {
    const snap: OcrAutofillResult = {
      ...this.result,
      propertyInfo: { ...this.result.propertyInfo },
      requestorInfo: { ...this.result.requestorInfo },
      sources: { ...this.result.sources },
      texts: { ...this.result.texts },
    };
    for (const fn of this.resultListeners) fn(snap);
  }

  private emitValidation(): void {
    const snap = { ...this.validations };
    for (const fn of this.validationListeners) fn(snap);
  }
}

/** Shared controller instance for the app session. */
export const ocrController = new OcrAutofillController();

export { AUTOFILL_DOCS, isAutofillDocType };
export type { OcrStatusMap, OcrDocProgress, OcrAutofillResult, DocValidation };
