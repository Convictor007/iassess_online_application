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
  /** Optional sample template shown under “view format” */
  exampleFormat?: {
    heading?: string;
    /** Plain-text sample the citizen can copy */
    body: string;
    note?: string;
  };
}

interface DocumentGuideModalProps {
  guide: DocumentGuide;
  onClose: () => void;
}

export default function DocumentGuideModal({ guide, onClose }: DocumentGuideModalProps) {
  const hasFormat = Boolean(guide.exampleFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55" />

      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full flex flex-col ${
          hasFormat
            ? 'max-w-2xl max-h-[92vh] sm:max-h-[88vh]'
            : 'max-w-lg max-h-[85vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 truncate">{guide.title || guide.office}</h3>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{guide.office}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Steps + optional format */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {guide.location && guide.location !== 'N/A' && (
            <p className="text-[11px] text-gray-500 mb-3">
              <i className="bi bi-geo-alt mr-1"></i>
              {guide.location}
            </p>
          )}

          <ol className="space-y-3 mb-4">
            {guide.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-5 h-5 bg-[#0072D2] text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800">{s.step}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{s.details}</p>
                </div>
              </li>
            ))}
          </ol>

          {guide.fees || guide.processingTime ? (
            <div className="flex flex-wrap gap-2 mb-4 text-[11px]">
              {guide.fees && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Fee: {guide.fees}
                </span>
              )}
              {guide.processingTime && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Processing: {guide.processingTime}
                </span>
              )}
            </div>
          ) : null}

          {guide.tips && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>Tips:</strong> {guide.tips}
              </p>
            </div>
          )}

          {guide.exampleFormat && (
            <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-bold text-blue-900 mb-3">
                {guide.exampleFormat.heading || 'Sample format — copy this idea'}
              </p>
              <pre className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-900 bg-white border border-gray-300 rounded-lg p-4 font-sans shadow-sm">
{guide.exampleFormat.body}
              </pre>
              {guide.exampleFormat.note && (
                <p className="text-[12px] text-blue-900 mt-3 leading-relaxed">
                  {guide.exampleFormat.note}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Close */}
        <div className="px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
