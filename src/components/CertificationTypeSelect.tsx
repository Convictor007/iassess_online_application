import type { CertificationSelection, CertificationType } from '../types';
import { CERTIFICATES } from '../data/transactions';
import NavButtons from './NavButtons';

interface CertificationTypeSelectProps {
  selections: CertificationSelection[];
  onChange: (selections: CertificationSelection[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function CertificationTypeSelect({
  selections,
  onChange,
  onBack,
  onNext,
}: CertificationTypeSelectProps) {
  const getSelection = (id: CertificationType) =>
    selections.find((s) => s.type === id);

  const toggleCert = (id: CertificationType) => {
    const existing = getSelection(id);
    if (existing) {
      onChange(selections.filter((s) => s.type !== id));
    } else {
      onChange([...selections, { type: id, copies: 1 }]);
    }
  };

  const updateCopies = (id: CertificationType, copies: number) => {
    const clamped = Math.max(1, Math.min(10, copies));
    onChange(
      selections.map((s) => (s.type === id ? { ...s, copies: clamped } : s))
    );
  };

  const totalAmount = selections.reduce((sum, sel) => {
    const cert = CERTIFICATES.find((c) => c.id === sel.type);
    return sum + (cert ? cert.fee * sel.copies : 0);
  }, 0);

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Certifications</h2>
      <p className="text-xs text-gray-500 mb-3">Select certificates and specify copies.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gradient-to-r from-teal-400 to-cyan-400">
              <th className="p-2.5 font-bold text-white w-8">Select</th>
              <th className="p-2.5 font-bold text-white">Type of Certificate</th>
              <th className="p-2.5 font-bold text-white text-right">Cert. Fee</th>
              <th className="p-2.5 font-bold text-white text-center w-28">No. of Copies</th>
              <th className="p-2.5 font-bold text-white text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {CERTIFICATES.map((cert) => {
              const sel = getSelection(cert.id);
              const isSelected = !!sel;
              return (
                <tr
                  key={cert.id}
                  onClick={() => toggleCert(cert.id)}
                  className={`border-b cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="p-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCert(cert.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 text-[#0072D2] rounded"
                    />
                  </td>
                  <td className="p-2.5 text-gray-800">{cert.label}</td>
                  <td className="p-2.5 text-gray-500 text-right">
                    &#8369;{cert.fee}
                    <span className="text-gray-400 block text-[10px]">per TD and Copy</span>
                  </td>
                  <td className="p-2.5 text-center">
                    {isSelected ? (
                      <div
                        className="inline-flex items-center rounded border border-[#1a3c6e]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateCopies(cert.id, (sel?.copies ?? 1) - 1)}
                          disabled={(sel?.copies ?? 1) <= 1}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                        >
                          &lt;
                        </button>
                        <span className="w-8 h-6 flex items-center justify-center text-xs font-medium border-x border-inherit text-gray-800">
                          {sel?.copies ?? 1}
                        </span>
                        <button
                          onClick={() => updateCopies(cert.id, (sel?.copies ?? 1) + 1)}
                          disabled={(sel?.copies ?? 1) >= 10}
                          className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed text-xs"
                        >
                          &gt;
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-medium text-gray-800">
                    &#8369;{isSelected ? cert.fee * (sel?.copies ?? 1) : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td colSpan={4} className="p-2.5 text-right text-gray-700 text-xs">
                Total Amount
              </td>
              <td className="p-2.5 text-right text-[#1a3c6e] text-sm">
                &#8369;{totalAmount}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        nextDisabled={selections.length === 0}
      />
    </div>
  );
}
