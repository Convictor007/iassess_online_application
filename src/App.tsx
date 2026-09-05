import { useState, useCallback } from 'react';
import type {
  ApplicationData,
  TransactionCategory,
  AssessmentType,
  CertificationSelection,
  PropertyInfo,
  RequestorInfo,
  Step,
} from './types';
import { REQUIREMENTS, CERT_REQUIREMENTS, generateReferenceNumber, ASSESSMENT_LABELS } from './data/transactions';
import { submitApplication, sendConfirmationEmail } from './lib/applications';

import HomePage from './components/HomePage';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import PrivacyNotice from './components/PrivacyNotice';
import TransactionSelect from './components/TransactionSelect';
import AssessmentTypeSelect from './components/AssessmentTypeSelect';
import CertificationTypeSelect from './components/CertificationTypeSelect';
import Requirements from './components/Requirements';
import PropertyInfoForm from './components/PropertyInfoForm';
import RequestorInfoForm from './components/RequestorInfoForm';
import Summary from './components/Summary';
import Confirmation from './components/Confirmation';

const INITIAL_DATA: ApplicationData = {
  transactionCategory: null,
  assessmentType: null,
  certificationSelections: [],
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

  const getStepFlow = useCallback((): Step[] => {
    const base: Step[] = ['home'];
    if (consentGiven) {
      base.push('transaction_select');
    } else {
      base.push('privacy_notice', 'transaction_select');
    }

    if (data.transactionCategory === 'assessment') {
      base.push('assessment_type', 'requirements');
    } else if (data.transactionCategory === 'certification') {
      base.push('certification_type', 'requirements');
    }

    base.push('property_info', 'requestor_info', 'summary', 'confirmation');
    return base;
  }, [data.transactionCategory, consentGiven]);

  const stepFlow = getStepFlow();
  const totalSteps = stepFlow.length;
  const currentStepNum = stepFlow.indexOf(step) + 1;

  const goNext = (next: Step) => setStep(next);
  const goBack = () => {
    const idx = stepFlow.indexOf(step);
    if (idx > 0) setStep(stepFlow[idx - 1]);
  };

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
              setData((d) => ({ ...d, transactionCategory: cat, assessmentType: null, certificationSelections: [] }))
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
              title={`Documents to Prepare: ${ASSESSMENT_LABELS[data.assessmentType]}`}
              requirements={REQUIREMENTS[data.assessmentType]}
              note="Please bring these physical documents on your visit to the Municipal Assessor's Office. Processing of your application will commence only upon submission of COMPLETE documents."
              onBack={goBack}
              onNext={() => goNext('property_info')}
            />
          );
        }
        if (data.transactionCategory === 'certification') {
          return (
            <Requirements
              title="Documents to Prepare: Certification Request"
              requirements={CERT_REQUIREMENTS}
              note="Please bring these physical documents on your visit to the Municipal Assessor's Office. Processing of your application will commence only upon submission of COMPLETE documents."
              onBack={goBack}
              onNext={() => goNext('property_info')}
            />
          );
        }
        return null;

      case 'property_info':
        return (
          <PropertyInfoForm
            data={data.propertyInfo}
            onChange={(pi: PropertyInfo) => setData((d) => ({ ...d, propertyInfo: pi }))}
            onBack={goBack}
            onNext={() => goNext('requestor_info')}
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
          />
        );

      case 'summary':
        return (
          <Summary
            data={data}
            onBack={goBack}
            isSubmitting={isSubmitting}
            onSubmit={async () => {
              setIsSubmitting(true);
              try {
                const { error } = await submitApplication(data);
                if (error) {
                  console.error('Failed to submit:', error);
                  alert('Failed to submit application. Please try again.');
                  return;
                }
                sendConfirmationEmail(data).catch(console.error);
                goNext('confirmation');
              } finally {
                setIsSubmitting(false);
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
    </div>
  );
}
