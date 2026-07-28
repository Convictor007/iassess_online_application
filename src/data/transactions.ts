import type { CertificateItem, AssessmentType, TransactionCategory } from '../types';

export const CERTIFICATES: CertificateItem[] = [
  { id: 'certified_true_copy', label: 'Certified True Copy of Tax Declaration', fee: 50 },
  { id: 'cert_land_holdings', label: 'Certificate of Landholdings', fee: 50 },
];

export const BARANGAYS = [
  'Camangahan',
  'Coguit',
  'Duran',
  'Luluasan',
  'Siramag',
  'Pararao',
];

export const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  transfer_ownership: 'Transfer of Ownership (With Title)',
  transfer_handog: 'Transfer of Ownership (Handog Titulo)',
  land_first_time: 'Appraisal of Land Declared for the First Time',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  assessment: 'Assessment Transaction',
  certification: 'Certification Request',
};

export const REQUIREMENTS: Record<AssessmentType, { copies: number; label: string }[]> = {
  transfer_ownership: [
    { copies: 1, label: 'Electronic Copy of Title' },
    { copies: 3, label: 'Document(s) — Sale, Donation, Segregation, Extra Judicial Settlement, etc. (Certified copy from ROD)' },
    { copies: 3, label: 'Latest Tax Declaration subject for transfer (Masso)' },
    { copies: 3, label: 'Payment of Transfer Tax (1/2 of 1% of Fair Market Value or consideration, whichever is higher — at PTO)' },
    { copies: 3, label: 'Certificate of Tax Payment (current year and previous year — from MTO)' },
    { copies: 3, label: 'Authenticated Xerox copy of Certificate Authorizing Registration (CAR) from BIR' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction' },
  ],
  transfer_handog: [
    { copies: 3, label: 'Document(s) — Certified True Copy (Sale, Donation, Segregation, Extra Judicial Settlement, etc.)' },
    { copies: 3, label: 'Latest Tax Declaration subject for transfer (Masso)' },
    { copies: 3, label: 'Payment of Transfer Tax (1/2 of 1% of Fair Market Value or consideration, whichever is higher — at PTO)' },
    { copies: 3, label: 'Certificate of Tax Payment (current year and previous year — from MTO)' },
    { copies: 1, label: 'Electronic Copy of Title (from ROD Naga City)' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction' },
  ],
  land_first_time: [
    { copies: 1, label: 'Survey Plan prepared by a licensed Geodetic Engineer, approved by LMB-DENR or Cadastral Map certified by DENR' },
    { copies: 1, label: 'Certification from CENRO stating the land is within the alienable and disposable area' },
    { copies: 1, label: 'Affidavit of Ownership and/or Sworn Statement declaring Market Value of Real Property' },
    { copies: 1, label: 'Affidavit of long, continuous and notorious possession of the property' },
    { copies: 1, label: 'Certification from the Barangay Captain that declarant is the present possessor and occupant' },
    { copies: 1, label: 'Certification of Adjoining Owners, duly sworn by the Barangay Captain or Municipal Mayor' },
    { copies: 1, label: 'Ocular Inspection/Investigation Report by the Assessor or authorized representative' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction' },
  ],
};

export const CERT_REQUIREMENTS = [
  { copies: 1, label: 'Photocopy of Valid I.D. of the Owner' },
  { copies: 1, label: 'Special Power of Attorney (SPA) from the registered owner/s or compulsory heirs — per RA 10173 (Data Privacy Act of 2012)' },
  { copies: 1, label: 'Purpose of request must be indicated' },
  { copies: 1, label: 'Photocopy of Valid I.D. of Requestor' },
];

export function generateReferenceNumber(): string {
  const prefix = 'BAL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
