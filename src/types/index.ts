export type TransactionCategory =
  | 'assessment'
  | 'certification';

export type AssessmentType =
  | 'transfer_ownership'
  | 'transfer_handog'
  | 'land_first_time';

export type CertificationType =
  | 'certified_true_copy'
  | 'cert_land_holdings'
  | 'tax_declaration'
  | 'true_extract_copy'
  | 'duplicate_td'
  | 'no_declared_property'
  | 'aggregate_land_holding'
  | 'latest_td'
  | 'land_with_improvement'
  | 'land_no_improvement'
  | 'td_at_death'
  | 'no_property_at_death'
  | 'property_history'
  | 'earliest_td'
  | 'effectivity_td'
  | 'tax_map_location'
  | 'appearance'
  | 'other_certifications'
  // Legacy DB values kept only for old rows — not shown in the citizen catalog
  | 'request_or'
  | 'request_ds';

export type SubmissionMethod = 'walk_in' | 'online';

export type DocumentType =
  | 'deed_of_sale'
  | 'title'
  | 'tax_declaration'
  | 'technical_description'
  | 'valid_id'
  | 'spa'
  | 'survey_plan'
  | 'cenro_certification'
  | 'affidavit_ownership'
  | 'affidavit_possession'
  | 'barangay_cert_possessor'
  | 'purpose_letter';

export interface UploadedDocument {
  fileName: string;
  fileUrl: string;
  pathname?: string;
  uploadedAt: string;
}

export interface PendingDocument {
  file: File;
  previewUrl: string;
  addedAt: string;
}

export interface CertificateItem {
  id: CertificationType;
  label: string;
  /** Fee in pesos. */
  fee: number;
  /** Short purpose shown to citizens. */
  purpose?: string;
  /** Extra checklist notes for this product. */
  extraRequirements?: string[];
  /** When true, fee is zero (e.g., tax mapping). */
  isFree?: boolean;
  /** When true, death certificate is typically required (estate use). */
  requiresDeathCert?: boolean;
  /** Flag when fee needs MASSO/MTO confirmation (e.g., legacy Latest TD ₱1000). */
  feeNeedsConfirmation?: boolean;
  /** Process/treasury item rather than an assessor-issued certificate. */
  isProcessStep?: boolean;
  /** When true, citizen can type a free-text description (e.g., Other Certifications). */
  allowCustomNote?: boolean;
  /** Placeholder for the free-text note input. */
  customNotePlaceholder?: string;
}

export interface CertificationSelection {
  type: CertificationType;
  copies: number;
  /** Free-text note for Other Certifications / Appearance (stored as certifications.notes). */
  customNote?: string;
}

export interface PropertyInfo {
  ownerName: string;
  taxDeclarations: string[];
  titleNo: string;
  lotNo: string;
  blockNo: string;
  streetName: string;
  barangay: string;
}

export interface RequestorInfo {
  name: string;
  address: string;
  contactNumber: string;
  email: string;
  purpose: string;
}

export interface ApplicationData {
  transactionCategory: TransactionCategory | null;
  assessmentType: AssessmentType | null;
  certificationSelections: CertificationSelection[];
  submissionMethod: SubmissionMethod | null;
  documents: Partial<Record<DocumentType, PendingDocument[]>>;
  uploadedDocuments: Partial<Record<DocumentType, UploadedDocument[]>>;
  propertyInfo: PropertyInfo;
  requestorInfo: RequestorInfo;
  privacyConsent: boolean;
  referenceNumber: string;
}

export type Step =
  | 'home'
  | 'privacy_notice'
  | 'transaction_select'
  | 'assessment_type'
  | 'certification_type'
  | 'requirements'
  | 'submission_method'
  | 'document_upload'
  | 'property_info'
  | 'requestor_info'
  | 'summary'
  | 'confirmation';
