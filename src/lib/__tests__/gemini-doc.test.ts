import { describe, it, expect } from 'vitest';
import {
  fallbackValidationFromText,
  classifyValidation,
  buildGeminiCandidates,
  pickFallbackGeminiModels,
  ISSUE_LABELS,
} from '../gemini-doc';

describe('pickFallbackGeminiModels', () => {
  it('auto-picks document-capable models: flash first, then pro, then lite', () => {
    const picked = pickFallbackGeminiModels([
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-2.5-flash-preview-tts', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-3.1-flash-image', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-2.5-flash-lite', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/lyria-3.5', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      { name: 'models/gemini-3.5-flash', supportedGenerationMethods: ['generateContent', 'countTokens'] },
    ]);
    expect(picked).toEqual([
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
    ]);
  });

  it('skips models without generateContent and non-gemini names', () => {
    const picked = pickFallbackGeminiModels([
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['bidiGenerateContent'] },
      { name: 'models/veo-3.0', supportedGenerationMethods: ['generateContent'] },
    ]);
    expect(picked).toEqual([]);
  });
});

describe('buildGeminiCandidates', () => {
  it('tries primary pair first, then fallback models, then fallback keys', () => {
    const c = buildGeminiCandidates('PRIMARY_KEY_123', 'model-a', ['BACKUP_KEY_123'], ['model-b']);
    expect(c.map((x) => `${x.apiKey}/${x.model}`)).toEqual([
      'PRIMARY_KEY_123/model-a',
      'PRIMARY_KEY_123/model-b',
      'BACKUP_KEY_123/model-a',
      'BACKUP_KEY_123/model-b',
    ]);
  });

  it('drops duplicate pairs and empty keys', () => {
    const c = buildGeminiCandidates('PRIMARY_KEY_123', 'model-a', ['', 'PRIMARY_KEY_123', 'BACKUP_KEY_123'], [
      'model-a',
      'model-b',
    ]);
    expect(c.map((x) => `${x.apiKey}/${x.model}`)).toEqual([
      'PRIMARY_KEY_123/model-a',
      'PRIMARY_KEY_123/model-b',
      'BACKUP_KEY_123/model-a',
      'BACKUP_KEY_123/model-b',
    ]);
  });

  it('labels which key/model pair produced the verdict', () => {
    const c = buildGeminiCandidates('PRIMARY_KEY_123', 'model-a', ['BACKUP_KEY_123'], []);
    expect(c[0].label).toBe('model-a');
    expect(c[1].label).toBe('model-a (fallback key)');
  });
});

describe('fallbackValidationFromText', () => {
  it('rejects empty OCR text as unreadable', () => {
    const v = fallbackValidationFromText('   ');
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
    expect(v.engine).toBe('ocr_space_fallback');
    expect(v.issues).toContain('unreadable_text');
  });

  it('accepts readable text without requiring any fields', () => {
    const v = fallbackValidationFromText('REPUBLIC OF THE PHILIPPINES MUNICIPALITY');
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('ok');
  });
});

describe('classifyValidation', () => {
  it('accepts tilted document as WARNING when text is readable', () => {
    const v = classifyValidation({
      issues: ['tilted_document'],
      geminiValid: false,
      confidence: 0.72,
      message: 'ID is slightly tilted but name is readable',
    });
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('warning');
    expect(v.issues).toContain('tilted_document');
  });

  it('accepts blurred-but-readable photo as WARNING, not a failure', () => {
    const v = classifyValidation({
      issues: ['blurred', 'noisy_photo'],
      geminiValid: true,
      confidence: 0.9,
      message: 'Document processed successfully',
    });
    expect(v.valid).toBe(true);
    expect(v.severity).toBe('warning');
    expect(v.issues).toContain('blurred');
  });

  it('rejects non-document photo as ERROR', () => {
    const v = classifyValidation({
      issues: ['wrong_document_type'],
      geminiValid: false,
      confidence: 0.9,
      message: 'This is a photo of a cat, not a document',
    });
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
  });

  it('rejects unreadable photo as ERROR', () => {
    const v = classifyValidation({
      issues: ['unreadable_text'],
      geminiValid: false,
      confidence: 0.2,
      message: 'Text cannot be read',
    });
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
    expect(v.issues).toContain('unreadable_text');
  });

  it('rejects fake id even if something else looks ok', () => {
    const v = classifyValidation({
      issues: ['fake_or_suspicious_id'],
      geminiValid: false,
      confidence: 0.9,
      message: 'ID photo shows an animal, not a person',
    });
    expect(v.valid).toBe(false);
    expect(v.severity).toBe('error');
  });

  it('accepts clean document as ok', () => {
    const v = classifyValidation({
      issues: [],
      geminiValid: true,
      confidence: 0.9,
      message: 'Photo is clear and readable',
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
