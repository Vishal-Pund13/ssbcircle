export default function TwoSidesScene({ scene }) {
  const { title, left_label, right_label, left_items, right_items, officer_framing } = scene;

  return (
    <div className="px-5 py-4 flex flex-col gap-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <div className="grid grid-cols-2 gap-2">
        {/* Benefits */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-emerald-600 mb-2 uppercase tracking-wide">{left_label}</p>
          <div className="flex flex-col gap-2">
            {left_items.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-sm shrink-0 leading-tight">{item.icon}</span>
                <div>
                  <p className="text-[11px] font-semibold text-gray-800 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hurt */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-red-500 mb-2 uppercase tracking-wide">{right_label}</p>
          <div className="flex flex-col gap-2">
            {right_items.map((item, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-sm shrink-0 leading-tight">{item.icon}</span>
                <div>
                  <p className="text-[11px] font-semibold text-gray-800 leading-tight">{item.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Officer framing */}
      {officer_framing && (
        <div className="border-l-2 border-brand-600 bg-brand-50 px-3 py-2.5 rounded-r-lg">
          <p className="text-[10px] font-semibold text-brand-600 mb-1 uppercase tracking-wide">Officer's framing</p>
          <p className="text-xs text-brand-700 leading-relaxed">{officer_framing}</p>
        </div>
      )}
    </div>
  );
}
