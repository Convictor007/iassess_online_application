import { useState } from 'react';
import NavButtons from './NavButtons';
import DocumentGuideModal from './DocumentGuideModal';
import { DOCUMENT_GUIDES } from '../data/transactions';
import type { DocumentGuide } from './DocumentGuideModal';

interface RequirementItem {
  copies: number;
  label: string;
  whereToGet?: string;
  guide?: string;
}

interface RequirementsProps {
  title: string;
  requirements: RequirementItem[];
  note?: string;
  onBack: () => void;
  onNext: () => void;
}

export default function Requirements({
  title,
  requirements,
  note,
  onBack,
  onNext,
}: RequirementsProps) {
  const [activeGuide, setActiveGuide] = useState<DocumentGuide | null>(null);

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-[11px] text-gray-500 mb-2">
        Processing commences only upon submission of COMPLETE DOCUMENTS.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        <ul className="space-y-0">
          {requirements.map((req, i) => {
            const hasGuide = !!DOCUMENT_GUIDES[req.label];

            return (
              <li key={i}>
                <div className="flex items-start gap-2 text-xs text-gray-700 py-1.5 border-b border-amber-100 last:border-b-0">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">{i + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-start gap-1.5">
                      {req.copies > 1 && (
                        <span className="inline-block bg-amber-200 text-amber-800 text-[10px] font-bold px-1 py-0.5 rounded shrink-0 mt-0.5">
                          {req.copies}x
                        </span>
                      )}
                      <span className="flex-1">{req.label}</span>
                      {hasGuide && (
                        <button
                          onClick={() => setActiveGuide(DOCUMENT_GUIDES[req.label])}
                          className="shrink-0 text-[10px] text-white bg-[#0072D2] hover:bg-[#005fa3] px-2 py-0.5 rounded inline-flex items-center gap-1 mt-0.5 transition-colors"
                        >
                          <i className="bi bi-book"></i> How to get
                        </button>
                      )}
                    </div>
                    {req.whereToGet && (
                      <p className="text-[10px] text-blue-600 font-medium mt-1 ml-0">
                        <i className="bi bi-geo-alt-fill mr-1"></i>
                        {req.whereToGet}
                      </p>
                    )}
                    {req.guide && (
                      <p className="text-[10px] text-gray-500 mt-1 ml-0 leading-relaxed">
                        {req.guide}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {note && (
        <p className="text-[11px] text-red-600 font-medium">
          {note}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />

      {/* Guide Modal */}
      {activeGuide && (
        <DocumentGuideModal
          guide={activeGuide}
          onClose={() => setActiveGuide(null)}
        />
      )}
    </div>
  );
}
