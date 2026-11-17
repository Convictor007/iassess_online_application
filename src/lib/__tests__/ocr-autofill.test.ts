import { describe, it, expect } from 'vitest';
import {
  looksLikePersonName,
  parsePropertyFromText,
  parseNameFromValidId,
  parseContactFromText,
} from '../ocr-autofill';

describe('looksLikePersonName', () => {
  it('rejects OCR garbage from the screenshot', () => {
    expect(looksLikePersonName('CEFE BFKA W: FRS FPINAE')).toBe(false);
    expect(looksLikePersonName('CEFE BFKA W FRS FPINAE')).toBe(false);
    expect(looksLikePersonName('LSC 2023 07')).toBe(false);
    expect(looksLikePersonName('7270')).toBe(false);
  });

  it('accepts typical Filipino names', () => {
    expect(looksLikePersonName('Juan Dela Cruz')).toBe(true);
    expect(looksLikePersonName('Maria Santos Reyes')).toBe(true);
    expect(looksLikePersonName('JOSE RIZAL')).toBe(true);
    expect(looksLikePersonName('Ana L. Bautista')).toBe(true);
  });

  it('rejects labels and short noise', () => {
    expect(looksLikePersonName('Owner')).toBe(false);
    expect(looksLikePersonName('AB')).toBe(false);
    expect(looksLikePersonName('tax declaration')).toBe(false);
  });
});

describe('parsePropertyFromText', () => {
  it('does not invent owner from unlabeled noise lines', () => {
    const text = [
      'REPUBLIC OF THE PHILIPPINES',
      'MUNICIPALITY OF BALATAN',
      'CEFE BFKA W: FRS FPINAE',
      'Tax Declaration No: F-001-12345',
      'Barangay: Siramag',
      'Lot No: 12',
    ].join('\n');
    const out = parsePropertyFromText(text);
    expect(out.ownerName).toBeUndefined();
    expect(out.taxDeclarations).toContain('F-001-12345');
    expect(out.barangay).toBe('Siramag');
    expect(out.lotNo).toBe('12');
  });

  it('reads owner only from explicit Owner label', () => {
    const text = [
      'Registered Owner: Juan Dela Cruz',
      'Tax Declaration No: F-001-12345',
      'Barangay: Siramag',
    ].join('\n');
    const out = parsePropertyFromText(text);
    expect(out.ownerName).toBe('Juan Dela Cruz');
  });

  it('does not accept year as lot number', () => {
    const text = 'Lot No: 2023\nBlock No: 45';
    const out = parsePropertyFromText(text);
    expect(out.lotNo).toBeUndefined();
    expect(out.blockNo).toBe('45');
  });
});

describe('parseNameFromValidId', () => {
  it('reads SURNAME, GIVEN format', () => {
    expect(parseNameFromValidId('DELA CRUZ, JUAN\nAddress: Balatan')).toBe(
      'JUAN DELA CRUZ',
    );
  });

  it('rejects garbage ID lines', () => {
    expect(parseNameFromValidId('CEFE BFKA W: FRS FPINAE')).toBeNull();
  });
});

describe('parseContactFromText', () => {
  it('reads address and mobile from a Postal-ID-like text', () => {
    const out = parseContactFromText([
      'POSTAL IDENTITY CARD',
      'DARRYL JOHN CEDEÑO REYES',
      'Address ZONE 7 SAN JOSE CS23027 NABUA CAMARINES SUR',
      'Mobile 09171234567',
    ].join('\n'));
    expect(out.address).toBe('ZONE 7 SAN JOSE CS23027 NABUA CAMARINES SUR');
    expect(out.contactNumber).toBe('09171234567');
  });

  it('reads the owner address from a tax declaration', () => {
    const out = parseContactFromText(
      'Owner: TENOSO, NERIE\nAddress: TAPAYAS, BALATAN, CAMARINES SUR',
    );
    expect(out.address).toBe('TAPAYAS, BALATAN, CAMARINES SUR');
  });

  it('reads a residence clause and an email', () => {
    const out = parseContactFromText(
      'I NERI TEÑOSO BELEN, resident of Barangay Tapayas, Balatan, Camarines Sur. Email juan.delacruz@example.com',
    );
    expect(out.address).toBe('Barangay Tapayas, Balatan, Camarines Sur');
    expect(out.email).toBe('juan.delacruz@example.com');
  });

  it('does not mistake title numbers for a phone', () => {
    const out = parseContactFromText('Katibayan ng Orihinal na Titulo Blg. 2024000680');
    expect(out.contactNumber).toBeUndefined();
    expect(out.address).toBeUndefined();
  });
});
