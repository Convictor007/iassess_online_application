interface NavButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export default function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled = false,
  showBack = true,
}: NavButtonsProps) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      {showBack && (
        <button
          onClick={onBack}
          className="px-5 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
        >
          {backLabel}
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="px-5 py-2 bg-[#1a3c6e] text-white rounded font-semibold hover:bg-[#152f55] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {nextLabel}
      </button>
    </div>
  );
}
