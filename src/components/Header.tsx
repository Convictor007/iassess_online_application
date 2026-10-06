import headerBg from '../assets/header.png';
import assessorLogo from '../assets/assessor_logo.png';

export default function Header() {
  return (
    <header className="relative bg-[#102E50] text-white shadow-lg shrink-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${headerBg})` }}
        aria-hidden="true"
      />
      <div className="relative max-w-3xl mx-auto px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/balatan-logo.jpg"
            alt="Municipal Government of Balatan"
            className="w-[86px] h-[86px] object-cover rounded-full border-2 border-white/20 shrink-0"
          />
          <img
            src={assessorLogo}
            alt="Office of the Municipal Assessor"
            className="w-[86px] h-[86px] object-contain rounded-full border-2 border-white/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-blue-200 uppercase tracking-wider leading-tight">Republic of the Philippines</p>
            <h1 className="text-xl font-bold leading-tight">
              MUNICIPALITY OF BALATAN
            </h1>
            <p className="text-xs text-blue-300 leading-tight">
              Office of the Municipal Assessor &mdash; Online Application Form
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
