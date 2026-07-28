import type { ApplicationData } from '../types';
import { ASSESSMENT_LABELS, CATEGORY_LABELS, CERTIFICATES } from '../data/transactions';

interface SummaryProps {
  data: ApplicationData;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function Summary({ data, onBack, onSubmit, isSubmitting }: SummaryProps) {
  const certTotal = data.certificationSelections.reduce((sum, sel) => {
    const cert = CERTIFICATES.find((c) => c.id === sel.type);
    return sum + (cert ? cert.fee * sel.copies : 0);
  }, 0);

  return (
    <div>
      {/* Summary Header */}
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold text-[#1a3c6e] uppercase tracking-wide border-b-2 border-[#1a3c6e] pb-2">
          Application Summary
        </h2>
      </div>

      <p className="text-xs text-red-500 mb-4">
        * Please review your application before submitting.
      </p>

      {/* Transaction Details */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-t px-3 py-1.5">
          <h3 className="text-xs font-bold text-gray-700">Type of Transaction</h3>
        </div>
        <div className="bg-gray-100 border border-gray-200 rounded-b px-3 py-2">
          <p className="text-sm text-gray-800">
            {data.transactionCategory ? CATEGORY_LABELS[data.transactionCategory] : '-'}
          </p>
        </div>
      </div>

      {data.assessmentType && (
        <div className="mb-4">
          <div className="bg-gray-50 rounded-t px-3 py-1.5">
            <h3 className="text-xs font-bold text-gray-700">Sub-Classification</h3>
          </div>
          <div className="bg-gray-100 border border-gray-200 rounded-b px-3 py-2">
            <p className="text-sm text-gray-800">{ASSESSMENT_LABELS[data.assessmentType]}</p>
          </div>
        </div>
      )}

      {data.certificationSelections.length > 0 && (
        <div className="mb-4">
          <div className="bg-gray-50 rounded-t px-3 py-1.5">
            <h3 className="text-xs font-bold text-gray-700">Certificates</h3>
          </div>
          <div className="bg-gray-100 border border-gray-200 rounded-b px-3 py-2">
            {data.certificationSelections.map((sel) => {
              const cert = CERTIFICATES.find((c) => c.id === sel.type);
              return (
                <div key={sel.type} className="flex justify-between text-sm text-gray-800">
                  <span>{cert?.label}</span>
                  <span className="font-medium">&#8369;{(cert?.fee ?? 0) * sel.copies}</span>
                </div>
              );
            })}
            <div className="border-t border-gray-300 mt-1 pt-1 flex justify-between font-bold text-[#1a3c6e] text-sm">
              <span>Total</span>
              <span>&#8369;{certTotal}</span>
            </div>
          </div>
        </div>
      )}

      {/* Property Information */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-t px-3 py-1.5">
          <h3 className="text-xs font-bold text-gray-700">Property Information</h3>
        </div>
        <div className="bg-gray-100 border border-gray-200 rounded-b px-3 py-2 space-y-2">
          <div>
            <p className="text-[10px] text-gray-500">Owner&apos;s Name</p>
            <p className="text-sm text-gray-800 font-medium">{data.propertyInfo.ownerName || '-'}</p>
          </div>
          {data.propertyInfo.taxDeclarations.filter(td => td.trim()).length > 0 && (
            <div className="mt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-400 to-cyan-400">
                    <th className="p-1.5 text-[10px] font-bold text-white w-8">#</th>
                    <th className="p-1.5 text-[10px] font-bold text-white">Tax Declaration No.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.propertyInfo.taxDeclarations.filter(td => td.trim()).map((td, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-1.5 text-xs text-gray-500">{i + 1}</td>
                      <td className="p-1.5 text-xs text-gray-800">{td}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-[10px] text-gray-500">Title No.</p>
              <p className="text-sm text-gray-800">{data.propertyInfo.titleNo || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Lot No.</p>
              <p className="text-sm text-gray-800">{data.propertyInfo.lotNo || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-500">Block No.</p>
              <p className="text-sm text-gray-800">{data.propertyInfo.blockNo || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Street</p>
              <p className="text-sm text-gray-800">{data.propertyInfo.streetName || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Location</p>
            <p className="text-sm text-gray-800">{data.propertyInfo.barangay || '-'}</p>
          </div>
        </div>
      </div>

      {/* Requestor's Information */}
      <div className="mb-4">
        <div className="bg-gray-50 rounded-t px-3 py-1.5">
          <h3 className="text-xs font-bold text-gray-700">Requestor&apos;s Information</h3>
        </div>
        <div className="bg-gray-100 border border-gray-200 rounded-b px-3 py-2 space-y-2">
          <div>
            <p className="text-[10px] text-gray-500">Requestor&apos;s Name</p>
            <p className="text-sm text-gray-800">{data.requestorInfo.name || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Requestor&apos;s Address</p>
            <p className="text-sm text-gray-800">{data.requestorInfo.address || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Contact Number</p>
            <p className="text-sm text-gray-800">{data.requestorInfo.contactNumber || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Email Address</p>
            <p className="text-sm text-gray-800">{data.requestorInfo.email || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500">Purpose</p>
            <p className="text-sm text-gray-800">{data.requestorInfo.purpose || '-'}</p>
          </div>
        </div>
      </div>

      {/* Notice Box */}
      <div className="bg-[#fcb900] rounded-lg p-3 mb-4">
        <p className="text-[11px] text-gray-800 leading-relaxed">
          By clicking the <strong>&ldquo;Submit Application&rdquo;</strong> button, you confirm
          that the information provided in this application is accurate and complete. Once
          submitted, your application will be processed. If you wish to make any changes to your
          application, you can return to the previous form by clicking the
          <strong> &ldquo;Return to Application&rdquo;</strong> button.
        </p>
      </div>

      {/* Reference Number */}
      <div className="bg-blue-50 border border-[#0072D2]/20 rounded-lg p-3 mb-4">
        <p className="text-[10px] text-[#0072D2] mb-0.5">Transaction Code</p>
        <p className="text-lg font-mono font-bold text-[#102E50]">{data.referenceNumber}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors text-sm"
        >
          Return to Application
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-[#1a3c6e] text-white rounded font-semibold hover:bg-[#152f55] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </div>
  );
}
