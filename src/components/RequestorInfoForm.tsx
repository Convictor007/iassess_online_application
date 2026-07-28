import type { RequestorInfo as RequestorInfoType } from '../types';
import NavButtons from './NavButtons';

interface RequestorInfoFormProps {
  data: RequestorInfoType;
  onChange: (data: RequestorInfoType) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function RequestorInfoForm({
  data,
  onChange,
  onBack,
  onNext,
}: RequestorInfoFormProps) {
  const update = (field: keyof RequestorInfoType, value: string) =>
    onChange({ ...data, [field]: value });

  const isValid =
    data.name.trim() !== '' &&
    data.address.trim() !== '' &&
    data.contactNumber.trim() !== '' &&
    data.email.trim() !== '' &&
    data.purpose.trim() !== '';

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
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => update('address', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
            placeholder="Complete address"
          />
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
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
              placeholder="09XX-XXX-XXXX"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-700 mb-0.5">
            Purpose <span className="text-red-500">*</span>
          </label>
          <textarea
            value={data.purpose}
            onChange={(e) => update('purpose', e.target.value)}
            rows={2}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#0072D2] focus:border-[#0072D2]"
            placeholder="State the purpose of your request"
          />
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!isValid} />
    </div>
  );
}
