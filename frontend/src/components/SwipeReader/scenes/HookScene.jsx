export default function HookScene({ scene, article }) {
  const { headline, subtext, stat } = scene;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-8 py-8 text-center gap-6">

      {/* SSB tags */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {article.ssb_tags?.map(tag => (
          <span key={tag} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
            {tag}
          </span>
        ))}
        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {article.reading_time} min · {article.difficulty}
        </span>
      </div>

      {/* Big stat */}
      {stat && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-end gap-2">
            <span className="text-7xl font-extrabold text-gray-900 tracking-tight leading-none">
              {stat.value}
            </span>
            {stat.trend === 'down' && (
              <svg className="w-9 h-9 text-gray-400 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {stat.trend === 'up' && (
              <svg className="w-9 h-9 text-brand-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
        </div>
      )}

      {/* Headline */}
      <div className="max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{headline}</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{subtext}</p>
      </div>

      <span className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 bg-gray-50">
        {article.category} · {article.last_updated}
      </span>

      <div className="flex items-center gap-1.5 text-gray-300">
        <svg className="w-5 h-5 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-[11px]">Swipe up to start</span>
      </div>
    </div>
  );
}
