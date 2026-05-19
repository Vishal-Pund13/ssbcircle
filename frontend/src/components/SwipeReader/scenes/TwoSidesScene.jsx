export default function TwoSidesScene({ scene }) {
  const { title, left_label, right_label, left_items, right_items, officer_framing } = scene;

  return (
    <div className="px-5 py-5 flex flex-col gap-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Left — benefits */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-3.5 flex flex-col gap-2.5">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{left_label}</p>
          {left_items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">{item.label}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right — hurt */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 flex flex-col gap-2.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{right_label}</p>
          {right_items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-2.5 h-2.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-snug">{item.label}</p>
                <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {officer_framing && (
        <div className="border-l-2 border-brand-600 bg-brand-50 px-3 py-2.5 rounded-r-lg shrink-0">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Officer's framing</p>
          <p className="text-xs text-brand-700 leading-relaxed">{officer_framing}</p>
        </div>
      )}
    </div>
  );
}
