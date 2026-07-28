import { useState } from 'react';
import { trackApplication, type ApplicationRecord } from '../lib/applications';

interface HomePageProps {
  onApply: () => void;
}

export default function HomePage({ onApply }: HomePageProps) {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<ApplicationRecord | null>(null);
  const [trackingError, setTrackingError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleTrack = async () => {
    if (!trackingCode.trim()) return;
    setIsSearching(true);
    setTrackingError('');
    setTrackingResult(null);
    const result = await trackApplication(trackingCode);
    if (result) {
      setTrackingResult(result);
    } else {
      setTrackingError('No application found with that code.');
    }
    setIsSearching(false);
  };
  return (
    <div className="space-y-4">
      {/* Notice Section */}
      <div className="bg-[#102E50] text-white rounded-lg p-4">
        <h2 className="text-sm font-bold text-center mb-2 uppercase tracking-wide">
          Notice to the Public
        </h2>
        <div className="bg-white/10 rounded p-3 text-[11px] leading-relaxed text-blue-100">
          <p className="mb-2">
            Due to the high volume of clients transacting with the Municipal Assessor&apos;s Office,
            we are implementing a new schedule for document processing.
          </p>
          <p className="mb-2">
            <strong className="text-white">Assessment Transactions:</strong> Accepting and releasing
            on a Tuesday and Thursday schedule only.
          </p>
          <p className="text-white font-medium">
            A TRANSACTION CODE will be sent via email with an appointment date or release date.
            Walk-in clients not on schedule will not be entertained. We strongly advise you to send
            your requests online before you visit our office.
          </p>
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={onApply}
        className="w-full py-3 bg-[#0072D2] text-white text-sm font-bold rounded-lg hover:bg-[#005fa3] transition-colors"
      >
        CONTINUE TO APPLICATION FORM
      </button>

      {/* Three Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Welcome */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h3 className="text-sm font-bold text-[#102E50] mb-1.5">Welcome!</h3>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            The Municipal Assessor&apos;s Office of Balatan is finding innovative ways to give you
            better services. You can now submit your requests through this Online Application Form.
            Please fill up all necessary fields to prevent delay.
          </p>
          <p className="text-[10px] text-gray-400 mt-2 italic">
            Municipal Assessor&apos;s Office Transaction Requests
            <br />
            Municipality of Balatan (v 3.0)
          </p>
        </div>

        {/* Track Application */}
        <div className="bg-[#fcb900] rounded-lg p-3">
          <h3 className="text-sm font-bold text-[#102E50] mb-2">
            Check your application by entering your transaction code.
          </h3>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Enter Code here..."
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
            />
            <button
              onClick={handleTrack}
              disabled={isSearching}
              className="px-3 py-1.5 bg-[#1a3c6e] text-white text-xs font-bold rounded hover:bg-[#152f55] transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Go Find!'}
            </button>
          </div>

          {trackingError && (
            <p className="text-[10px] text-red-600 mt-1.5">{trackingError}</p>
          )}

          {trackingResult && (
            <div className="mt-2 bg-white rounded p-2 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-bold capitalize ${
                  trackingResult.status === 'completed' ? 'text-green-600' :
                  trackingResult.status === 'processing' ? 'text-blue-600' :
                  trackingResult.status === 'cancelled' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>{trackingResult.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium capitalize">{trackingResult.transaction_category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Submitted:</span>
                <span className="font-medium">{new Date(trackingResult.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h3 className="text-sm font-bold text-[#102E50] mb-1.5">Any Queries or Concerns?</h3>
          <p className="text-xs font-semibold text-[#0072D2] mb-2">Contact Us!</p>
          <ul className="space-y-1.5 text-[11px] text-gray-600">
            <li className="flex items-center gap-1.5">
              <span className="text-[#0072D2]">&#9654;</span>
              Municipal Assessor&apos;s Office
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#0072D2]">&#9993;</span>
              balatan.assessor@gmail.com
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-[#0072D2]">&#9742;</span>
              Municipal Hall, Balatan, Camarines Sur
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-200">
        &copy; {new Date().getFullYear()} Municipal Government of Balatan &mdash;
        Management Information Systems Office
      </div>
    </div>
  );
}
