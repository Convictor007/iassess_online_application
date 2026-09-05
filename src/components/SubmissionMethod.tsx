import type { SubmissionMethod as SubmissionMethodType } from '../types';
import NavButtons from './NavButtons';

interface SubmissionMethodProps {
  selected: SubmissionMethodType | null;
  onSelect: (method: SubmissionMethodType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function SubmissionMethod({
  selected,
  onSelect,
  onBack,
  onNext,
}: SubmissionMethodProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">How would you like to submit?</h2>
      <p className="text-[11px] text-gray-500 mb-3">
        Choose how you want to submit your required documents.
      </p>

      <div className="space-y-3 mb-4">
        {/* Walk-in Option */}
        <button
          onClick={() => onSelect('walk_in')}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selected === 'walk_in'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
              selected === 'walk_in' ? 'bg-blue-500' : 'bg-gray-100'
            }`}>
              <i className={`bi bi-file-earmark-text text-2xl ${selected === 'walk_in' ? 'text-white' : 'text-gray-500'}`}></i>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-gray-800">Walk-in Submission</div>
              <div className="text-xs text-gray-600 mt-1">
                Bring your physical documents to the Municipal Assessor&apos;s Office.
                Submit your application in person and present the required documents.
              </div>
              <div className="text-[10px] text-gray-400 mt-2">
                Office hours: Monday - Friday, 8:00 AM - 5:00 PM
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
              selected === 'walk_in' ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {selected === 'walk_in' && (
                <div className="w-3 h-3 rounded-full bg-blue-500" />
              )}
            </div>
          </div>
        </button>

        {/* Online Submission Option */}
        <button
          onClick={() => onSelect('online')}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selected === 'online'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
              selected === 'online' ? 'bg-green-500' : 'bg-gray-100'
            }`}>
              <i className={`bi bi-cloud-arrow-up text-2xl ${selected === 'online' ? 'text-white' : 'text-gray-500'}`}></i>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-gray-800">Online Submission</div>
              <div className="text-xs text-gray-600 mt-1">
                Upload digital copies of your documents using your phone camera or file upload.
                Submit everything online — no need to visit the office.
              </div>
              <div className="text-[10px] text-green-600 mt-2 font-medium">
                Recommended: Faster processing, no travel required
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
              selected === 'online' ? 'border-green-500' : 'border-gray-300'
            }`}>
              {selected === 'online' && (
                <div className="w-3 h-3 rounded-full bg-green-500" />
              )}
            </div>
          </div>
        </button>
      </div>

      {selected === 'online' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <i className="bi bi-info-circle-fill text-green-600 mt-0.5 shrink-0"></i>
            <div className="text-xs text-green-800">
              <strong>Online Submission Requirements:</strong>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Clear photos or scans of all required documents</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Accepted formats: JPG, PNG, PDF</li>
                <li>Documents will be reviewed by the assessor</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {selected === 'walk_in' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill text-amber-600 mt-0.5 shrink-0"></i>
            <div className="text-xs text-amber-800">
              <strong>Important:</strong> Please bring COMPLETE documents on your visit.
              Incomplete applications will not be processed.
            </div>
          </div>
        </div>
      )}

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!selected}
      />
    </div>
  );
}
