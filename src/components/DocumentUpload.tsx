import type { AssessmentType, DocumentType, PendingDocument, CertificationType } from '../types';
import { ASSESSMENT_LABELS } from '../data/transactions';
import DocumentUploader from './DocumentUploader';
import NavButtons from './NavButtons';

interface DocumentConfig {
  type: DocumentType;
  label: string;
  required: boolean;
}

const ASSESSMENT_DOCUMENTS: Record<AssessmentType, DocumentConfig[]> = {
  transfer_ownership: [
    { type: 'deed_of_sale', label: 'Deed of Sale / Donation / Segregation / Extra Judicial Settlement (Certified Copy from ROD)', required: true },
    { type: 'title', label: 'Electronic Copy of Title (from ROD)', required: true },
    { type: 'tax_declaration', label: 'Latest Tax Declaration subject for transfer', required: true },
    { type: 'technical_description', label: 'Technical Description / Survey Plan', required: true },
    { type: 'valid_id', label: 'Valid Government ID of Requestor', required: true },
    { type: 'spa', label: 'Special Power of Attorney (SPA) — if transacting person is not a party', required: false },
  ],
  transfer_handog: [
    { type: 'deed_of_sale', label: 'Document(s) — Certified True Copy (Sale, Donation, etc.)', required: true },
    { type: 'title', label: 'Electronic Copy of Title (from ROD Naga City)', required: true },
    { type: 'tax_declaration', label: 'Latest Tax Declaration subject for transfer', required: true },
    { type: 'technical_description', label: 'Technical Description / Survey Plan', required: true },
    { type: 'valid_id', label: 'Valid Government ID of Requestor', required: true },
    { type: 'spa', label: 'Special Power of Attorney (SPA) — if transacting person is not a party', required: false },
  ],
  land_first_time: [
    { type: 'survey_plan', label: 'Survey Plan approved by LMB-DENR or Cadastral Map certified by DENR', required: true },
    { type: 'cenro_certification', label: 'Certification from CENRO (alienable and disposable area)', required: true },
    { type: 'affidavit_ownership', label: 'Affidavit of Ownership and/or Sworn Statement', required: true },
    { type: 'affidavit_possession', label: 'Affidavit of long, continuous and notorious possession', required: true },
    { type: 'barangay_cert_possessor', label: 'Certification from Barangay Captain (possessor and occupant)', required: true },
    { type: 'valid_id', label: 'Valid Government ID of Requestor', required: true },
    { type: 'spa', label: 'Special Power of Attorney (SPA) — if transacting person is not a party', required: false },
  ],
};

const CERTIFICATION_DOCUMENTS: DocumentConfig[] = [
  { type: 'valid_id', label: 'Photocopy of Valid I.D. of the Owner', required: true },
  { type: 'spa', label: 'Special Power of Attorney (SPA) from the registered owner/s', required: true },
  { type: 'purpose_letter', label: 'Purpose of request must be indicated', required: true },
];

interface DocumentUploadProps {
  transactionCategory: 'assessment' | 'certification';
  assessmentType: AssessmentType | null;
  certificationSelections: Array<{ type: CertificationType; copies: number }>;
  documents: Partial<Record<DocumentType, PendingDocument>>;
  onDocumentAdd: (type: DocumentType, doc: PendingDocument) => void;
  onDocumentRemove: (type: DocumentType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function DocumentUpload({
  transactionCategory,
  assessmentType,
  documents,
  onDocumentAdd,
  onDocumentRemove,
  onBack,
  onNext,
}: DocumentUploadProps) {
  const docs: DocumentConfig[] = transactionCategory === 'assessment' && assessmentType
    ? ASSESSMENT_DOCUMENTS[assessmentType]
    : CERTIFICATION_DOCUMENTS;

  const requiredCount = docs.filter(d => d.required).length;
  const uploadedCount = docs.filter(d => d.required && documents[d.type]).length;
  const allRequiredUploaded = uploadedCount === requiredCount;

  const title = transactionCategory === 'assessment' && assessmentType
    ? `Upload Documents: ${ASSESSMENT_LABELS[assessmentType]}`
    : 'Upload Documents: Certification Request';

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-[11px] text-gray-500 mb-3">
        Upload clear photos or scans of your required documents.
      </p>

      {/* Progress indicator */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {uploadedCount} of {requiredCount} required documents added
          </span>
          <span className={`font-medium ${allRequiredUploaded ? 'text-green-600' : 'text-amber-600'}`}>
            {allRequiredUploaded ? (
              <><i className="bi bi-check-circle-fill"></i> Ready to proceed</>
            ) : (
              `${requiredCount - uploadedCount} remaining`
            )}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${allRequiredUploaded ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${(uploadedCount / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-start gap-2">
          <i className="bi bi-info-circle-fill text-blue-600 mt-0.5 shrink-0"></i>
          <div className="text-xs text-blue-800">
            <strong>Files are stored locally.</strong> They will be uploaded to the server only when you submit your application. You can remove or replace files before submitting.
          </div>
        </div>
      </div>

      {/* Document uploaders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {docs.map((doc) => (
          <DocumentUploader
            key={doc.type}
            documentType={doc.type}
            label={doc.label}
            required={doc.required}
            pending={documents[doc.type] ?? null}
            onAdd={(d) => onDocumentAdd(doc.type, d)}
            onRemove={() => onDocumentRemove(doc.type)}
          />
        ))}
      </div>

      {!allRequiredUploaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill text-amber-600 mt-0.5 shrink-0"></i>
            <div className="text-xs text-amber-800">
              <strong>Required documents missing.</strong> Please add all required documents before proceeding.
              Optional documents can be added later.
            </div>
          </div>
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!allRequiredUploaded}
        nextLabel="Continue"
      />
    </div>
  );
}
