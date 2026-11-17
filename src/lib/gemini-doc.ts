import type { DocumentType, PropertyInfo, RequestorInfo } from '../types';
import { BARANGAYS } from '../data/transactions';
import { looksLikePersonName } from './ocr-autofill';

/** Stable issue codes shown in the upload UI. */
export type ValidationIssueCode =
  | 'noisy_photo'
  | 'blurred'
  | 'tilted_document'
  | 'incomplete_crop'
  | 'wrong_document_type'
  | 'fake_or_suspicious_id'
  | 'not_a_government_id'
  | 'missing_tax_declaration'
  | 'missing_owner'
  | 'missing_lot_or_barangay'
  | 'unreadable_text'
  | 'not_an_spa'
  | 'missing_required_parties'
  | 'low_confidence';

export const ISSUE_LABELS: Record<ValidationIssueCode, string> = {
  noisy_photo: 'Photo is too noisy or grainy',
  blurred: 'Image is blurred or out of focus',
  tilted_document: 'Document is tilted — retake straight on',
  incomplete_crop: 'Document is cropped or incomplete',
  wrong_document_type: 'This does not look like the required document type',
  fake_or_suspicious_id: 'ID looks fake, altered, or not a real person photo (e.g. animal/meme)',
  not_a_government_id: 'Not a valid government-issued ID',
  missing_tax_declaration: 'Could not find Tax Declaration number',
  missing_owner: 'Could not find owner name on the document',
  missing_lot_or_barangay: 'Could not find lot / barangay details',
  unreadable_text: 'Text cannot be read clearly',
  not_an_spa: 'This does not look like a Special Power of Attorney',
  missing_required_parties: 'SPA is missing principal or attorney-in-fact',
  low_confidence: 'Overall confidence is too low to accept',
};

export type ValidationSeverity = 'ok' | 'warning' | 'error';

export interface DocValidation {
  valid: boolean;
  /** UI tone: ok=green, warning=amber, error=red */
  severity: ValidationSeverity;
  issues: ValidationIssueCode[];
  /** Full user-facing sentence — never truncate in UI */
  message: string;
  /** 0–1 */
  confidence: number;
  /** Which engine decided validity */
  engine: 'gemini' | 'ocr_space_fallback' | 'none';
}

export interface GeminiDocAnalysis {
  engine: 'gemini';
  /** Which key/model pair produced this result (fallback chain may differ per call). */
  model: string;
  text: string;
  validation: DocValidation;
  propertyInfo: Partial<PropertyInfo>;
  requestorName: string | null;
}

export const EMPTY_VALIDATION: DocValidation = {
  valid: false,
  severity: 'error',
  issues: [],
  message: 'Not checked yet',
  confidence: 0,
  engine: 'none',
};

/** Quality issues that only warn as long as the text is still readable. */
const SOFT_ISSUES = new Set<ValidationIssueCode>([
  'blurred',
  'tilted_document',
  'incomplete_crop',
  'noisy_photo',
  'low_confidence',
]);

/** Issues that mean the photo cannot be accepted at all. */
const HARD_ISSUES = new Set<ValidationIssueCode>([
  'wrong_document_type',
  'fake_or_suspicious_id',
  'not_a_government_id',
  'unreadable_text',
]);

/**
 * Decide final validity + severity from the photo-quality scan.
 * The verdict is readability only — a readable photo passes even when
 * names/numbers are missing or the document is a variant of the expected
 * type (an OCT is still a title).
 * - Hard issues (unreadable, not a document, fake ID) → error (valid=false)
 * - Readable with minor problems (blur, tilt, noise) → warning (valid=true)
 * - No issues → ok
 */
export function classifyValidation(input: {
  issues: ValidationIssueCode[];
  geminiValid: boolean;
  confidence: number;
  message: string;
}): DocValidation {
  const issues = [...new Set(input.issues)];
  const hard = issues.filter((i) => HARD_ISSUES.has(i));
  const soft = issues.filter((i) => SOFT_ISSUES.has(i));

  if (hard.length > 0 || input.confidence < 0.45) {
    const message = input.message || 'Document needs to be re-uploaded';
    return {
      valid: false,
      severity: 'error',
      issues,
      message,
      confidence: input.confidence,
      engine: 'gemini',
    };
  }

  if (soft.length > 0 || !input.geminiValid) {
    // Soft-only (or Gemini unsure but content readable) → warning, still proceed-able
    const message =
      input.message && input.message !== 'Document looks acceptable'
        ? input.message
        : `Accepted with warning: ${soft.map((c) => ISSUE_LABELS[c]).join('; ') || 'low confidence — please review'}`;
    return {
      valid: true,
      severity: 'warning',
      issues,
      message,
      confidence: input.confidence,
      engine: 'gemini',
    };
  }

  return {
    valid: true,
    severity: 'ok',
    issues: [],
    message: input.message || 'Document looks acceptable',
    confidence: input.confidence,
    engine: 'gemini',
  };
}

/** Short status line for the progress chip (may be shorter). */
export function validationStatusLine(v: DocValidation): string {
  if (v.severity === 'ok') return v.message;
  if (v.severity === 'warning') return v.message;
  return v.message;
}

/** Full multi-line detail for the card / modal (never truncated by us). */
export function formatValidationDetail(v: DocValidation): string {
  const parts: string[] = [];
  if (v.message) parts.push(v.message);
  const labels = v.issues.map((c) => ISSUE_LABELS[c] ?? c);
  if (labels.length) {
    // Avoid duplicating if message already lists them
    const missing = labels.filter((l) => !v.message.includes(l));
    if (missing.length) parts.push(`Issues: ${missing.join(' · ')}`);
  }
  return parts.join('\n');
}

const PRIMARY_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
  (import.meta.env.GEMINI_API_KEY as string | undefined) ||
  '';

const PRIMARY_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
  (import.meta.env.GEMINI_MODEL as string | undefined) ||
  'gemini-2.5-flash';

/** Extra keys/models tried automatically when the primary pair fails. */
const FALLBACK_API_KEYS = splitList(
  import.meta.env.VITE_GEMINI_FALLBACK_API_KEYS as string | undefined,
);
const FALLBACK_MODELS = splitList(
  import.meta.env.VITE_GEMINI_FALLBACK_MODELS as string | undefined,
);

/** Per-pair request timeout — one hanging model must not stall the upload. */
const GEMINI_TIMEOUT_MS = 30_000;

/** Model families that cannot judge document photos. */
const NON_DOCUMENT_MODEL =
  /tts|image|live|transcribe|computer-use|native-audio|omni|lyria|veo|embedding|audio/i;

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface GeminiCandidate {
  /** Model id recorded in results — says which model judged the document. */
  label: string;
  apiKey: string;
  model: string;
}

/**
 * Ordered (key, model) pairs: primary first, then primary key with fallback
 * models, then fallback keys. Quota is tracked per key+model pair, so a
 * different pair can still succeed when one is exhausted (429), overloaded
 * (503), or deprecated (404).
 */
export function buildGeminiCandidates(
  primaryKey: string,
  primaryModel: string,
  fallbackKeys: string[],
  fallbackModels: string[],
): GeminiCandidate[] {
  const keys = [primaryKey, ...fallbackKeys].filter((k) => k.length > 8);
  const models = [primaryModel, ...fallbackModels].filter(Boolean);
  const out: GeminiCandidate[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    for (const model of models) {
      const id = `${key}::${model}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({
        label: key === primaryKey ? model : `${model} (fallback key)`,
        apiKey: key,
        model,
      });
    }
  }
  return out;
}

/** The configured fallback chain for this build. */
export function getGeminiCandidates(): GeminiCandidate[] {
  return buildGeminiCandidates(PRIMARY_API_KEY, PRIMARY_MODEL, FALLBACK_API_KEYS, FALLBACK_MODELS);
}

/**
 * Pick document-capable Gemini models from a ListModels response,
 * best-first: flash > pro > flash-lite > anything else.
 */
export function pickFallbackGeminiModels(
  models: Array<{ name: string; supportedGenerationMethods?: string[] }>,
): string[] {
  const usable = models
    .map((m) => ({
      name: m.name.replace(/^models\//, ''),
      methods: m.supportedGenerationMethods ?? [],
    }))
    .filter((m) => m.name.startsWith('gemini'))
    .filter((m) => m.methods.length === 0 || m.methods.includes('generateContent'))
    .filter((m) => !NON_DOCUMENT_MODEL.test(m.name))
    .map((m) => m.name);
  const rank = (n: string) => (/lite/.test(n) ? 2 : /flash/.test(n) ? 0 : /pro/.test(n) ? 1 : 3);
  return [...new Set(usable)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function pairId(c: GeminiCandidate): string {
  return `${c.apiKey}::${c.model}`;
}

/** Pairs that are gone for good this session (deprecated model, daily quota spent). */
const deadPairs = new Set<string>();
/** Transient failures (overload/timeout) — skip the pair briefly so uploads stay fast. */
const coolingPairs = new Map<string, number>();
const COOLDOWN_MS = 60_000;
/** The pair that answered last time — tried first on the next upload. */
let preferredCandidate: GeminiCandidate | null = null;
/** Cache of auto-discovered models (ListModels), fetched only when the chain fails. */
let discoveredCache: GeminiCandidate[] | null = null;

function isDeadPair(status: number, body: string): boolean {
  if (status === 404) return true;
  return status === 429 && /per day/i.test(body);
}

/**
 * Automatically search for usable Gemini models via the ListModels API.
 * Runs only after every configured pair has failed — quota is per key+model,
 * so a model nobody configured may still have free quota available.
 */
async function discoverGeminiCandidates(): Promise<GeminiCandidate[]> {
  if (discoveredCache) return discoveredCache;
  const out: GeminiCandidate[] = [];
  const seen = new Set<string>();
  for (const key of [PRIMARY_API_KEY, ...FALLBACK_API_KEYS].filter((k) => k.length > 8)) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}&pageSize=200`,
        { signal: AbortSignal.timeout(15_000) },
      );
      if (!res.ok) continue;
      const json = (await res.json()) as {
        models?: Array<{ name: string; supportedGenerationMethods?: string[] }>;
      };
      for (const model of pickFallbackGeminiModels(json.models ?? [])) {
        const id = `${key}::${model}`;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ label: `${model} (auto)`, apiKey: key, model });
      }
    } catch {
      // Discovery is best-effort — the next key may still list its models.
    }
  }
  discoveredCache = out;
  return out;
}

const DOC_LABELS: Record<DocumentType, string> = {
  deed_of_sale: 'Deed of Sale / Donation / Extra Judicial Settlement (certified copy from ROD)',
  title: 'Electronic copy of Transfer Certificate of Title (TCT/CCT)',
  tax_declaration: 'Latest Tax Declaration of the property',
  technical_description: 'Technical Description / Survey Plan',
  valid_id: 'Valid government-issued photo ID of the person transacting',
  spa: 'Special Power of Attorney (SPA) from the registered owner',
  survey_plan: 'Survey Plan approved by LMB-DENR or Cadastral Map',
  cenro_certification: 'CENRO certification (alienable and disposable area)',
  affidavit_ownership: 'Affidavit of Ownership and/or Sworn Statement',
  affidavit_possession: 'Affidavit of long, continuous and notorious possession',
  barangay_cert_possessor: 'Barangay certification of possessor/occupant',
  purpose_letter: 'Handwritten or printed purpose note (write it yourself on paper)',
};

/** Types where we autofill property / requestor fields. */
const PROPERTY_DOCS: DocumentType[] = ['tax_declaration', 'title', 'deed_of_sale'];
const REQUESTOR_DOCS: DocumentType[] = ['spa', 'valid_id'];

export function isGeminiConfigured(): boolean {
  return getGeminiCandidates().length > 0;
}

function buildPrompt(docType: DocumentType): string {
  const label = DOC_LABELS[docType] ?? docType;

  return `You are a document assistant for a Philippine Municipal Assessor online application.
Uploaded document expected: ${label}

Judge the PHOTO QUALITY only. Your verdict must say whether the photo is
readable — NOT whether every name or number is present. Do not transcribe
the whole document.

VALIDITY RULES:
1. Readable text with minor problems → valid=true, issues: blurred | tilted_document | noisy_photo | incomplete_crop
2. Slight tilt is ACCEPTABLE when the text is readable → valid=true, issue: tilted_document
3. Text cannot be read properly / pure noise / cropped so text is lost → valid=false, issue: unreadable_text
4. The photo is not a document at all (random picture, animal, meme) → valid=false, issue: wrong_document_type
5. valid_id only: fake or joke ID (cartoon, animal portrait, obviously altered) → valid=false, issue: fake_or_suspicious_id or not_a_government_id
6. Readable but you are not fully sure → valid=true, issue: low_confidence

A variant of the expected type is fine (e.g. an Original Certificate of Title is still a title).
Missing names or numbers must NEVER make the photo fail.

OPTIONAL EXTRACTION (only if clearly visible — leave blank instead of guessing):
ownerName, taxDeclarationNumbers, titleNo, lotNo, blockNo, streetName, barangay,
requestorName (name printed on a valid_id / attorney-in-fact on an SPA)

Return ONLY JSON matching the schema.
confidence is 0..1 (how readable the photo is). message is a short user-facing
English sentence about the photo quality. Keep "text" empty or a very short excerpt.

JSON schema:
{
  "valid": boolean,
  "issues": string[],
  "message": string,
  "confidence": number,
  "text": string,
  "ownerName": string,
  "taxDeclarationNumbers": string[],
  "titleNo": string,
  "lotNo": string,
  "blockNo": string,
  "streetName": string,
  "barangay": string,
  "requestorName": string
}

issues must be a subset of: blurred, tilted_document, noisy_photo, incomplete_crop, unreadable_text, wrong_document_type, fake_or_suspicious_id, not_a_government_id, low_confidence`;
}

async function fileToJpegDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    // PDFs / other: pass through data URL (Gemini accepts PDF inline in many cases)
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error ?? new Error('read failed'));
      r.readAsDataURL(file);
    });
  }

  const original = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error('read failed'));
    r.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('img load failed'));
      el.src = original;
    });
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return original;
  }
}

function normalizeIssues(raw: unknown): ValidationIssueCode[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(Object.keys(ISSUE_LABELS) as ValidationIssueCode[]);
  return [...new Set(raw.map((x) => String(x)))].filter((x): x is ValidationIssueCode =>
    allowed.has(x as ValidationIssueCode),
  );
}

function sanitizePropertyFields(json: Record<string, unknown>, docType: DocumentType): {
  propertyInfo: Partial<PropertyInfo>;
  requestorName: string | null;
} {
  const propertyInfo: Partial<PropertyInfo> = {};
  let requestorName: string | null = null;

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

  if (PROPERTY_DOCS.includes(docType)) {
    const owner = str(json.ownerName);
    if (owner && looksLikePersonName(owner)) propertyInfo.ownerName = owner;

    const tds = Array.isArray(json.taxDeclarationNumbers)
      ? (json.taxDeclarationNumbers as unknown[]).map((x) => str(x)).filter(Boolean)
      : [];
    if (tds.length) propertyInfo.taxDeclarations = tds.slice(0, 20);

    const title = str(json.titleNo);
    if (title && !/^(19|20)\d{2}$/.test(title)) propertyInfo.titleNo = title;

    const lot = str(json.lotNo);
    if (lot && !/^(19|20)\d{2}$/i.test(lot) && !/^(no|number)$/i.test(lot)) {
      propertyInfo.lotNo = lot;
    }
    const block = str(json.blockNo);
    if (block && !/^(19|20)\d{2}$/i.test(block) && !/^(no|number)$/i.test(block)) {
      propertyInfo.blockNo = block;
    }
    const street = str(json.streetName);
    if (street) propertyInfo.streetName = street;

    const brgy = str(json.barangay);
    if (brgy) {
      const match = BARANGAYS.find((b) => b.toUpperCase() === brgy.toUpperCase());
      if (match) propertyInfo.barangay = match;
    }
  }

  if (REQUESTOR_DOCS.includes(docType)) {
    const name = str(json.requestorName);
    if (name && looksLikePersonName(name)) requestorName = name;
  }

  return { propertyInfo, requestorName };
}

/**
 * Analyze + validate one upload with Gemini.
 * Selection is automatic: the pair that worked last time, then the configured
 * (key, model) chain, then — if everything is exhausted/overload/deprecated —
 * any usable Gemini model found via the ListModels API. Permanent failures
 * (404, daily quota) are skipped for the rest of the session.
 * Throws only when every pair fails — caller should fall back to OCR.space.
 */
export async function analyzeWithGemini(
  file: File,
  docType: DocumentType,
  onProgress?: (pct: number) => void,
): Promise<GeminiDocAnalysis> {
  const configured = getGeminiCandidates();
  if (configured.length === 0 && !preferredCandidate) {
    throw new Error('Gemini API key not configured');
  }

  onProgress?.(20);
  const dataUrl = await fileToJpegDataUrl(file);
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma); // data:image/jpeg;base64
  const data = dataUrl.slice(comma + 1);
  const mimeMatch = meta.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] || (file.type || 'application/octet-stream');

  onProgress?.(40);

  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: buildPrompt(docType) },
          { inline_data: { mime_type: mimeType, data } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const failures: string[] = [];
  const tried = new Set<string>();

  const tryCandidate = async (candidate: GeminiCandidate): Promise<GeminiDocAnalysis | null> => {
    const id = pairId(candidate);
    if (tried.has(id)) return null;
    tried.add(id);
    if (deadPairs.has(id)) return null;
    if (Date.now() < (coolingPairs.get(id) ?? 0)) return null;

    const fail = (reason: string, permanent = false) => {
      failures.push(`${candidate.label}: ${reason}`);
      if (permanent) {
        deadPairs.add(id);
        coolingPairs.delete(id);
      } else {
        coolingPairs.set(id, Date.now() + COOLDOWN_MS);
      }
    };

    let res: Response;
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${candidate.model}:generateContent?key=${encodeURIComponent(candidate.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        },
      );
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
      return null;
    }

    onProgress?.(75);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      failures.push(`${candidate.label}: HTTP ${res.status} ${errText.slice(0, 120)}`);
      if (isDeadPair(res.status, errText)) {
        deadPairs.add(id);
        coolingPairs.delete(id);
      } else {
        coolingPairs.set(id, Date.now() + COOLDOWN_MS);
      }
      return null;
    }

    try {
      const json = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (!text.trim()) {
        fail('empty response');
        return null;
      }

      let parsed: Record<string, unknown>;
      try {
        // Strip accidental markdown fences
        const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
        parsed = JSON.parse(cleaned) as Record<string, unknown>;
      } catch {
        fail('non-JSON response');
        return null;
      }

      onProgress?.(95);

      const issues = normalizeIssues(parsed.issues);
      const confidence =
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5;
      const geminiValid = parsed.valid === true;
      const message =
        typeof parsed.message === 'string' && parsed.message.trim()
          ? parsed.message.trim()
          : geminiValid
            ? 'Document looks acceptable'
            : 'Document needs to be re-uploaded';

      const { propertyInfo, requestorName } = sanitizePropertyFields(parsed, docType);
      const rawText = typeof parsed.text === 'string' ? parsed.text : '';

      // Verdict is photo-quality only: extracted fields never affect validity.
      const validation = classifyValidation({
        issues,
        geminiValid,
        confidence,
        message,
      });

      onProgress?.(100);

      preferredCandidate = candidate;
      return {
        engine: 'gemini',
        model: candidate.label,
        text: rawText,
        validation,
        propertyInfo,
        requestorName,
      };
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
      return null;
    }
  };

  // 1) pair that worked last time, 2) configured chain, 3) auto-search
  const firstWave: GeminiCandidate[] = [];
  if (preferredCandidate) firstWave.push(preferredCandidate);
  firstWave.push(...configured);
  for (const candidate of firstWave) {
    const analysis = await tryCandidate(candidate);
    if (analysis) return analysis;
  }

  // 3) nothing configured worked — search automatically for any usable model.
  //    Cap fresh attempts per call; cooldowns make later uploads skip the dead ones.
  const discovered = await discoverGeminiCandidates();
  let autoAttempts = 0;
  for (const candidate of discovered) {
    const id = pairId(candidate);
    if (tried.has(id) || deadPairs.has(id) || Date.now() < (coolingPairs.get(id) ?? 0)) continue;
    if (autoAttempts >= 10) break;
    autoAttempts += 1;
    const analysis = await tryCandidate(candidate);
    if (analysis) return analysis;
  }

  throw new Error(`Every Gemini model failed — ${failures.join('; ') || 'all models unavailable'}`);
}

/**
 * Fallback validation when Gemini is unavailable.
 * OCR.space only gives text, so the check is readability only:
 * no text found → fail; text found → pass. Field presence is never required.
 */
export function fallbackValidationFromText(text: string): DocValidation {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 8) {
    return {
      valid: false,
      severity: 'error',
      issues: ['unreadable_text', 'low_confidence'],
      message: 'Could not read this document (no text found)',
      confidence: 0.2,
      engine: 'ocr_space_fallback',
    };
  }

  return {
    valid: true,
    severity: 'ok',
    issues: [],
    message: 'Photo is readable (basic text scan)',
    confidence: 0.5,
    engine: 'ocr_space_fallback',
  };
}

export type { PropertyInfo, RequestorInfo };
