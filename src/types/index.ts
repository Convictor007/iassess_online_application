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
  | 'property_info'
  | 'requestor_info'
  | 'summary'
  | 'confirmation';
