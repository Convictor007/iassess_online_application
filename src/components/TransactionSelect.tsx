import type { TransactionCategory } from '../types';
import { CATEGORY_LABELS } from '../data/transactions';
import NavButtons from './NavButtons';

interface TransactionSelectProps {
  selected: TransactionCategory | null;
  onSelect: (cat: TransactionCategory) => void;
  onBack: () => void;
  onNext: () => void;
}

const descriptions: Record<TransactionCategory, string[]> = {
  assessment: [
    'Transfer of Ownership (With Title)',
    'Transfer of Ownership (Handog Titulo / DENR)',
    'Appraisal of Land Declared for the First Time',
  ],
  certification: [
    'Certified True Copy of Tax Declaration',
    'Certificate of Landholdings',
  ],
};

export default function TransactionSelect({
  selected,
  onSelect,
  onBack,
  onNext,
}: TransactionSelectProps) {
  const categories: TransactionCategory[] = ['assessment', 'certification'];

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Transaction</h2>
      <p className="text-xs text-gray-500 mb-3">Select the type of transaction you need.</p>

      <div className="space-y-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              selected === cat
                ? 'border-[#0072D2] bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <h3 className="font-semibold text-sm text-gray-800">{CATEGORY_LABELS[cat]}</h3>
            <ul className="mt-1 space-y-0.5">
              {descriptions[cat].map((d) => (
                <li key={d} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5">&#8226;</span>
                  {d}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!selected} />
    </div>
  );
}
