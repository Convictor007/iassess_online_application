export default function Header() {
  return (
    <header className="bg-[#102E50] text-white shadow-lg shrink-0">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="https://www.balatandrrm.org/wp-content/uploads/2025/09/cropped-balatan_logo-1.png"
            alt="Municipal Government of Balatan"
            className="w-12 h-12 object-contain"
          />
          <div className="min-w-0">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider leading-tight">Republic of the Philippines</p>
            <h1 className="text-base font-bold leading-tight">
              MUNICIPALITY OF BALATAN
            </h1>
            <p className="text-[10px] text-blue-300 leading-tight">
              Office of the Municipal Assessor &mdash; Online Application Form
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
