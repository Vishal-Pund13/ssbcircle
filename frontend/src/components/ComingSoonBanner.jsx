// A standalone announcement poster for the upcoming 21-day challenge.
//
// Deliberately self-contained: no API calls, no router links, no dependency on
// the challenge feature. It ships ahead of that work so the announcement can go
// out first, and it can be deleted in one step once the real banner lands.

// Original artwork: a running shoe in the brand palette. Deliberately generic —
// no brand marks of any kind.
function ShoeArt({ className = '' }) {
  return (
    <svg viewBox="0 0 130 64" className={className} aria-hidden="true">
      <path d="M10 44c0-4 5-6 12-6h8c6 0 10-4 16-8s12-8 20-8 14 4 20 8c8 5 16 7 24 8 4 .5 6 2 6 5v3c0 2-2 4-5 4H15c-3 0-5-2-5-4z"
        fill="#ffffff" opacity="0.95" />
      <path d="M10 46h110v3c0 2-2 4-5 4H15c-3 0-5-2-5-4z" fill="#fcd34d" />
      <g stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M52 30l7 5" />
        <path d="M60 25l7 5" />
        <path d="M68 21l7 5" />
      </g>
      <path d="M96 30c6 4 12 6 18 7" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

export default function ComingSoonBanner() {
  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto relative overflow-hidden rounded-2xl bg-brand-800 text-white">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

        <div className="relative flex flex-col sm:flex-row items-center gap-6 px-5 sm:px-8 py-7 sm:py-9">
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">Coming soon</p>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold uppercase leading-[0.95] tracking-tighter">
              The 21-day challenge
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/75 leading-relaxed">
              Twenty-one days. One entry a day, logged in the open and checked by hand.
              Limited seats. The most consistent and most resilient aspirant walks away with
              a <span className="font-semibold text-white">brand-new pair of running shoes</span>.
            </p>
            <p className="mt-3 text-xs text-white/50">
              Not the fastest. Not the fittest. The one who did not miss.
            </p>
            <p className="mt-6 inline-block border border-white/25 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 px-5 py-3 rounded-full">
              Seats open soon
            </p>
          </div>

          <div className="shrink-0 w-44 sm:w-56">
            <ShoeArt className="w-full drop-shadow-xl" />
            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
              For the winner
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
