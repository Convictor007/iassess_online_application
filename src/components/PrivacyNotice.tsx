import { useState } from 'react';

interface PrivacyNoticeProps {
  onConsent: () => void;
  onBack?: () => void;
}

export default function PrivacyNotice({ onConsent }: PrivacyNoticeProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h2 className="text-base font-bold text-gray-800 mb-2">Data Privacy Notice</h2>

      <div className="space-y-2 text-xs text-gray-700 leading-relaxed">
        <section>
          <h3 className="font-semibold text-gray-800 mb-0.5">Personal Data Collected</h3>
          <p>
            We shall collect and process personal data such as <em>Name, address, contact information</em>,
            and other personal information pertinent to the application through our online form and
            supporting documents submitted.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-0.5">Purpose and Data Usage</h3>
          <p>
            All personal data collected shall be used for legitimate purposes: Issuance of requested
            Certification; <em>Issuance of New Tax Declaration or certified true copies of Tax Declaration</em>
            for compliance with legal obligations and mandates.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-0.5">Storage and Disposal</h3>
          <p>
            Data shall be stored in <em>filing cabinets, vault, database; or off-site archive</em>
            and disposed in accordance with the National Archives of the Philippines.
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-gray-800 mb-0.5">Disclosure</h3>
          <p>
            We will treat your personal information with utmost confidentiality and shall not disclose
            to any unauthorized person, in adherence to the Data Privacy Act of 2012.
          </p>
        </section>
      </div>

      {/* Consent checkbox */}
      <div className="mt-4 bg-blue-50 border border-[#0072D2]/30 rounded p-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-[#0072D2] border-gray-300 rounded focus:ring-[#0072D2] cursor-pointer"
          />
          <span className="text-xs text-[#102E50] leading-relaxed">
            <strong>Consent:</strong> I hereby give consent on using my personal information
            for purposes related to my transaction. I understand that this information will be
            processed in accordance with the Data Privacy Act of 2012 (RA 10173).
          </span>
        </label>
      </div>

      <div className="mt-4 flex">
        <button
          onClick={onConsent}
          disabled={!checked}
          className="flex-1 px-4 py-2.5 bg-[#0072D2] text-white rounded font-semibold hover:bg-[#005fa3] transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0072D2]"
        >
          Yes, I give my consent
        </button>
      </div>
      {!checked && (
        <p className="text-[10px] text-gray-400 mt-1.5 text-center">
          Please check the box above to proceed
        </p>
      )}
    </div>
  );
}
