export interface GuideStep {
  step: string;
  details: string;
}

export interface DocumentGuide {
  title: string;
  office: string;
  location: string;
  whatToBring: string[];
  steps: GuideStep[];
  fees?: string;
  processingTime?: string;
  tips?: string;
}

interface DocumentGuideModalProps {
  guide: DocumentGuide;
  onClose: () => void;
}

export default function DocumentGuideModal({ guide, onClose }: DocumentGuideModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h3 className="text-sm font-bold text-gray-800">{guide.office}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <ol className="space-y-3">
            {guide.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 bg-[#0072D2] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{s.step}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.details}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Close */}
        <div className="px-4 py-3 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
