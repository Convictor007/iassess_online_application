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

/** Issues that can be soft (warning) when critical fields are still readable. */
const SOFT_ISSUES = new Set<ValidationIssueCode>([
  'tilted_document',
  'incomplete_crop',
  'noisy_photo',
  'low_confidence',
]);

const HARD_ISSUES = new Set<ValidationIssueCode>([
  'wrong_document_type',
  'fake_or_suspicious_id',
  'not_a_government_id',
  'missing_tax_declaration',
  'unreadable_text',
  'not_an_spa',
  'missing_required_parties',
  'blurred',
  'missing_owner',
]);

/**
 * Decide final validity + severity after Gemini (or local re-checks).
 * - Hard issues → error (valid=false)
 * - Only soft issues + readable critical fields → warning (valid=true)
 * - No issues → ok
 */
export function classifyValidation(input: {
  docType: DocumentType;
  issues: ValidationIssueCode[];
  geminiValid: boolean;
  confidence: number;
  message: string;
  hasReadableIdentity: boolean;
  hasPropertyFields: boolean;
}): DocValidation {
  const issues = [...new Set(input.issues)];
  const hard = issues.filter((i) => HARD_ISSUES.has(i));
  const soft = issues.filter((i) => SOFT_ISSUES.has(i));

  // Critical content must exist for property docs / IDs
  const contentOk =
    input.docType === 'tax_declaration' || input.docType === 'title' || input.docType === 'deed_of_sale'
      ? input.hasPropertyFields
      : input.docType === 'valid_id'
        ? input.hasReadableIdentity
        : input.docType === 'spa'
          ? input.hasReadableIdentity || input.geminiValid
          : true;

  if (hard.length > 0 || !contentOk || input.confidence < 0.45) {
    let message = input.message;
    if (hard.includes('wrong_document_type') && !message.includes('type')) {
      message = message || 'This does not look like the required document type';
    }
    if (!message) message = 'Document needs to be re-uploaded';
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

const GEMINI_API_KEY =
  (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
  (import.meta.env.GEMINI_API_KEY as string | undefined) ||
  '';

const GEMINI_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
  (import.meta.env.GEMINI_MODEL as string | undefined) ||
  'gemini-2.5-flash';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
  return GEMINI_API_KEY.length > 8;
}

function buildPrompt(docType: DocumentType): string {
  const label = DOC_LABELS[docType] ?? docType;
  const barangayList = BARANGAYS.join(', ');

  const fieldRules =
    docType === 'tax_declaration' || docType === 'title' || docType === 'deed_of_sale'
      ? `Extract property fields when clearly visible:
- ownerName: registered owner full name (only if labeled or clearly the owner)
- taxDeclarationNumbers: array of TD numbers (e.g. F-001-12345)
- titleNo: TCT/CCT number if present
- lotNo, blockNo, streetName
- barangay: must be one of: ${barangayList}`
      : docType === 'spa'
        ? `Extract requestorName: the attorney-in-fact / representative name (not the principal), only if clearly labeled.`
        : docType === 'valid_id'
          ? `Extract requestorName: the name printed on the ID (surname + given name as shown).`
          : `Do not invent property fields. Text extraction only.`;

  const validityRules = `
VALIDITY RULES:
1. Photo quality issues → issues: noisy_photo | blurred | tilted_document | incomplete_crop
2. Wrong document type for: "${label}" → wrong_document_type
3. valid_id only: not a real government ID; cartoon/meme; animal/pet photo (e.g. monkey) used as portrait; obviously photoshopped or joke ID → fake_or_suspicious_id or not_a_government_id
   IMPORTANT for valid_id: a slightly tilted photo is ACCEPTABLE if the name on the ID is clearly readable — still add issue tilted_document but set valid=true in that case (we will treat it as a warning).
4. tax_declaration only: cannot find Tax Declaration number AND cannot identify owner/property context → missing_tax_declaration; missing owner when form clearly should show one → missing_owner
5. spa only: not an SPA → not_an_spa; missing principal or attorney-in-fact → missing_required_parties
6. Essentially unreadable / pure noise → unreadable_text
7. Low match confidence → low_confidence

Hard failures (valid=false): wrong_document_type, fake IDs, unreadable, missing critical fields for the doc type.
Soft warnings (valid=true, still list the issue): mild tilt when text/name is readable, mild crop noise when key fields are visible.

Do NOT invent owners or TD numbers. Prefer empty fields over guesses.

Return ONLY JSON matching the schema.`;

  return `You are a document assistant for a Philippine Municipal Assessor online application.
Uploaded document expected: ${label}

${fieldRules}
${validityRules}

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

issues must be a subset of: noisy_photo, blurred, tilted_document, incomplete_crop, wrong_document_type, fake_or_suspicious_id, not_a_government_id, missing_tax_declaration, missing_owner, missing_lot_or_barangay, unreadable_text, not_an_spa, missing_required_parties, low_confidence
confidence is 0..1. message is a short user-facing English sentence.`;
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
 * Analyze + validate one upload with Gemini (primary).
 * Throws on network/API failure — caller should fall back to OCR.space.
 */
export async function analyzeWithGemini(
  file: File,
  docType: DocumentType,
  onProgress?: (pct: number) => void,
): Promise<GeminiDocAnalysis> {
  if (!isGeminiConfigured()) {
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

  const body = {
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
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  onProgress?.(75);

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini returned empty response');

  let parsed: Record<string, unknown>;
  try {
    // Strip accidental markdown fences
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error('Gemini returned non-JSON');
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

  const hasPropertyFields = Boolean(
    propertyInfo.ownerName ||
      propertyInfo.taxDeclarations?.length ||
      propertyInfo.titleNo ||
      propertyInfo.lotNo ||
      propertyInfo.barangay,
  );
  const hasReadableIdentity = Boolean(requestorName && looksLikePersonName(requestorName));

  // Local hard rules on top of Gemini
  let localIssues = [...issues];
  let localMessage = message;
  if (docType === 'tax_declaration' && geminiValid && !hasPropertyFields) {
    localIssues = [...localIssues, 'missing_tax_declaration'];
    localMessage = 'Could not find Tax Declaration details on this image';
  }
  if (docType === 'valid_id' && geminiValid && !hasReadableIdentity) {
    // Gemini said ok but we couldn't parse a name — treat as unreadable identity
    localIssues = [...localIssues, 'unreadable_text'];
    localMessage = 'Could not read the name on this ID clearly';
  }

  const validation = classifyValidation({
    docType,
    issues: localIssues,
    geminiValid,
    confidence,
    message: localMessage,
    hasReadableIdentity,
    hasPropertyFields,
  });

  onProgress?.(100);

  return {
    engine: 'gemini',
    text: rawText,
    validation,
    propertyInfo,
    requestorName,
  };
}

/**
 * Fallback validation when Gemini is unavailable.
 * OCR.space only gives text — we cannot detect monkey IDs / tilt visually.
 * Heuristic: require readable text for most docs; require key fields for TD.
 */
export function fallbackValidationFromText(
  docType: DocumentType,
  text: string,
  propertyInfo: Partial<PropertyInfo>,
  requestorName: string | null,
): DocValidation {
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

  if (docType === 'tax_declaration') {
    const ok =
      Boolean(propertyInfo.ownerName) ||
      Boolean(propertyInfo.taxDeclarations?.length) ||
      Boolean(propertyInfo.titleNo);
    if (!ok) {
      return {
        valid: false,
        severity: 'error',
        issues: ['missing_tax_declaration'],
        message: 'OCR read text but could not find Tax Declaration details',
        confidence: 0.35,
        engine: 'ocr_space_fallback',
      };
    }
  }

  if (docType === 'valid_id' && !requestorName) {
    return {
      valid: false,
      severity: 'error',
      issues: ['unreadable_text'],
      message: 'Could not read the name on this ID',
      confidence: 0.35,
      engine: 'ocr_space_fallback',
    };
  }

  if (docType === 'spa' && !requestorName) {
    return {
      valid: true,
      severity: 'warning',
      issues: ['low_confidence'],
      message: 'Basic text scan only — full document check skipped',
      confidence: 0.45,
      engine: 'ocr_space_fallback',
    };
  }

  return {
    valid: true,
    severity: 'ok',
    issues: [],
    message: 'Document scan completed',
    confidence: 0.5,
    engine: 'ocr_space_fallback',
  };
}

export type { PropertyInfo, RequestorInfo };
