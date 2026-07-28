import NavButtons from './NavButtons';

interface PrivacyNoticeProps {
  onConsent: () => void;
  onBack: () => void;
}

export default function PrivacyNotice({ onConsent, onBack }: PrivacyNoticeProps) {
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

        <div className="bg-blue-50 border border-[#0072D2]/30 rounded p-2">
          <p className="text-xs text-[#102E50]">
            <strong>Consent:</strong> &ldquo;I hereby give consent on using my personal information
            for purposes related to my transaction.&rdquo;
          </p>
        </div>
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onConsent}
        nextLabel="Yes, I give my consent"
        showBack={false}
      />
    </div>
  );
}
