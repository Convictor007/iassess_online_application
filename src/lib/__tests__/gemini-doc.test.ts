import { describe, it, expect } from 'vitest';
import {
  fallbackValidationFromText,
  classifyValidation,
  ISSUE_LABELS,
} from '../gemini-doc';

describe('fallbackValidationFromText', () => {
  it('rejects empty OCR text', () => {
    const v = fallbackValidationFromText('tax_declaration', '   ', {}, null);
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
    expect(v.engine).toBe('ocr_space_fallback');
    expect(v.issues).toContain('unreadable_text');
  });

  it('rejects tax declaration text without TD fields', () => {
    const v = fallbackValidationFromText(
      'tax_declaration',
      'REPUBLIC OF THE PHILIPPINES MUNICIPALITY',
      {},
      null,
    );
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
    expect(v.issues).toContain('missing_tax_declaration');
  });

  it('accepts tax declaration when owner or TD found', () => {
    const v = fallbackValidationFromText(
      'tax_declaration',
      'Tax Declaration No F-001-12345',
      { ownerName: 'Juan Dela Cruz', taxDeclarations: ['F-001-12345'] },
      null,
    );
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('ok');
  });

  it('rejects valid_id when name cannot be read', () => {
    const v = fallbackValidationFromText('valid_id', 'blurry noise', {}, null);
    expect(v.valid).toBe(false);
  });
});

describe('classifyValidation', () => {
  it('accepts tilted valid_id as WARNING when name is readable', () => {
    const v = classifyValidation({
      docType: 'valid_id',
      issues: ['tilted_document'],
      geminiValid: false,
      confidence: 0.72,
      message: 'ID is slightly tilted but name is readable',
      hasReadableIdentity: true,
      hasPropertyFields: false,
    });
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('warning');
    expect(v.issues).toContain('tilted_document');
  });

  it('rejects wrong document type as ERROR', () => {
    const v = classifyValidation({
      docType: 'title',
      issues: ['wrong_document_type'],
      geminiValid: false,
      confidence: 0.9,
      message: 'The uploaded document is an Original Certificate of Title (OCT), not a Transfer Certificate of Title (TCT/CCT) as expected.',
      hasReadableIdentity: false,
      hasPropertyFields: false,
    });
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
    expect(v.message).toContain('Original Certificate of Title');
    expect(v.message).toContain('not a Transfer Certificate');
  });

  it('rejects fake id even if something else looks ok', () => {
    const v = classifyValidation({
      docType: 'valid_id',
      issues: ['fake_or_suspicious_id'],
      geminiValid: false,
      confidence: 0.9,
      message: 'ID photo shows an animal, not a person',
      hasReadableIdentity: false,
      hasPropertyFields: false,
    });
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
  });

  it('accepts clean document as ok', () => {
    const v = classifyValidation({
      docType: 'tax_declaration',
      issues: [],
      geminiValid: true,
      confidence: 0.9,
      message: 'Document looks acceptable',
      hasReadableIdentity: false,
      hasPropertyFields: true,
    });
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('ok');
  });
});

describe('ISSUE_LABELS', () => {
  it('labels monkey/fake id and noisy photo issues', () => {
    expect(ISSUE_LABELS.fake_or_suspicious_id).toMatch(/fake|animal|monkey/i);
    expect(ISSUE_LABELS.noisy_photo).toMatch(/noisy/i);
    expect(ISSUE_LABELS.tilted_document).toMatch(/tilted/i);
    expect(ISSUE_LABELS.missing_tax_declaration).toMatch(/Tax Declaration/i);
  });
});
