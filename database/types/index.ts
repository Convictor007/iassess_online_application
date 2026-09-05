/**
 * TypeScript types for the normalized iassess transaction tables.
 * Tables: transactions, assessments, certifications, properties,
 *         tax_declarations, requestors, documents, status_history
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type TransactionCategory = 'assessment' | 'certification';
export type SubmissionMethod = 'walk_in' | 'online';
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export type AssessmentType =
  | 'transfer_ownership'
  | 'transfer_handog'
  | 'land_first_time';

export type CertificationType =
  | 'certified_true_copy'
  | 'cert_land_holdings'
  | 'tax_declaration';

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

// ─── Table Row Types ────────────────────────────────────────────────────────

/** transactions — core record */
export interface TransactionRow {
  id: number;
  reference_number: string;
  category: TransactionCategory;
  submission_method: SubmissionMethod | null;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** assessments — assessment-specific (1:1) */
export interface AssessmentRow {
  id: number;
  trn_id: number;
  assessment_type: AssessmentType;
}

/** certifications — cert selections (1:N) */
export interface CertificationRow {
  id: number;
  trn_id: number;
  cert_type: CertificationType;
  copies: number;
  fee: number;
}

/** properties — property info (1:1) */
export interface PropertyRow {
  id: number;
  trn_id: number;
  owner_name: string;
  title_no: string | null;
  lot_no: string | null;
  block_no: string | null;
  street_name: string | null;
  barangay: string;
}

/** tax_declarations — TD numbers (1:N) */
export interface TaxDeclarationRow {
  id: number;
  trn_id: number;
  td_number: string;
}

/** requestors — requestor info (1:1) */
export interface RequestorRow {
  id: number;
  trn_id: number;
  name: string;
  address: string;
  contact_number: string;
  email: string;
  purpose: string;
}

/** documents — uploaded files (1:N) */
export interface DocumentRow {
  id: number;
  trn_id: number;
  doc_type: DocumentType;
  file_name: string;
  file_url: string;
  blob_pathname: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

/** status_history — audit trail (1:N) */
export interface StatusHistoryRow {
  id: number;
  trn_id: number;
  old_status: TransactionStatus | null;
  new_status: TransactionStatus;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

// ─── Composite Types (for joined queries) ───────────────────────────────────

/** Full transaction with all related data */
export interface FullTransaction {
  id: number;
  reference_number: string;
  category: TransactionCategory;
  submission_method: SubmissionMethod | null;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // from assessments
  assessment_type: AssessmentType | null;
  // from properties
  owner_name: string | null;
  title_no: string | null;
  lot_no: string | null;
  block_no: string | null;
  street_name: string | null;
  barangay: string | null;
  // from requestors
  requestor_name: string | null;
  requestor_address: string | null;
  requestor_contact: string | null;
  requestor_email: string | null;
  purpose: string | null;
}

/** Summary view for listing */
export interface TransactionSummary {
  id: number;
  reference_number: string;
  category: TransactionCategory;
  status: TransactionStatus;
  owner_name: string | null;
  barangay: string | null;
  requestor_name: string | null;
  created_at: string;
  document_count: number;
  certification_count: number;
}

// ─── Input Types (for creating/updating) ────────────────────────────────────

export interface CreateTransactionInput {
  reference_number: string;
  category: TransactionCategory;
  submission_method?: SubmissionMethod | null;
  assessment_type?: AssessmentType;
  certifications?: { cert_type: CertificationType; copies: number; fee: number }[];
  property: {
    owner_name: string;
    title_no?: string | null;
    lot_no?: string | null;
    block_no?: string | null;
    street_name?: string | null;
    barangay: string;
    tax_declarations?: string[];
  };
  requestor: {
    name: string;
    address: string;
    contact_number: string;
    email: string;
    purpose: string;
  };
  documents?: {
    doc_type: DocumentType;
    file_name: string;
    file_url: string;
    blob_pathname?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
  }[];
}
