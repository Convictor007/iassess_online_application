export type TransactionCategory =
  | 'assessment'
  | 'certification';

export type AssessmentType =
  | 'transfer_ownership'
  | 'transfer_handog'
  | 'land_first_time';

export type CertificationType =
  | 'certified_true_copy'
  | 'cert_land_holdings';

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
  fee: number;
}

export interface CertificationSelection {
  type: CertificationType;
  copies: number;
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
  documents: Partial<Record<DocumentType, PendingDocument>>;
  uploadedDocuments: Partial<Record<DocumentType, UploadedDocument>>;
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
  | 'payment'
  | 'confirmation';
