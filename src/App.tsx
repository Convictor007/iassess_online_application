import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ApplicationData,
  TransactionCategory,
  AssessmentType,
  CertificationSelection,
  PropertyInfo,
  RequestorInfo,
  SubmissionMethod,
  DocumentType,
  PendingDocument,
  Step,
} from './types';
import { REQUIREMENTS, CERT_REQUIREMENTS, generateReferenceNumber, ASSESSMENT_LABELS } from './data/transactions';
import { submitApplication } from './lib/applications';
import { uploadAllDocuments, type UploadProgress } from './lib/blob-upload';
import {
  applyPropertyAutofill,
  applyRequestorAutofill,
  defaultRequestorFromOwner,
  type OcrAutofillResult,
  type OcrAutofillSources,
  type OcrStatusMap,
} from './lib/ocr-autofill';
import { ocrController, type ValidationMap } from './lib/ocr-controller';
import { ISSUE_LABELS, type DocValidation } from './lib/gemini-doc';

import HomePage from './components/HomePage';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import PrivacyNotice from './components/PrivacyNotice';
import TransactionSelect from './components/TransactionSelect';
import AssessmentTypeSelect from './components/AssessmentTypeSelect';
import CertificationTypeSelect from './components/CertificationTypeSelect';
import Requirements from './components/Requirements';
import SubmissionMethodSelect from './components/SubmissionMethod';
import DocumentUpload from './components/DocumentUpload';
import PropertyInfoForm from './components/PropertyInfoForm';
import RequestorInfoForm from './components/RequestorInfoForm';
import Summary from './components/Summary';
import Confirmation from './components/Confirmation';

const INITIAL_DATA: ApplicationData = {
  transactionCategory: null,
  assessmentType: null,
  certificationSelections: [],
  submissionMethod: null,
  documents: {},
  uploadedDocuments: {},
  propertyInfo: {
    ownerName: '',
    taxDeclarations: [],
    titleNo: '',
    lotNo: '',
    blockNo: '',
    streetName: '',
    barangay: '',
  },
  requestorInfo: {
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    purpose: '',
  },
  privacyConsent: false,
  referenceNumber: '',
};

const STEP_LABELS: Record<Step, string> = {
  home: 'Home',
  privacy_notice: 'Data Privacy Notice',
  transaction_select: 'Transaction Type',
  assessment_type: 'Assessment Type',
  certification_type: 'Certification Type',
  requirements: 'Documents to Prepare',
  submission_method: 'Submission Method',
  document_upload: 'Upload Documents',
  property_info: 'Property Information',
  requestor_info: 'Requestor Information',
  summary: 'Application Summary',
  confirmation: 'Confirmation',
};

export default function App() {
  const [consentGiven, setConsentGiven] = useState(() => {
    return localStorage.getItem('iassess_consent') === 'true';
  });
  const [step, setStep] = useState<Step>('home');
  const [data, setData] = useState<ApplicationData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<DocumentType, UploadProgress>>>({});
  const [ocrStatuses, setOcrStatuses] = useState<OcrStatusMap>({});
  const [validations, setValidations] = useState<ValidationMap>({});
  const [ocrSources, setOcrSources] = useState<OcrAutofillSources>({
    property: null,
    requestor: null,
  });
  /** Full-screen “please wait” while Continue waits for background OCR. */
  const [isWaitingOcr, setIsWaitingOcr] = useState(false);
  /** Notices when Continue is clicked (errors + warnings) — shown in modal. */
  const [continueNotices, setContinueNotices] = useState<
    Array<{ docType: DocumentType; severity: 'error' | 'warning'; message: string; issues: string[] }>
  >([]);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const ocrAppliedRef = useRef(false);
  const ocrResultRef = useRef<OcrAutofillResult | null>(null);

  // Subscribe to background OCR progress + results + validation
  useEffect(() => {
    const offStatus = ocrController.onStatus(setOcrStatuses);
    const offResult = ocrController.onResult((result: OcrAutofillResult) => {
      ocrResultRef.current = result;
      setOcrSources(result.sources);
    });
    const offValidation = ocrController.onValidation(setValidations);
    setOcrStatuses(ocrController.getStatuses());
    setValidations(ocrController.getValidations());
    return () => {
      offStatus();
      offResult();
      offValidation();
    };
  }, []);

  const getStepFlow = useCallback((): Step[] => {
    const base: Step[] = ['home'];
    if (consentGiven) {
      base.push('transaction_select');
    } else {
      base.push('privacy_notice', 'transaction_select');
    }

    if (data.transactionCategory === 'assessment') {
      // Assessment: choose walk-in vs online (online may upload docs)
      base.push('assessment_type', 'requirements', 'submission_method');
      if (data.submissionMethod === 'online') {
        base.push('document_upload');
      }
    } else if (data.transactionCategory === 'certification') {
      // Certification: always walk-in — no submission method, no online upload
      base.push('certification_type', 'requirements');
    }

    base.push('property_info', 'requestor_info', 'summary', 'confirmation');
    return base;
  }, [data.transactionCategory, data.submissionMethod, consentGiven]);

  const stepFlow = getStepFlow();
  const totalSteps = stepFlow.length;
  const currentStepNum = stepFlow.indexOf(step) + 1;

  const goNext = (next: Step) => setStep(next);
  const goBack = () => {
    const idx = stepFlow.indexOf(step);
    if (idx > 0) setStep(stepFlow[idx - 1]);
  };

  /** Apply OCR fills + owner default into application data (only empty fields). */
  const applyOcrToForms = useCallback(() => {
    const ocr = ocrResultRef.current;
    const hasSpa = (data.documents.spa?.length ?? 0) > 0;
    setData((d) => {
      let propertyInfo = d.propertyInfo;
      let requestorInfo = d.requestorInfo;
      let sources: OcrAutofillSources = { property: null, requestor: null };

      if (ocr) {
        propertyInfo = applyPropertyAutofill(d.propertyInfo, ocr.propertyInfo);
        requestorInfo = applyRequestorAutofill(d.requestorInfo, ocr.requestorInfo);
        sources = hasSpa
          ? { ...ocr.sources, requestor: ocr.sources.requestor ?? 'spa' }
          : ocr.sources;
      }

      requestorInfo = defaultRequestorFromOwner(requestorInfo, propertyInfo, sources);
      return { ...d, propertyInfo, requestorInfo };
    });
    setOcrSources(
      ocr
        ? hasSpaOrDefault(ocr, hasSpa)
        : { property: null, requestor: null },
    );
    ocrAppliedRef.current = true;
  }, [data.documents]);

  const documentsRef = useRef(data.documents);
  useEffect(() => {
    documentsRef.current = data.documents;
  }, [data.documents]);

  const handleDocumentAddWithOcr = useCallback((type: DocumentType, doc: PendingDocument) => {
    const prev = documentsRef.current[type] ?? [];
    const nextFiles = [...prev, doc];
    const nextDocs = { ...documentsRef.current, [type]: nextFiles };
    documentsRef.current = nextDocs;
    setData((d) => ({ ...d, documents: nextDocs }));
    ocrController.start(type, nextFiles);
  }, []);

  const handleDocumentRemoveWithOcr = useCallback((type: DocumentType, index: number) => {
    const existing = documentsRef.current[type] ?? [];
    if (existing[index]?.previewUrl) {
      URL.revokeObjectURL(existing[index].previewUrl);
    }
    const updated = existing.filter((_, i) => i !== index);
    const docs = { ...documentsRef.current };
    if (updated.length === 0) {
      delete docs[type];
      ocrController.clearType(type);
    } else {
      docs[type] = updated;
      ocrController.start(type, updated);
    }
    documentsRef.current = docs;
    setData((d) => ({ ...d, documents: docs }));
  }, []);

  const finishUploadNext = useCallback(() => {
    applyOcrToForms();
    goNext('property_info');
  }, [applyOcrToForms]);

  const handleUploadNext = useCallback(async () => {
    // Wait for any background scan still running
    if (ocrController.isProcessing()) {
      setIsWaitingOcr(true);
      try {
        await ocrController.waitUntilIdle();
      } finally {
        setIsWaitingOcr(false);
      }
    }

    const notices = ocrController.getContinueNotices(documentsRef.current);
    if (notices.length > 0) {
      setContinueNotices(notices);
      setShowContinueModal(true);
      return;
    }

    finishUploadNext();
  }, [finishUploadNext]);

  const describeValidation = useCallback((v: DocValidation | undefined): string | null => {
    if (!v) return null;
    const issueText = v.issues.map((code) => ISSUE_LABELS[code] ?? code).join(' · ');
    // Full readable text — never rely on UI truncate
    if (v.message && issueText && !v.message.includes(issueText)) {
      return `${v.message}\n${issueText}`;
    }
    return v.message || issueText || (v.valid ? 'Accepted' : 'Document failed validation');
  }, []);

  const renderStep = () => {
    switch (step) {
      case 'home':
        return (
          <HomePage
            onApply={() => {
              if (consentGiven) {
                goNext('transaction_select');
              } else {
                goNext('privacy_notice');
              }
            }}
          />
        );

      case 'privacy_notice':
        return (
          <PrivacyNotice
            onConsent={() => {
              setData((d) => ({ ...d, privacyConsent: true }));
              setConsentGiven(true);
              localStorage.setItem('iassess_consent', 'true');
              goNext('transaction_select');
            }}
            onBack={() => {}}
          />
        );

      case 'transaction_select':
        return (
          <TransactionSelect
            selected={data.transactionCategory}
            onSelect={(cat: TransactionCategory) =>
              setData((d) => ({
                ...d,
                transactionCategory: cat,
                assessmentType: null,
                certificationSelections: [],
                // Certifications are walk-in only — skip submission method step
                submissionMethod: cat === 'certification' ? 'walk_in' : null,
                documents: {},
                uploadedDocuments: {},
              }))
            }
            onBack={goBack}
            onNext={() => {
              if (data.transactionCategory === 'assessment') goNext('assessment_type');
              else goNext('certification_type');
            }}
          />
        );

      case 'assessment_type':
        return (
          <AssessmentTypeSelect
            selected={data.assessmentType}
            onSelect={(t: AssessmentType) => setData((d) => ({ ...d, assessmentType: t }))}
            onBack={goBack}
            onNext={() => goNext('requirements')}
          />
        );

      case 'certification_type':
        return (
          <CertificationTypeSelect
            selections={data.certificationSelections}
            onChange={(sel: CertificationSelection[]) =>
              setData((d) => ({ ...d, certificationSelections: sel }))
            }
            onBack={goBack}
            onNext={() => goNext('requirements')}
          />
        );

      case 'requirements':
        if (data.transactionCategory === 'assessment' && data.assessmentType) {
          return (
            <Requirements
              title={`Documents to Prepare: ${ASSESSMENT_LABELS[data.assessmentType].label}`}
              requirements={REQUIREMENTS[data.assessmentType]}
              note="Please bring these documents on your scheduled appointment date. Incomplete documents will not be processed."
              onBack={goBack}
              onNext={() => goNext('submission_method')}
            />
          );
        }
        if (data.transactionCategory === 'certification') {
          return (
            <Requirements
              title="Documents to Prepare: Certification Request"
              requirements={CERT_REQUIREMENTS}
              note="Please bring these documents to the Municipal Assessor's Office on your visit. Incomplete documents will not be processed."
              onBack={goBack}
              onNext={() => {
                // Walk-in only — no submission method / upload step
                setData((d) => ({
                  ...d,
                  submissionMethod: 'walk_in',
                  documents: {},
                  uploadedDocuments: {},
                }));
                goNext('property_info');
              }}
            />
          );
        }
        return null;

      case 'submission_method':
        // Assessment only (certification skips this step)
        if (data.transactionCategory !== 'assessment') {
          goNext('property_info');
          return null;
        }
        return (
          <SubmissionMethodSelect
            selected={data.submissionMethod}
            onSelect={(method: SubmissionMethod) =>
              setData((d) => ({ ...d, submissionMethod: method, documents: {} }))
            }
            onBack={goBack}
            onNext={() => {
              if (data.submissionMethod === 'online') goNext('document_upload');
              else goNext('property_info');
            }}
          />
        );

      case 'document_upload':
        return (
          <DocumentUpload
            transactionCategory={data.transactionCategory!}
            assessmentType={data.assessmentType}
            certificationSelections={data.certificationSelections}
            documents={data.documents as Partial<Record<DocumentType, PendingDocument[]>>}
            onDocumentAdd={handleDocumentAddWithOcr}
            onDocumentRemove={handleDocumentRemoveWithOcr}
            onBack={goBack}
            onNext={handleUploadNext}
            ocrStatuses={ocrStatuses}
            validations={validations}
            describeValidation={describeValidation}
          />
        );

      case 'property_info':
        return (
          <PropertyInfoForm
            data={data.propertyInfo}
            onChange={(pi: PropertyInfo) => setData((d) => ({ ...d, propertyInfo: pi }))}
            onBack={goBack}
            onNext={() => {
              setData((d) => ({
                ...d,
                requestorInfo: defaultRequestorFromOwner(
                  d.requestorInfo,
                  d.propertyInfo,
                  ocrSources,
                ),
              }));
              goNext('requestor_info');
            }}
            autofillSource={ocrSources.property}
          />
        );

      case 'requestor_info':
        return (
          <RequestorInfoForm
            data={data.requestorInfo}
            onChange={(ri: RequestorInfo) => setData((d) => ({ ...d, requestorInfo: ri }))}
            onBack={goBack}
            onNext={() => {
              if (!data.referenceNumber) {
                setData((d) => ({ ...d, referenceNumber: generateReferenceNumber() }));
              }
              goNext('summary');
            }}
            autofillSource={
              data.requestorInfo.name.trim()
                ? (ocrSources.requestor ?? 'owner_default')
                : null
            }
          />
        );

      case 'summary':
        return (
          <Summary
            data={data}
            onBack={goBack}
            isSubmitting={isSubmitting}
            uploadProgress={uploadProgress}
            onSubmit={async () => {
              setIsSubmitting(true);
              setUploadProgress({});
              try {
                const hasDocuments = Object.keys(data.documents).length > 0;
                if (hasDocuments) {
                  const { uploaded, errors } = await uploadAllDocuments(
                    data.documents,
                    data.referenceNumber,
                    (docType, progress) => {
                      setUploadProgress((prev) => ({ ...prev, [docType]: progress }));
                    },
                  );

                  if (errors.length > 0) {
                    alert(`Some documents failed to upload:\n${errors.join('\n')}\n\nPlease try again.`);
                    return;
                  }

                  setData((d) => ({ ...d, uploadedDocuments: uploaded }));
                  data.uploadedDocuments = uploaded;
                }

                const { error } = await submitApplication(data);
                if (error) {
                  console.error('Failed to submit:', error);
                  alert(`Failed to submit application.\n\n${error}\n\nPlease try again.`);
                  return;
                }
                goNext('confirmation');
              } finally {
                setIsSubmitting(false);
                setUploadProgress({});
              }
            }}
          />
        );

      case 'confirmation':
        return (
          <Confirmation
            data={data}
            onNewApplication={() => {
              setData({ ...INITIAL_DATA, referenceNumber: '' });
              setStep('home');
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className={`${step === 'home' ? 'max-w-4xl mx-auto px-4 py-3' : 'max-w-3xl mx-auto px-4 py-3'}`}>
          {(step !== 'confirmation' && step !== 'home') && (
            <StepIndicator
              currentStep={currentStepNum}
              totalSteps={totalSteps}
              stepLabel={STEP_LABELS[step]}
            />
          )}

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5">
            {renderStep()}
          </div>

          {step !== 'confirmation' && (
            <div className="mt-3 text-center text-xs text-gray-400">
              <p>Municipal Assessor&apos;s Office, Balatan, Camarines Sur</p>
            </div>
          )}
        </div>
      </main>

      {/* Full-screen wait while Continue drains background OCR */}
      {isWaitingOcr && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          role="status"
          aria-live="polite"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
              <i className="bi bi-hourglass-split text-2xl text-blue-600 animate-pulse"></i>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Please wait a moment…</h3>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;re scanning your documents so Property Information is ready
              with the details from your uploads.
            </p>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>
      )}

      {/* Continue warning modal: Cancel / Proceed anyway */}
      {showContinueModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="continue-warn-title"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-200 bg-amber-50 flex items-start gap-3">
              <i className="bi bi-exclamation-triangle-fill text-amber-600 text-xl mt-0.5 shrink-0"></i>
              <div className="min-w-0">
                <h3 id="continue-warn-title" className="text-base font-bold text-gray-900">
                  Document check warnings
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Review the full results below. You can cancel to fix uploads, or continue anyway.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 overflow-y-auto space-y-3 flex-1">
              {continueNotices.map((n) => (
                <div
                  key={`${n.docType}-${n.severity}`}
                  className={`rounded-lg border p-3 ${
                    n.severity === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        n.severity === 'error'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {n.severity === 'error' ? 'Error' : 'Warning'}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 capitalize">
                      {n.docType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {/* Full message — wrap, never truncate */}
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words leading-snug">
                    {n.message}
                  </p>
                  {n.issues.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {n.issues.map((code) => (
                        <li
                          key={code}
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            n.severity === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {ISSUE_LABELS[code as keyof typeof ISSUE_LABELS] ?? code}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowContinueModal(false);
                  setContinueNotices([]);
                }}
                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowContinueModal(false);
                  setContinueNotices([]);
                  finishUploadNext();
                }}
                className="px-5 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hasSpaOrDefault(
  ocr: OcrAutofillResult,
  hasSpa: boolean,
): OcrAutofillSources {
  if (hasSpa) {
    return { ...ocr.sources, requestor: ocr.sources.requestor ?? 'spa' };
  }
  return ocr.sources;
}
