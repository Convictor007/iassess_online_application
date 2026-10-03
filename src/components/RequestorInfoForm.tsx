import { useState } from 'react';
import type { RequestorInfo as RequestorInfoType } from '../types';
import NavButtons from './NavButtons';

interface RequestorInfoFormProps {
  data: RequestorInfoType;
  onChange: (data: RequestorInfoType) => void;
  onBack: () => void;
  onNext: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(\+63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;

export default function RequestorInfoForm({
  data,
  onChange,
  onBack,
  onNext,
}: RequestorInfoFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const update = (field: keyof RequestorInfoType, value: string) =>
    onChange({ ...data, [field]: value });

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const emailValid = EMAIL_REGEX.test(data.email.trim());
  const phoneValid = PHONE_REGEX.test(data.contactNumber.trim());
  const nameValid = data.name.trim() !== '';
  const addressValid = data.address.trim() !== '';
  const purposeValid = data.purpose.trim() !== '';

  const isValid = nameValid && addressValid && phoneValid && emailValid && purposeValid;

  const showError = (field: string, valid: boolean) =>
    touched[field] && !valid;

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-1">Requestor&apos;s Information</h2>
      <p className="text-[11px] text-gray-500 mb-3">
        Fields marked with <span className="text-red-500">*</span> are required.
      </p>

      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
            Name of Requestor <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => markTouched('name')}
            className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] ${
              showError('name', nameValid) ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Full name"
          />
          {showError('name', nameValid) && (
            <p className="text-[10px] text-red-600 mt-0.5">Please enter the requestor's full name.</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            onBlur={() => markTouched('address')}
            className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] ${
              showError('address', addressValid) ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Complete address"
          />
          {showError('address', addressValid) && (
            <p className="text-[10px] text-red-600 mt-0.5">Please enter the complete address.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
              Contact No. <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={data.contactNumber}
              onChange={(e) => update('contactNumber', e.target.value)}
              onBlur={() => markTouched('contactNumber')}
              className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] ${
                showError('contactNumber', phoneValid) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="09XX-XXX-XXXX"
            />
            {showError('contactNumber', phoneValid) && (
              <p className="text-[10px] text-red-600 mt-0.5">
                {data.contactNumber.trim() === ''
                  ? 'Please enter a mobile number.'
                  : 'Invalid format. Use 09XXXXXXXXX or +639XXXXXXXXX.'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              onBlur={() => markTouched('email')}
              className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] ${
                showError('email', emailValid) ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {showError('email', emailValid) && (
              <p className="text-[10px] text-red-600 mt-0.5">
                {data.email.trim() === ''
                  ? 'Please enter an email address.'
                  : 'Please enter a valid email address (e.g., name@gmail.com).'}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
            Purpose <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.purpose}
            onChange={(e) => update('purpose', e.target.value)}
            onBlur={() => markTouched('purpose')}
            rows={2}
            className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2] ${
              showError('purpose', purposeValid) ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="State the purpose of your request"
          />
          {showError('purpose', purposeValid) && (
            <p className="text-[10px] text-red-600 mt-0.5">Please state the purpose of your request.</p>
          )}
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!isValid} />
    </div>
  );
}
