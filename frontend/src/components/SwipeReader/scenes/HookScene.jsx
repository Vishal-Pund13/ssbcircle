export default function HookScene({ scene, article }) {
  const { headline, subtext, stat } = scene;
  const isDown = stat?.trend === 'down';
  const isUp   = stat?.trend === 'up';

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6">

      {/* SSB tags */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {article.ssb_tags?.map(tag => (
          <span key={tag}
            className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
            {tag}
          </span>
        ))}
        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {article.reading_time} min · {article.difficulty}
        </span>
      </div>

      {/* Big stat */}
      {stat && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-end gap-2">
            <span className="text-6xl font-extrabold text-gray-900 tracking-tight leading-none">
              {stat.value}
            </span>
            {isDown && (
              <svg className="w-8 h-8 text-gray-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {isUp && (
              <svg className="w-8 h-8 text-brand-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
        </div>
      )}

      {/* Headline */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{headline}</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{subtext}</p>
      </div>

      {/* Category pill */}
      <span className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-500 bg-gray-50">
        {article.category} · {article.last_updated}
      </span>

      {/* Swipe hint */}
      <div className="flex flex-col items-center gap-1 text-gray-300 mt-2">
        <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7 6 7-6M5 9l7 6 7-6" />
        </svg>
        <span className="text-[10px] text-gray-300">Swipe up to start</span>
      </div>
    </div>
  );
}
