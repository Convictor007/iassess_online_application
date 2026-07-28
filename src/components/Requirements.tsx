import NavButtons from './NavButtons';

interface RequirementItem {
  copies: number;
  label: string;
}

interface RequirementsProps {
  title: string;
  requirements: RequirementItem[];
  note?: string;
  onBack: () => void;
  onNext: () => void;
  downloadLinks?: { label: string; url: string }[];
}

export default function Requirements({
  title,
  requirements,
  note,
  onBack,
  onNext,
  downloadLinks,
}: RequirementsProps) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-[11px] text-gray-500 mb-2">
        Processing commences only upon submission of COMPLETE DOCUMENTS.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
        <ul className="space-y-1.5">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
              <span className="text-amber-600 font-bold shrink-0">{i + 1}.</span>
              <div className="flex items-start gap-1.5">
                {req.copies > 1 && (
                  <span className="inline-block bg-amber-200 text-amber-800 text-[10px] font-bold px-1 py-0.5 rounded shrink-0">
                    {req.copies}x
                  </span>
                )}
                <span>{req.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {downloadLinks && downloadLinks.length > 0 && (
        <div className="mb-2">
          <div className="flex flex-wrap gap-1.5">
            {downloadLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-[#0072D2] rounded text-[11px] hover:bg-blue-200 transition-colors"
              >
                &#128196; {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {note && (
        <p className="text-[11px] text-red-600 font-medium">
          {note}
        </p>
      )}

      <NavButtons onBack={onBack} onNext={onNext} />
    </div>
  );
}
