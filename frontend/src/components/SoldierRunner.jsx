// A soldier running with a rifle — SSBCircle's loading animation.
//
// Original artwork in the brand navy: a helmeted figure leaning into the run,
// rifle held across the chest, legs swinging from the hip while the ground
// streams past. The movement lives in index.css (.soldier-*) and stops for
// people who ask for reduced motion.

export default function SoldierRunner({ className = 'w-28' }) {
  return (
    <svg viewBox="22 4 76 76" className={className} role="img" aria-label="Loading">
      {/* Ground streaming past */}
      <line x1="18" y1="76" x2="102" y2="76" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"
        strokeDasharray="10 8" className="soldier-ground" />

      <g className="soldier-bob">
        {/* Back leg (drawn first, so it sits behind) */}
        <g className="soldier-leg soldier-leg-b" style={{ transformOrigin: '56px 47px' }}>
          <path d="M56 47 L54 60 L57 72" fill="none" stroke="#334155" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M57 72 L63 72" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Backpack */}
        <rect x="40" y="26" width="13" height="18" rx="3.5" fill="#475569" transform="rotate(-12 47 35)" />

        {/* Torso, leaning forward */}
        <path d="M49 25 L62 25 L60.5 49 L51.5 49 Z" fill="#1e3a5f" transform="rotate(14 56 37)" />
        <path d="M51 41 L61 41" stroke="#0f172a" strokeWidth="2.5" transform="rotate(14 56 37)" />

        {/* Front leg */}
        <g className="soldier-leg soldier-leg-a" style={{ transformOrigin: '56px 47px' }}>
          <path d="M56 47 L58 60 L55 72" fill="none" stroke="#1e3a5f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M55 72 L61 72" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* Rifle across the chest, muzzle up and forward */}
        <g>
          <path d="M50 44 L82 20" stroke="#0f172a" strokeWidth="3.8" strokeLinecap="round" />
          <path d="M50 44 L45 47 L47 50 L53 46" fill="#0f172a" />
          <path d="M66 32 L67 37" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Arms holding the rifle */}
        <path d="M60 28 L66 36 L72 27" fill="none" stroke="#1e3a5f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M58 29 L55 39 L60 40" fill="none" stroke="#1e3a5f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Head and helmet */}
        <circle cx="64" cy="18.5" r="6" fill="#d6a77a" />
        <path d="M56.8 17 A7.6 7.6 0 0 1 71.6 15.2 L73.4 17.6 Z" fill="#3f6212" />
        <path d="M56 17.6 L74.4 17.6" stroke="#365314" strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Full-screen loader for page loads
export function SoldierLoader({ label = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
      <SoldierRunner className="w-24" />
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}
