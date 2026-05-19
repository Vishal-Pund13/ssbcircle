export default function ContextScene({ scene }) {
  const { title, body, key_numbers, timeline } = scene;

  const dotColor = { positive: 'bg-brand-600', negative: 'bg-red-400', neutral: 'bg-gray-300' };

  return (
    <div className="px-5 py-4 flex flex-col gap-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">{body}</p>
      </div>

      {/* Key numbers */}
      {key_numbers?.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {key_numbers.map((n, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <p className="text-lg font-bold text-gray-900 leading-tight">{n.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{n.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {timeline?.length > 0 && (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
          <div className="flex flex-col gap-4">
            {timeline.map((t, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <span className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${dotColor[t.type] || 'bg-gray-300'}`} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{t.year}</p>
                  <p className="text-xs text-gray-700 leading-relaxed mt-0.5">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
