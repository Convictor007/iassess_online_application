interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}

export default function StepIndicator({ currentStep, totalSteps, stepLabel }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600">{stepLabel}</span>
        <span className="text-[10px] text-gray-400">
          Step {currentStep}/{totalSteps}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-[#0072D2] h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
