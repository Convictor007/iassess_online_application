import type { AssessmentType } from '../types';
import { ASSESSMENT_LABELS } from '../data/transactions';
import NavButtons from './NavButtons';

interface AssessmentTypeSelectProps {
  selected: AssessmentType | null;
  onSelect: (t: AssessmentType) => void;
  onBack: () => void;
  onNext: () => void;
}

const assessmentOptions: AssessmentType[] = [
  'transfer_ownership',
  'transfer_handog',
  'land_first_time',
];

export default function AssessmentTypeSelect({
  selected,
  onSelect,
  onBack,
  onNext,
}: AssessmentTypeSelectProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Assessment Transaction</h2>
      <p className="text-xs text-gray-500 mb-3">Select the type of assessment transaction.</p>

      <div className="space-y-2">
        {assessmentOptions.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selected === type
                ? 'border-[#0072D2] bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium text-sm text-gray-800">{ASSESSMENT_LABELS[type]}</span>
          </button>
        ))}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </div>
  );
}
