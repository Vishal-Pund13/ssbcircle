import Hello from './Hello';

// The header every tool page shares: a soft tinted band with a few faint
// icons, then the page's icon on a white tile overlapping it, the greeting,
// the title and one line on what the page is for. Pages keep their own width,
// so the band and the head are separate pieces:
//
//   <CoverBand deco={[BookOpen, Mic, Target]} />
//   <div className="max-w-6xl mx-auto px-4 sm:px-6">
//     <PageHead icon={ListChecks} title="SSB Prep Sheet" subtitle="…" />
//   </div>

export function CoverBand({ deco = [] }) {
  const [A, B, C] = deco;
  return (
    <div className="relative h-20 sm:h-36 bg-gradient-to-r from-brand-50 via-slate-50 to-indigo-50 border-b border-gray-100 overflow-hidden">
      <div className="absolute right-6 sm:right-24 top-4 flex gap-6 opacity-[0.12] text-brand-600" aria-hidden="true">
        {A && <A className="w-14 h-14 -rotate-6" strokeWidth={1.25} />}
        {B && <B className="w-10 h-10 mt-8 rotate-12" strokeWidth={1.25} />}
        {C && <C className="w-12 h-12 mt-2" strokeWidth={1.25} />}
      </div>
    </div>
  );
}

export function PageHead({ icon: Icon, eyebrow, title, subtitle, children }) {
  return (
    <div>
      <div className="-mt-7 sm:-mt-10 relative">
        <span className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center">
          <Icon className="w-7 h-7 sm:w-10 sm:h-10 text-brand-600" />
        </span>
      </div>
      <Hello className="mt-3" />
      {eyebrow && <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">{eyebrow}</p>}
      <h1 className={`${eyebrow ? 'mt-1.5' : 'mt-3 sm:mt-4'} text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight`}>{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm sm:text-[15px] text-gray-500 max-w-2xl leading-relaxed">{subtitle}</p>}
      {children}
    </div>
  );
}
