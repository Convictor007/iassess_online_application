import { useState } from 'react';
import type { ApplicationData } from '../types';
import { CERTIFICATES } from '../data/transactions';
import NavButtons from './NavButtons';

interface PaymentProps {
  data: ApplicationData;
  onBack: () => void;
  onConfirm: (paymentInfo: PaymentResult) => void;
}

export interface PaymentResult {
  method: string;
  transactionId: string;
  amount: number;
  paidAt: string;
  accountRef: string;
  status: 'success' | 'pending' | 'failed';
}

type PaymentMethod = 'gcash' | 'maya' | 'bdo' | 'bpi' | 'counter';
type PaymentStep = 'select' | 'details' | 'otp' | 'processing' | 'success';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; logo: string }[] = [
  { id: 'gcash', label: 'GCash', logo: 'https://cdn.brandfetch.io/gcash.com/logo' },
  { id: 'maya', label: 'Maya', logo: 'https://cdn.brandfetch.io/maya.ph/logo' },
  { id: 'bdo', label: 'BDO Online', logo: 'https://cdn.brandfetch.io/bdo.com.ph/logo' },
  { id: 'bpi', label: 'BPI Online', logo: 'https://cdn.brandfetch.io/bpi.com.ph/logo' },
  { id: 'counter', label: 'Pay at Municipal Treasurer', logo: '' },
];

function generateTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Payment({ data, onBack, onConfirm }: PaymentProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<PaymentStep>('select');
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [otp, setOtp] = useState('');
  const [txId] = useState(generateTxId());

  const certTotal = data.certificationSelections.reduce((sum, sel) => {
    const cert = CERTIFICATES.find((c) => c.id === sel.type);
    return sum + (cert ? cert.fee * sel.copies : 0);
  }, 0);

  const processingFee = Math.round(certTotal * 0.02);
  const totalWithFee = certTotal + processingFee;

  const handleSelectMethod = (id: PaymentMethod) => {
    setMethod(id);
    if (id === 'counter') {
      setStep('details');
    } else {
      setStep('details');
    }
  };

  const handleSendOtp = () => {
    if (!phone && method !== 'counter') return;
    setStep('otp');
  };

  const handleConfirmOtp = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 3000);
  };

  const handleComplete = () => {
    onConfirm({
      method: PAYMENT_METHODS.find((p) => p.id === method)?.label || '',
      transactionId: txId,
      amount: method === 'counter' ? certTotal : totalWithFee,
      paidAt: new Date().toISOString(),
      accountRef: method === 'counter' ? 'Counter Payment' : phone || accountName,
      status: method === 'counter' ? 'pending' : 'success',
    });
  };

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Payment</h2>
      <p className="text-xs text-gray-500 mb-3">
        {step === 'select' && 'Select your preferred payment method.'}
        {step === 'details' && 'Enter your payment details.'}
        {step === 'otp' && 'Enter the OTP sent to your phone.'}
        {step === 'processing' && 'Processing your payment...'}
        {step === 'success' && 'Payment successful!'}
      </p>

      {/* Amount Summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Processing Fee</span>
          <span>₱{certTotal}</span>
        </div>
        {method && method !== 'counter' && (
          <div className="flex justify-between items-center text-xs text-gray-500 mt-0.5">
            <span>Convenience Fee (2%)</span>
            <span>₱{processingFee}</span>
          </div>
        )}
        <div className="border-t border-gray-200 mt-1.5 pt-1.5 flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Total</span>
          <span className="text-lg font-bold text-[#0072D2]">
            ₱{method === 'counter' ? certTotal : totalWithFee}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Ref: {data.referenceNumber}
        </p>
      </div>

      {/* Step 1: Select Method */}
      {step === 'select' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {PAYMENT_METHODS.map((pm) => (
            <button
              key={pm.id}
              onClick={() => handleSelectMethod(pm.id)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all text-left ${
                method === pm.id
                  ? 'border-[#0072D2] bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              {pm.logo ? (
                <img src={pm.logo} alt={pm.label} className="h-6 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <i className="bi bi-credit-card text-xl text-gray-500"></i>
              )}
              <span className="text-xs font-medium text-gray-800">{pm.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Enter Details */}
      {step === 'details' && method && (
        <div className="space-y-3 mb-3">
          {(method === 'gcash' || method === 'maya') && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
                  placeholder="09XX-XXX-XXXX"
                  maxLength={11}
                />
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Enter your {method === 'gcash' ? 'GCash' : 'Maya'} registered number
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-[10px] text-blue-700">
                  A one-time PIN (OTP) will be sent to verify your payment.
                </p>
              </div>
            </>
          )}

          {(method === 'bdo' || method === 'bpi') && (
            <>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
                  placeholder="Juan Dela Cruz"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={16}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-[10px] text-blue-700">
                  You will be redirected to {method === 'bdo' ? 'BDO' : 'BPI'} Online Banking to authorize the payment.
                </p>
              </div>
            </>
          )}

          {method === 'counter' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h3 className="text-xs font-semibold text-amber-800 mb-1">Pay at Municipal Treasurer&apos;s Office</h3>
              <ul className="space-y-1 text-[11px] text-amber-700">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold">1.</span>
                  Go to the Municipal Treasurer&apos;s Office on your appointment date
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold">2.</span>
                  Present your reference number: <strong className="font-mono">{data.referenceNumber}</strong>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold">3.</span>
                  Pay the amount of <strong>₱{certTotal}</strong> (cash only)
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold">4.</span>
                  Keep your Official Receipt for document release
                </li>
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('select'); setMethod(null); }}
              className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Change Method
            </button>
            <button
              onClick={method === 'counter' ? handleComplete : handleSendOtp}
              disabled={(method !== 'counter') && !phone}
              className="flex-1 px-4 py-1.5 text-xs bg-[#0072D2] text-white rounded hover:bg-[#005fa3] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {method === 'counter' ? 'Confirm - Pay at Counter' : 'Send OTP'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: OTP Verification */}
      {step === 'otp' && (
        <div className="space-y-3 mb-3">
          <div className="bg-green-50 border border-green-200 rounded p-2">
            <p className="text-[11px] text-green-800">
              OTP sent to <strong>{phone}</strong>. Please check your {method === 'gcash' ? 'GCash' : 'Maya'} app or SMS.
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
              One-Time PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] text-center font-mono tracking-widest"
              placeholder="------"
              maxLength={6}
            />
            <p className="text-[10px] text-gray-400 mt-0.5 text-center">
              Demo: Enter any 6 digits
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep('details')}
              className="px-4 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirmOtp}
              disabled={otp.length < 6}
              className="flex-1 px-4 py-1.5 text-xs bg-[#0072D2] text-white rounded hover:bg-[#005fa3] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === 'processing' && (
        <div className="text-center py-6">
          <div className="animate-spin w-12 h-12 border-4 border-[#0072D2] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-700 font-medium mb-1">Processing payment...</p>
          <p className="text-[10px] text-gray-400">Please do not close this window</p>
          <div className="mt-4 space-y-1">
            <p className="text-[10px] text-green-600">Connecting to {PAYMENT_METHODS.find((p) => p.id === method)?.label}...</p>
            <p className="text-[10px] text-green-600">Verifying account...</p>
            <p className="text-[10px] text-gray-400">Confirming transaction...</p>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 'success' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="bi bi-check-circle-fill text-green-600 text-2xl"></i>
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">Payment Successful!</h3>
          <p className="text-[11px] text-gray-500 mb-4">Your payment has been confirmed.</p>

          <div className="bg-gray-50 rounded-lg p-3 text-left mb-4">
            <h4 className="text-[11px] font-semibold text-gray-700 mb-2 border-b pb-1">Payment Receipt</h4>
            <dl className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-gray-500">Reference No.</dt>
                <dd className="font-mono text-gray-800">{data.referenceNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Transaction ID</dt>
                <dd className="font-mono text-gray-800">{txId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Method</dt>
                <dd className="text-gray-800">{PAYMENT_METHODS.find((p) => p.id === method)?.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Account</dt>
                <dd className="text-gray-800">{phone || accountName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Amount Paid</dt>
                <dd className="font-bold text-[#0072D2]">₱{totalWithFee}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date/Time</dt>
                <dd className="text-gray-800">{new Date().toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="text-green-600 font-medium">Confirmed</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={handleComplete}
            className="w-full px-4 py-2 text-xs bg-[#0072D2] text-white rounded hover:bg-[#005fa3] transition-colors font-medium"
          >
            Continue to Confirmation
          </button>
        </div>
      )}

      {/* Back button (only on select step) */}
      {step === 'select' && (
        <NavButtons
          onBack={onBack}
          onNext={() => {}}
          nextLabel=""
          showBack={true}
        />
      )}
    </div>
  );
}
