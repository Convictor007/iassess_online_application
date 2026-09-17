import type { ApplicationData } from '../types';
import { CATEGORY_LABELS } from '../data/transactions';

interface ConfirmationProps {
  data: ApplicationData;
  onNewApplication: () => void;
}

export default function Confirmation({ data, onNewApplication }: ConfirmationProps) {
  const isOnline = data.submissionMethod === 'online';

  return (
    <div className="flex flex-col sm:flex-row rounded-lg overflow-hidden shadow-lg min-h-[400px]">
      {/* Left Panel - Blue */}
      <div className="bg-[#1a3c6e] text-white p-6 flex flex-col items-center justify-center sm:w-[40%]">
        <img
          src="/balatan-logo.jpg"
          alt="Balatan Logo"
          className="w-20 h-20 mb-3 object-cover rounded-full border-2 border-white/20"
        />
        <p className="text-[10px] text-blue-200 uppercase tracking-wider mb-1">
          Municipal Government of Balatan
        </p>
        <h2 className="text-base font-bold text-center leading-tight mb-4">
          Assessor&apos;s Online<br />Application Form
        </h2>

        <div className="w-full border-t border-white/30 pt-4 mb-4">
          <h3 className="text-xl font-bold text-center mb-2">Success!</h3>
          <p className="text-[11px] text-center text-blue-100 leading-relaxed">
            Your application has successfully submitted.
            <br />
            We will keep your information safe.
            <br />
            Feel free to contact us with any questions.
          </p>
        </div>

        <div className="text-[11px] text-blue-200 space-y-0.5 mb-4">
          <p>Email Address: <span className="text-white">balatan.assessor@gmail.com</span></p>
          <p>Tel. No.: <span className="text-white">Municipal Hall, Balatan</span></p>
        </div>

        <div className="w-full border-t border-white/30 pt-3 text-center">
          <p className="text-[9px] text-blue-300 uppercase">
            Municipal Assessor&apos;s Office Transaction Requests
            <br />
            Municipality of Balatan
          </p>
          <p className="text-[9px] text-blue-400">(v 3.0)</p>
        </div>
      </div>

      {/* Right Panel - Details */}
      <div className="bg-white p-6 sm:w-[60%] flex flex-col">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Application Details</h3>

        {isOnline ? (
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Thank you for submitting your application online.
            <br />
            Your documents are now <strong>under review</strong> by our assessment team.
            <br />
            You will receive an email notification once your documents have been verified.
          </p>
        ) : (
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            Thank you for filling out our form.
            <br />
            Here is your transaction code to be presented on your visit.
          </p>
        )}

        <table className="w-full border border-gray-200 mb-4">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-xs text-gray-600 bg-gray-50 w-2/5">Requestor :</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-800">
                {data.requestorInfo.name || '-'}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="px-4 py-3 text-xs text-gray-600 bg-gray-50">Type of Transaction:</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-800">
                {data.transactionCategory ? CATEGORY_LABELS[data.transactionCategory] : '-'}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-xs text-gray-600 bg-gray-50">Transaction Code :</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-800 font-mono">
                {data.referenceNumber}
              </td>
            </tr>
          </tbody>
        </table>

        {isOnline ? (
          <>
            {/* Online Submission - What Happens Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-bold text-blue-800 mb-2">What Happens Next?</h4>
              <ol className="text-[11px] text-blue-900 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Our team will <strong>review your uploaded documents</strong> within 1-2 business days.</li>
                <li>You will receive an <strong>email notification</strong> with the review result:
                  <ul className="ml-4 mt-1 space-y-0.5 list-disc list-inside text-[10px]">
                    <li><span className="text-green-700 font-medium">Approved</span> — Proceed to submit original documents</li>
                    <li><span className="text-amber-700 font-medium">Needs Revision</span> — Resubmit the required document(s)</li>
                    <li><span className="text-red-700 font-medium">Rejected</span> — Application cannot be processed</li>
                  </ul>
                </li>
                <li>If approved, <strong>visit the Municipal Assessor&apos;s Office</strong> with your original documents.</li>
                <li>The assessor will advise you on <strong>payment and next steps</strong>.</li>
              </ol>
            </div>

            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
              Check your email regularly for updates. You can also track your application status
              on the homepage using your Transaction Code.
            </p>
          </>
        ) : (
          <>
            {/* Walk-in Submission */}
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              We have sent an email to your registered email address regarding the application
              process and requirements. Please make sure to check your inbox, including the
              spam/junk folder, for further instructions.
            </p>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Please visit the Municipal Assessor&apos;s Office with your complete physical documents
              to proceed with your application.
            </p>
          </>
        )}

        <div className="mt-auto">
          <button
            onClick={onNewApplication}
            className="px-6 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors text-sm"
          >
            Back to <span className="font-bold">Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
