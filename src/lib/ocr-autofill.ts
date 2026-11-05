import type {
  DocumentType,
  PropertyInfo,
  RequestorInfo,
} from '../types';
import { BARANGAYS } from '../data/transactions';

/** Document types that can contribute autofill data. */
export type AutofillDocumentType = Extract<
  DocumentType,
  'tax_declaration' | 'spa' | 'valid_id' | 'title' | 'deed_of_sale'
>;

export type OcrDocStatus = 'idle' | 'processing' | 'done' | 'error' | 'skipped';

export interface OcrDocProgress {
  status: OcrDocStatus;
  /** 0–100 for the per-document bar */
  progress: number;
  message: string;
}

export type OcrStatusMap = Partial<Record<string, OcrDocProgress>>;

export interface OcrAutofillSources {
  property: AutofillDocumentType | null;
  requestor: 'spa' | 'valid_id' | 'owner_default' | null;
}

export interface OcrAutofillResult {
  propertyInfo: Partial<PropertyInfo>;
  requestorInfo: Partial<RequestorInfo>;
  sources: OcrAutofillSources;
  texts: Partial<Record<AutofillDocumentType, string>>;
  ran: boolean;
}

export const EMPTY_OCR_PROGRESS: OcrDocProgress = {
  status: 'idle',
  progress: 0,
  message: '',
};

const OCR_SPACE_API_KEY =
  (import.meta.env.VITE_OCR_SPACE_API_KEY as string | undefined) ||
  (import.meta.env.EXPO_PUBLIC_OCR_SPACE_API_KEY as string | undefined) ||
  'K88517214388957';

const OCR_SPACE_URL = 'https://api.ocr.space/parse/image';

const AUTOFILL_DOCS: AutofillDocumentType[] = [
  'tax_declaration',
  'spa',
  'valid_id',
  'title',
  'deed_of_sale',
];

export function isAutofillDocType(type: DocumentType): type is AutofillDocumentType {
  return (AUTOFILL_DOCS as DocumentType[]).includes(type);
}

const isImageFile = (file: File) => file.type.startsWith('image/');

const cleanLine = (line: string) =>
  line
    .replace(/[|]/g, ' ')
    .replace(/[“”"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const linesOf = (text: string) =>
  text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((l) => l.length > 0);

/** Words that never form a person name when used alone as tokens. */
const NAME_STOPWORDS = new Set([
  'owner', 'name', 'address', 'tax', 'declaration', 'title', 'lot', 'block',
  'barangay', 'republic', 'philippines', 'government', 'municipality',
  'assessor', 'assessment', 'certificate', 'transfer', 'property', 'singapore',
  'document', 'number', 'date', 'issued', 'status', 'class', 'area', 'value',
  'location', 'survey', 'street', 'sitio', 'purok', 'phase', 'section',
]);

/**
 * Strict person-name gate for autofill. Rejects OCR garbage like
 * "CEFE BFKA W: FRS FPINAE" while accepting typical PH names.
 */
export function looksLikePersonName(value: string): boolean {
  const v = value.trim().replace(/\s+/g, ' ');
  if (v.length < 5 || v.length > 70) return false;
  if (/\d/.test(v)) return false;
  // Noise markers common in bad OCR of forms
  if (/[{}[\]@#$%^*=+/\\|<>~_]|:{1,}/.test(v)) return false;
  if (/[.]{2,}|_{2,}|-{2,}/.test(v)) return false;

  const words = v.split(' ').filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;

  // Reject if any token is a form label / stopword
  for (const w of words) {
    if (NAME_STOPWORDS.has(w.toLowerCase().replace(/[.,]$/, ''))) return false;
  }
  if (NAME_STOPWORDS.has(v.toLowerCase())) return false;

  // Each word: starts with a letter; allow initials like "L."
  for (const w of words) {
    if (!/^[A-Za-zÀ-ÿ]/.test(w)) return false;
    if (w.length > 20) return false;
    const letters = w.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (letters.length < 1) return false;
    // Initial "L." / "J.R" style: letter + optional period(s)
    const isInitial = /^[A-Za-zÀ-ÿ]\.?$/.test(w);
    if (!isInitial && letters.length / w.length < 0.7) return false;
  }

  const lettersOnly = v.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (lettersOnly.length < 6) return false;

  // Vowel ratio: English/Filipino names need some vowels
  const vowels = (lettersOnly.match(/[AEIOUaeiou]/g) ?? []).length;
  const vowelRatio = vowels / lettersOnly.length;
  if (vowelRatio < 0.22 || vowelRatio > 0.65) return false;

  // Reject all-caps token soup (CEFE BFKA W FRS FPINAE)
  const isAllCaps = v === v.toUpperCase() && /[A-Z]{2}/.test(v);
  if (isAllCaps) {
    // Single-letter tokens (W) and consonant-only clusters (FRS, BFKA-like) are noise
    for (const w of words) {
      const t = w.replace(/[^A-Za-zÀ-ÿ]/g, '');
      if (t.length <= 1) return false;
      if (t.length >= 3 && !/[AEIOUaeiou]/i.test(t)) return false;
    }
    const solidWords = words.filter((w) => {
      const t = w.replace(/[^A-Za-zÀ-ÿ]/g, '');
      return t.length >= 3 && /[AEIOUaeiou]/.test(t);
    });
    if (solidWords.length < Math.max(2, Math.ceil(words.length * 0.75))) return false;
    const avgLen = lettersOnly.length / words.length;
    if (avgLen < 3.5) return false;
  }

  // Consonant-heavy short tokens without vowels in most words
  const wordsWithVowels = words.filter((w) => /[AEIOUaeiou]/i.test(w.replace(/[^A-Za-zÀ-ÿ]/g, '')));
  if (wordsWithVowels.length < Math.max(1, Math.ceil(words.length * 0.5))) return false;

  return true;
}

/** Confidence 0–1 for a candidate name; used only for logging/debug. */
export function nameConfidence(value: string): number {
  if (!looksLikePersonName(value)) return 0;
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, '');
  const vowels = (letters.match(/[AEIOUaeiou]/g) ?? []).length;
  const ratio = letters.length ? vowels / letters.length : 0;
  // Prefer mid vowel ratio (~0.4)
  const ratioScore = 1 - Math.min(1, Math.abs(ratio - 0.4) / 0.35);
  const lengthScore = Math.min(1, letters.length / 18);
  return Math.round((ratioScore * 0.6 + lengthScore * 0.4) * 100) / 100;
}

function normalizeTaxDec(value: string): string | null {
  const raw = value.trim().replace(/\s+/g, '');
  if (!raw || raw === '--') return null;
  const v = raw.toUpperCase();
  if (v === 'N/A' || v === 'NA') return 'N/A';

  // Reject pure years and obvious noise
  if (/^(19|20)\d{2}$/.test(v)) return null;
  if (v.length < 4 || v.length > 40) return null;
  if (!/[A-Za-z0-9]/.test(v)) return null;

  // Require digits AND (letters or hyphens) — pure letter soup is noise
  const hasDigit = /\d/.test(v);
  const hasLetter = /[A-Z]/.test(v);
  const hasHyphenOrSlash = /[-/]/.test(v);
  if (!hasDigit) return null;

  // PH-style TD: F-001-12345, 012-34-567-890-000, 12-34-56, etc.
  if (hasLetter && hasDigit) return raw;
  if (hasHyphenOrSlash && hasDigit && v.replace(/[^0-9]/g, '').length >= 4) {
    return raw;
  }
  // Bare long numeric IDs (10+ digits) like parcel numbers
  if (/^\d{8,}$/.test(v)) return raw;
  // Compact letter+digit like A1234567
  if (hasLetter && hasDigit && v.length >= 6) return raw;

  return null;
}

function findBarangay(text: string): string | null {
  // Explicit label: Barangay: X / Brgy. X where X matches a known barangay
  for (const b of BARANGAYS) {
    const bu = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:BRGY\\.?|BARANGAY)\\s*[:\\-]?\\s*${bu}\\b`, 'i');
    if (re.test(text)) return b;
  }
  // Known barangay as standalone token (OCR may drop the label)
  const upper = text.toUpperCase();
  for (const b of BARANGAYS) {
    if (new RegExp(`\\b${b.toUpperCase()}\\b`).test(upper)) return b;
  }
  // Common fallback label form even if list spelling differs slightly
  const labeled = text.match(
    /\b(?:brgy\.?|barangay)\s*[:\-]?\s*([A-Za-zÀ-ÿ\s'-]{3,40})/i,
  );
  if (labeled?.[1]) {
    const candidate = labeled[1].trim().replace(/[.,;:].*$/, '');
    const match = BARANGAYS.find(
      (b) => b.toUpperCase() === candidate.toUpperCase(),
    );
    if (match) return match;
    // Title-case single word that isn't a form label
    if (
      /^[A-Za-zÀ-ÿ\s'-]{3,40}$/.test(candidate) &&
      candidate.split(/\s+/).length <= 3 &&
      !/^(no|number|address|title|tax|declaration|owner|name)$/i.test(candidate)
    ) {
      // Only accept if it looks like a place (has vowel) — still prefer known list
      if (/[AEIOUaeiou]/.test(candidate)) {
        // Do NOT invent unknown barangays — leave null for manual select
      }
    }
  }
  return null;
}

function findTaxDecNumbers(text: string): string[] {
  const found = new Set<string>();

  // Labeled only first (higher confidence)
  const labeled = text.matchAll(
    /(?:tax\.?\s*dec(?:laration)?\.?\s*(?:no\.?|number|#)?\s*[:\-]?\s*)([A-Za-z0-9][A-Za-z0-9/-]{3,40})/gi,
  );
  for (const m of labeled) {
    const n = normalizeTaxDec(m[1]);
    if (n && n !== 'N/A') found.add(n);
  }

  // Strong PH TD patterns only (not every hyphenated token)
  const patterned = text.matchAll(
    /\b(?:[A-Z]{1,3}-\d{2,4}-\d{2,6}(?:-\d{1,6})?|\d{2,3}-\d{2}-\d{3}-\d{3}-\d{3})\b/g,
  );
  for (const m of patterned) {
    const n = normalizeTaxDec(m[0]);
    if (n) found.add(n);
  }

  return [...found].slice(0, 20);
}

function findTitleNo(text: string): string | null {
  const labeled = text.match(
    /(?:t\.?c\.?t\.?|c\.?c\.?t\.?|transfer certificate of title|certificate of title|title(?:\s*no\.?|number)?)\s*[:\-]?\s*([0-9]{1,10}(?:-[0-9]{1,10}){0,3})/i,
  );
  if (labeled?.[1]) {
    const t = labeled[1].trim();
    // Reject pure years used as titles
    if (!/^(19|20)\d{2}$/.test(t)) return t;
  }
  const tct = text.match(/\bTCT\s*(?:No\.?)?\s*([0-9][0-9-]{2,19})/i);
  if (tct?.[1]) {
    const t = tct[1].trim();
    if (!/^(19|20)\d{2}$/.test(t)) return t;
  }
  return null;
}

function isValidLotBlockValue(v: string): boolean {
  const t = v.trim();
  if (!t || t.length > 20) return false;
  if (/^(no|number|n\/a|na|none|lot|block)$/i.test(t)) return false;
  if (/^(19|20)\d{2}$/.test(t)) return false; // reject years
  if (!/[A-Za-z0-9]/.test(t)) return false;
  // Mostly alphanumeric
  const good = t.replace(/[^A-Za-z0-9/-]/g, '');
  return good.length >= 1 && good.length / t.length >= 0.7;
}

function findLotBlock(text: string): { lotNo?: string; blockNo?: string } {
  const out: { lotNo?: string; blockNo?: string } = {};
  const lot = text.match(
    /\b(?:lot\s*(?:no\.?|number|#))\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9/-]{0,20})/i,
  );
  const block = text.match(
    /\b(?:block\s*(?:no\.?|number|#))\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9/-]{0,20})/i,
  );
  if (lot?.[1] && isValidLotBlockValue(lot[1])) out.lotNo = lot[1].trim();
  if (block?.[1] && isValidLotBlockValue(block[1])) out.blockNo = block[1].trim();
  return out;
}

/**
 * Owner name ONLY from explicit labels — never from “first line that looks like a name”.
 * That fallback produced garbage like CEFE BFKA W: FRS FPINAE.
 */
function findOwnerName(lines: string[]): string | null {
  const labelStart =
    /^(?:registered\s+)?owner(?:'s)?(?:\s+(?:name|full\s+name))?\s*[:\-]\s*(.+)$/i;
  const ownerWordRe =
    /\b(?:registered\s+owner|owner(?:'s)?\s+name|name\s+of\s+owner|owner)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // "Owner: Juan Dela Cruz" / "Registered Owner — ..."
    const m = line.match(labelStart);
    if (m?.[1]) {
      const candidate = m[1].replace(/^[:-]\s*/, '').trim();
      if (looksLikePersonName(candidate)) return candidate;
    }

    // Label on its own line → next 1–2 lines are the name
    if (ownerWordRe.test(line)) {
      const after = line
        .replace(ownerWordRe, ' ')
        .replace(/^[:\-\s]+/, '')
        .replace(/\s+[:\-]\s*$/, '')
        .trim();
      // If label line still has a trailing name
      if (after && !/^(no\.?|number|address|title|tax|declaration)$/i.test(after)) {
        if (looksLikePersonName(after)) return after;
      }
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        // Skip nested labels
        if (/^(tax|title|lot|block|barangay|address|td|tct)/i.test(lines[j])) continue;
        if (looksLikePersonName(lines[j])) return lines[j];
      }
    }
  }
  return null;
}

function findSpaRequestor(lines: string[]): string | null {
  const patterns = [
    /attorney[-\s]in[-\s]fact\s*[:\-]\s*(.+)/i,
    /(?:representative|agent|attorney(?:-in-fact)?)\s*[:\-]\s*(.+)/i,
    /in\s+favor\s+of\s*[:\-]?\s*(.+)/i,
    /(?:i\s+hereby\s+)?(?:name|appoint|constitute)\s+(?:and\s+appoint\s+)?([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s.'-]{4,60}?)\s+(?:as|to\s+be)/i,
    /(?:do\s+hereby\s+name\s+and\s+constitute)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s.'-]{4,60})/i,
  ];

  for (const re of patterns) {
    for (const line of lines) {
      const m = line.match(re);
      if (m?.[1]) {
        const candidate = m[1]
          .replace(/[,;].*$/, '')
          .replace(/\s+of\s+legal\s+age.*$/i, '')
          .replace(/\s+of\s+legal\s+age.*$/i, '')
          .trim();
        if (looksLikePersonName(candidate)) return candidate;
      }
    }
  }

  const joined = lines.join('\n');
  const appoint = joined.match(
    /(?:appoint|constitute|name)\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s.'-]{4,60}?)\s+(?:as\s+)?(?:my\s+)?(?:true\s+)?(?:attorney|agent|representative)/i,
  );
  if (appoint?.[1] && looksLikePersonName(appoint[1].trim())) {
    return appoint[1].trim();
  }
  return null;
}

function findSpaPrincipal(lines: string[]): string | null {
  for (const line of lines) {
    const m = line.match(
      /^(?:i|we),?\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ\s.'-]{4,60}),?\s+(?:of\s+legal\s+age| Filipino|address)/i,
    );
    if (m?.[1] && looksLikePersonName(m[1].trim())) return m[1].trim();
  }
  return null;
}

function findIdName(lines: string[]): string | null {
  // PH ID common: SURNAME, GIVEN M.I. (surname may contain spaces)
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[A-ZÀ-Ÿ][A-ZÀ-Ÿ'\s]{1,30},\s*[A-ZÀ-Ÿ]/.test(trimmed)) {
      const parts = trimmed.split(',');
      if (parts.length >= 2) {
        const surname = parts[0].trim();
        const given = parts.slice(1).join(',').trim();
        const normalized = `${given} ${surname}`.replace(/\s+/g, ' ');
        if (looksLikePersonName(normalized)) return normalized;
        // Also try original order if it passes (some IDs: GIVEN, SURNAME)
        if (looksLikePersonName(trimmed)) return trimmed;
      }
    }
  }
  // Explicit "Name:" label
  for (const line of lines) {
    if (/\bname\b/i.test(line) && !/address|birth|sex|nationality|place/i.test(line)) {
      const after = line.replace(/^.*\bname\b\s*[:\-]?\s*/i, '').trim();
      if (looksLikePersonName(after)) return after;
    }
  }
  return null;
}

export function parsePropertyFromText(text: string): Partial<PropertyInfo> {
  const lines = linesOf(text);
  if (lines.length === 0) return {};

  const out: Partial<PropertyInfo> = {};
  const owner = findOwnerName(lines);
  if (owner) out.ownerName = owner;

  const tds = findTaxDecNumbers(text);
  if (tds.length > 0) out.taxDeclarations = tds;

  const titleNo = findTitleNo(text);
  if (titleNo) out.titleNo = titleNo;

  const { lotNo, blockNo } = findLotBlock(text);
  if (lotNo) out.lotNo = lotNo;
  if (blockNo) out.blockNo = blockNo;

  const barangay = findBarangay(text);
  if (barangay) out.barangay = barangay;

  return out;
}

export function parseRequestorFromSpa(text: string): Partial<RequestorInfo> {
  const lines = linesOf(text);
  if (lines.length === 0) return {};
  const name = findSpaRequestor(lines) ?? findSpaPrincipal(lines);
  if (!name) return {};
  return { name };
}

export function parseNameFromValidId(text: string): string | null {
  return findIdName(linesOf(text));
}

function fileToBase64DataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale large photos before OCR.space (free tier ~1MB; smaller = faster/cleaner).
 * Returns original data URL if canvas unavailable.
 */
async function prepareOcrImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const original = await fileToBase64DataUrl(file);
  if (!isImageFile(file)) {
    return { dataUrl: original, width: 0, height: 0 };
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image load failed'));
      el.src = original;
    });

    // Target max edge ~1600px — good for OCR without huge payloads
    const maxEdge = 1600;
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: original, width: img.naturalWidth, height: img.naturalHeight };

    ctx.drawImage(img, 0, 0, w, h);

    // Prefer JPEG for size; quality 0.85
    let dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    // If still huge (>900KB base64), drop quality
    if (dataUrl.length > 900_000) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    }
    return { dataUrl, width: w, height: h };
  } catch {
    return { dataUrl: original, width: 0, height: 0 };
  }
}

/**
 * OCR one file via OCR.space.
 * Returns '' on failure so callers can continue without throwing.
 */
export async function recognizeImageFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (!isImageFile(file) && file.type !== 'application/pdf') return '';

  try {
    onProgress?.(15);
    const prepared = await prepareOcrImage(file);
    onProgress?.(35);

    const form = new FormData();
    form.append('base64Image', prepared.dataUrl);
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'false');
    // Engine 2: best balance for printed PH forms on free tier
    form.append('OCREngine', '2');
    form.append('scale', 'true');
    form.append('isTable', 'true');
    form.append('detectOrientation', 'true');
    if (file.type === 'application/pdf') {
      form.append('filetype', 'PDF');
      // PDFs must be sent as original base64 (not re-encoded via canvas)
      form.set('base64Image', await fileToBase64DataUrl(file));
    }

    const res = await fetch(OCR_SPACE_URL, {
      method: 'POST',
      headers: { apikey: OCR_SPACE_API_KEY },
      body: form,
    });
    onProgress?.(75);

    if (!res.ok) {
      console.warn('[ocr-autofill] HTTP', res.status, res.statusText);
      return '';
    }

    const json = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | null;
      ErrorDetails?: string | null;
      ParsedResults?: Array<{ ParsedText?: string | null } | null> | null;
      OCRExitCode?: number | string;
    };

    onProgress?.(95);

    if (json.IsErroredOnProcessing) {
      console.warn('[ocr-autofill] API error:', json.ErrorMessage, json.ErrorDetails);
    }

    const parts = (json.ParsedResults ?? [])
      .map((r) => (typeof r?.ParsedText === 'string' ? r.ParsedText : ''))
      .filter(Boolean);
    const text = parts.join('\n').trim();

    if (import.meta.env.DEV) {
      console.info('[ocr-autofill] raw text for', file.name, {
        chars: text.length,
        preview: text.slice(0, 400),
      });
    }

    onProgress?.(100);
    return text;
  } catch (err) {
    console.warn('[ocr-autofill] recognize failed:', file.name, err);
    return '';
  }
}

/** Count non-empty fields that would be filled. */
function countFillFields(p: Partial<PropertyInfo>): number {
  let n = 0;
  if (p.ownerName) n++;
  if (p.taxDeclarations?.length) n++;
  if (p.titleNo) n++;
  if (p.lotNo) n++;
  if (p.blockNo) n++;
  if (p.streetName) n++;
  if (p.barangay) n++;
  return n;
}

/**
 * Extract fills from a single already-OCR'd text for one document type.
 * Only high-confidence values are kept.
 */
export function extractFromDocText(
  docType: AutofillDocumentType,
  text: string,
  into: OcrAutofillResult,
): { fieldsFilled: number } {
  if (!text.trim()) return { fieldsFilled: 0 };
  into.ran = true;
  into.texts[docType] = text;

  let fieldsFilled = 0;

  if (docType === 'tax_declaration' || docType === 'title' || docType === 'deed_of_sale') {
    const parsed = parsePropertyFromText(text);
    const preferExisting = into.sources.property === 'tax_declaration';
    for (const [k, v] of Object.entries(parsed) as [keyof PropertyInfo, string | string[]][]) {
      if (preferExisting && into.propertyInfo[k]) continue;
      if (k === 'taxDeclarations') {
        const existing = into.propertyInfo.taxDeclarations ?? [];
        const merged = [...existing];
        for (const td of v as string[]) {
          if (!merged.some((x) => x.toUpperCase() === td.toUpperCase())) merged.push(td);
        }
        if (merged.length > 0) {
          into.propertyInfo.taxDeclarations = merged;
        }
      } else if (!into.propertyInfo[k] && typeof v === 'string' && v.trim()) {
        into.propertyInfo[k] = v;
      }
    }
    fieldsFilled += countFillFields(parsed);
    if (parsed.ownerName || parsed.taxDeclarations?.length || parsed.titleNo) {
      if (!into.sources.property || docType === 'tax_declaration') {
        into.sources.property = docType;
      }
    }
  }

  if (docType === 'spa') {
    const parsed = parseRequestorFromSpa(text);
    if (parsed.name) {
      into.requestorInfo = { ...into.requestorInfo, ...parsed };
      into.sources.requestor = 'spa';
      fieldsFilled++;
    }
  }

  if (docType === 'valid_id' && !into.requestorInfo.name) {
    const name = parseNameFromValidId(text);
    if (name) {
      into.requestorInfo.name = name;
      into.sources.requestor = 'valid_id';
      fieldsFilled++;
    }
  }

  return { fieldsFilled };
}

/** Fill only empty / untouched property fields (user edits win). */
export function applyPropertyAutofill(
  current: PropertyInfo,
  fill: Partial<PropertyInfo>,
): PropertyInfo {
  const next: PropertyInfo = { ...current };
  if (!next.ownerName.trim() && fill.ownerName) next.ownerName = fill.ownerName;
  if (fill.taxDeclarations?.length) {
    const merged = [...next.taxDeclarations];
    for (const td of fill.taxDeclarations) {
      if (!merged.some((x) => x.toUpperCase() === td.toUpperCase())) merged.push(td);
    }
    next.taxDeclarations = merged;
  }
  if (!next.titleNo.trim() && fill.titleNo) next.titleNo = fill.titleNo;
  if (!next.lotNo.trim() && fill.lotNo) next.lotNo = fill.lotNo;
  if (!next.blockNo.trim() && fill.blockNo) next.blockNo = fill.blockNo;
  if (!next.streetName.trim() && fill.streetName) next.streetName = fill.streetName;
  if (!next.barangay.trim() && fill.barangay) next.barangay = fill.barangay;
  return next;
}

/** Fill only empty requestor fields. */
export function applyRequestorAutofill(
  current: RequestorInfo,
  fill: Partial<RequestorInfo>,
): RequestorInfo {
  const next: RequestorInfo = { ...current };
  if (!next.name.trim() && fill.name) next.name = fill.name;
  if (!next.address.trim() && fill.address) next.address = fill.address;
  if (!next.contactNumber.trim() && fill.contactNumber) next.contactNumber = fill.contactNumber;
  if (!next.email.trim() && fill.email) next.email = fill.email;
  if (!next.purpose.trim() && fill.purpose) next.purpose = fill.purpose;
  return next;
}

/**
 * Default requestor name to property owner when no SPA (or SPA had no name).
 */
export function defaultRequestorFromOwner(
  current: RequestorInfo,
  propertyInfo: PropertyInfo,
  sources: OcrAutofillSources,
): RequestorInfo {
  if (current.name.trim()) return current;
  if (sources.requestor === 'spa') return current;
  const owner = propertyInfo.ownerName.trim();
  if (!owner || !looksLikePersonName(owner)) return current;
  return { ...current, name: owner };
}

/** True if any tracked doc is still extracting. */
export function hasPendingOcr(statuses: OcrStatusMap): boolean {
  return AUTOFILL_DOCS.some((t) => statuses[t]?.status === 'processing');
}

/** True if any autofill doc was processed (done/error/skipped). */
export function hasAnyOcrActivity(statuses: OcrStatusMap): boolean {
  return AUTOFILL_DOCS.some((t) => {
    const s = statuses[t]?.status;
    return s === 'done' || s === 'error' || s === 'skipped';
  });
}

export function createEmptyOcrResult(): OcrAutofillResult {
  return {
    propertyInfo: {},
    requestorInfo: {},
    sources: { property: null, requestor: null },
    texts: {},
    ran: false,
  };
}

export { AUTOFILL_DOCS };
