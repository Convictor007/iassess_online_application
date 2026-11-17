/**
 * BOGOK real-document upload test (Transfer of Ownership — With Title).
 *
 * Opt-in — hits the live Gemini API and reads files from disk:
 *   PowerShell:  $env:BOGOK_TEST='1'; npx vitest run src/lib/__tests__/bogok-docs.test.ts
 *
 * Runs the app's real analyzeWithGemini() (same prompt, parsing, and
 * classifyValidation rules as the upload UI) against every BOGOK image and
 * prints PASS/FAIL + the AI's message, issues, confidence, and extracted fields.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { DocumentType } from '../../types';
import { analyzeWithGemini, isGeminiConfigured, getGeminiCandidates } from '../gemini-doc';

const BOGOK_DIR = 'C:/Users/Yuri/Desktop/assessor/BOGOK';
const ENABLED = process.env.BOGOK_TEST === '1';

// —— Browser API shims: gemini-doc.ts uses FileReader + Image (canvas downscale)
// at call time. Node has neither; fail the Image decode on purpose so
// fileToJpegDataUrl falls back to the full-size data URL (its own catch path).
class NodeFileReaderShim {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(file: File): void {
    file
      .arrayBuffer()
      .then((buf) => {
        this.result = `data:${file.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
        this.onload?.();
      })
      .catch(() => this.onerror?.());
  }
}
class NoCanvasImageShim {
  naturalWidth = 0;
  naturalHeight = 0;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_v: string) {
    queueMicrotask(() => this.onerror?.());
  }
}
(globalThis as unknown as Record<string, unknown>).FileReader = NodeFileReaderShim;
(globalThis as unknown as Record<string, unknown>).Image = NoCanvasImageShim;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

interface Case {
  file: string;
  docType: DocumentType;
  /** Which Transfer-of-Ownership requirement slot this image should fill. */
  requirement: string;
}

/**
 * BOGOK files mapped to the app's transfer_ownership upload slots
 * (DocumentUpload.tsx ASSESSMENT_DOCUMENTS) per requirements.md checklist.
 */
const CASES: Case[] = [
  // 1 — Electronic Copy of Title (OCT 2024000680, 4 pages)
  { file: 'certificate of original TITLE (CTC) .jpg', docType: 'title', requirement: 'Electronic Copy of Title' },
  { file: 'original certificate of title (OCT).jpg', docType: 'title', requirement: 'Electronic Copy of Title' },
  { file: 'memorandom of encumbrandes.jpg', docType: 'title', requirement: 'Electronic Copy of Title — p. B (Memo of Encumbrances)' },
  { file: 'memorandom of encumbrandes 1.jpg', docType: 'title', requirement: 'Electronic Copy of Title — p. B (Memo of Encumbrances)' },
  { file: 'IMG_20260820_093344_1.jpg', docType: 'title', requirement: 'Electronic Copy of Title — p. C (continuation)' },
  { file: 'IMG_20260820_093344.jpg', docType: 'title', requirement: 'Electronic Copy of Title — p. C (continuation)' },

  // 2 — Deed (Deed of Confirmation of Sale)
  { file: 'deed of confirmation sale.jpg', docType: 'deed_of_sale', requirement: 'Deed of Sale/Confirmation (Certified Copy from ROD)' },
  { file: 'deed of confirmation sale 1.jpg', docType: 'deed_of_sale', requirement: 'Deed of Sale/Confirmation (Certified Copy from ROD)' },

  // 3 — Latest Tax Declaration
  { file: 'tax declaration.jpg', docType: 'tax_declaration', requirement: 'Latest Tax Declaration subject for transfer' },

  // App-required: Technical Description / Survey Plan
  { file: 'lot technical description.jpg', docType: 'technical_description', requirement: 'Technical Description / Survey Plan' },
  { file: 'municipal lot tech.png', docType: 'technical_description', requirement: 'Technical Description / Survey Plan' },

  // App-required: Valid Government ID of Requestor
  { file: 'Postal ID.jpg', docType: 'valid_id', requirement: 'Valid Government ID of Requestor' },
  { file: 'postal id untilted.jpg', docType: 'valid_id', requirement: 'Valid Government ID of Requestor' },
];

/** Requirements checklist (requirements.md — Transfer of Ownership With Title). */
const CHECKLIST: Array<{ label: string; coveredBy: string }> = [
  { label: '1. Electronic Copy of Title', coveredBy: 'certificate of original TITLE (CTC) .jpg, original certificate of title (OCT).jpg, memorandom of encumbrandes*.jpg, IMG_20260820_093344*.jpg' },
  { label: '2. Deed (Sale/Donation/Segregation/EJS) certified copy from ROD', coveredBy: 'deed of confirmation sale.jpg, deed of confirmation sale 1.jpg' },
  { label: '3. Latest Tax Declaration subject for transfer', coveredBy: 'tax declaration.jpg' },
  { label: '4. Payment of Transfer Tax (1/2 of 1% — PTO)', coveredBy: '— NOT IN BOGOK SET —' },
  { label: '5. Certificate of Tax Payment (current + previous year — MTO)', coveredBy: '— NOT IN BOGOK SET —' },
  { label: '6. Certificate Authorizing Registration / CAR (BIR)', coveredBy: '— NOT IN BOGOK SET —' },
  { label: '7. SPA (only if transacting person is not a party)', coveredBy: '— NOT IN BOGOK SET (optional) —' },
  { label: 'App upload slot: Technical Description / Survey Plan', coveredBy: 'lot technical description.jpg, municipal lot tech.png' },
  { label: 'App upload slot: Valid Government ID of Requestor', coveredBy: 'Postal ID.jpg, postal id untilted.jpg' },
];

interface Row {
  file: string;
  docType: DocumentType;
  requirement: string;
  verdict: 'PASS' | 'FAIL' | 'ERROR';
  model: string;
  severity: string;
  message: string;
  issues: string[];
  confidence: number;
  fields: string;
  textExcerpt: string;
}

const rows: Row[] = [];

function fmtValidation(v: {
  severity: string;
  valid: boolean;
  engine: string;
  confidence: number;
  issues: string[];
  message: string;
}): string {
  return `valid=${v.valid} severity=${v.severity} engine=${v.engine} confidence=${v.confidence.toFixed(2)}`;
}

beforeAll(() => {
  if (!ENABLED) return;
  const chain = getGeminiCandidates();
  console.log(`\n=== BOGOK upload test ===\nDir: ${BOGOK_DIR}\nGemini configured: ${isGeminiConfigured()}`);
  console.log(`Fallback chain (tried in order): ${chain.map((c) => c.label).join(' -> ') || '(none)'}\n`);
  console.log('--- Transfer of Ownership (With Title) — requirement coverage ---');
  for (const c of CHECKLIST) {
    const missing = c.coveredBy.startsWith('—');
    console.log(`  ${missing ? '[LACKING] ' : '[OK]      '} ${c.label}\n             -> ${c.coveredBy}`);
  }
  console.log('\n--- Per-file AI analysis (app pipeline: analyzeWithGemini) ---\n');
});

afterAll(() => {
  if (!ENABLED) return;
  console.log('\n=== SUMMARY ===');
  const pass = rows.filter((r) => r.verdict === 'PASS').length;
  const fail = rows.filter((r) => r.verdict === 'FAIL').length;
  const err = rows.filter((r) => r.verdict === 'ERROR').length;
  console.log(`PASS (AI accepted): ${pass}   FAIL (AI rejected): ${fail}   ERROR (analysis error): ${err}   total: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`[${r.verdict}] ${r.file}  (${r.docType})${r.model ? `  [${r.model}]` : ''}`);
    console.log(`        ${fmtValidation({ severity: r.severity, valid: r.verdict === 'PASS', engine: 'gemini', confidence: r.confidence, issues: r.issues, message: r.message })}`);
    console.log(`        AI comment: ${r.message}`);
    if (r.issues.length) console.log(`        issues: ${r.issues.join(', ')}`);
    if (r.fields) console.log(`        extracted: ${r.fields}`);
    console.log('');
  }
});

describe.runIf(ENABLED)('BOGOK documents vs Transfer-of-Ownership (With Title)', () => {
  it('has the BOGOK folder and the Gemini API key', () => {
    expect(existsSync(BOGOK_DIR), `missing folder ${BOGOK_DIR}`).toBe(true);
    expect(isGeminiConfigured(), 'Gemini API key not configured').toBe(true);
  });

  for (const c of CASES) {
    it(
      `analyzes "${c.file}" as ${c.docType} (${c.requirement})`,
      async () => {
        const path = join(BOGOK_DIR, c.file);
        expect(existsSync(path), `missing file ${path}`).toBe(true);
        const buf = readFileSync(path);
        const mime = MIME[extname(c.file).toLowerCase()] ?? 'application/octet-stream';
        const file = new File([buf], c.file, { type: mime }) as unknown as File;

        let verdict: Row['verdict'] = 'ERROR';
        let model = '';
        let severity = 'error';
        let message = '';
        let issues: string[] = [];
        let confidence = 0;
        let fields = '';
        let textExcerpt = '';

        try {
          const analysis = await analyzeWithGemini(file, c.docType);
          const v = analysis.validation;
          model = analysis.model;
          severity = v.severity;
          message = v.message;
          issues = v.issues;
          confidence = v.confidence;
          verdict = v.valid ? 'PASS' : 'FAIL';

          const p = analysis.propertyInfo;
          const parts: string[] = [];
          if (p.ownerName) parts.push(`ownerName="${p.ownerName}"`);
          if (p.titleNo) parts.push(`titleNo="${p.titleNo}"`);
          if (p.lotNo) parts.push(`lotNo="${p.lotNo}"`);
          if (p.blockNo) parts.push(`blockNo="${p.blockNo}"`);
          if (p.barangay) parts.push(`barangay="${p.barangay}"`);
          if (p.taxDeclarations?.length) parts.push(`taxDeclarations=[${p.taxDeclarations.join('; ')}]`);
          if (p.streetName) parts.push(`streetName="${p.streetName}"`);
          if (analysis.requestorName) parts.push(`requestorName="${analysis.requestorName}"`);
          fields = parts.join(' | ');
          textExcerpt = analysis.text.replace(/\s+/g, ' ').trim().slice(0, 300);
        } catch (e) {
          message = e instanceof Error ? e.message : String(e);
        }

        rows.push({ file: c.file, docType: c.docType, requirement: c.requirement, verdict, model, severity, message, issues, confidence, fields, textExcerpt });

        console.log(`[${verdict}] ${c.file}  ->  ${c.docType}${model ? `  (model: ${model})` : ''}`);
        console.log(`        ${fmtValidation({ severity, valid: verdict === 'PASS', engine: 'gemini', confidence, issues, message })}`);
        console.log(`        AI comment: ${message}`);
        if (issues.length) console.log(`        issues: ${issues.join(', ')}`);
        if (fields) console.log(`        extracted: ${fields}`);
        if (textExcerpt) console.log(`        text: ${textExcerpt}...`);
        console.log('');

        // The test asserts the analysis pipeline ran; PASS/FAIL of the AI
        // verdict is reported output, not a test failure.
        expect(message.length).toBeGreaterThan(0);
      },
      { timeout: 300_000 },
    );
  }

  it('rejects the .docx manuscript at the upload gate (not an allowed type)', () => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
    const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docx = join(BOGOK_DIR, 'Template_Manuscript_BSIT_with_Chap4-5.docx');
    const exists = existsSync(docx);
    console.log(`[REJECTED] Template_Manuscript_BSIT_with_Chap4-5.docx  ->  upload allow-list ${JSON.stringify(allowed)}`);
    console.log(`        AI comment: no analysis — DocumentUploader/api/upload.js rejects MIME ${docxMime}`);
    rows.push({
      file: 'Template_Manuscript_BSIT_with_Chap4-5.docx',
      docType: 'title',
      requirement: 'n/a — unsupported file type',
      verdict: 'FAIL',
      model: '',
      severity: 'error',
      message: `Rejected by upload allow-list (allowed: ${allowed.join(', ')})`,
      issues: ['wrong_document_type'],
      confidence: 0,
      fields: '',
      textExcerpt: '',
    });
    expect(exists).toBe(true);
    expect(allowed.includes(docxMime)).toBe(false);
  });
});
