// Contextual hook-scene illustrations for the Women in India series.
// Each icon is a 96x96 viewBox SVG in brand-navy line art.

const S = ({ children, vb = '0 0 96 96' }) => (
  <svg viewBox={vb} fill="none" stroke="#1e3a5f" strokeLinecap="round" strokeLinejoin="round" className="w-20 h-20 mx-auto">
    {children}
  </svg>
);

// Card 1 — Workforce Paradox
// Woman at a laptop + rupee coin (paid work) + broken chain (unpaid trap)
export function WorkforceIcon() {
  return (
    <S>
      {/* Laptop */}
      <rect x="20" y="38" width="56" height="36" rx="4" strokeWidth="1.8"/>
      <rect x="26" y="43" width="44" height="26" rx="2" strokeWidth="1.2" strokeOpacity="0.5"/>
      <path d="M10 74 L86 74 Q88 80 80 82 L16 82 Q8 80 10 74Z" strokeWidth="1.5"/>
      {/* Screen graph arrow */}
      <path d="M30 64 L38 56 L46 60 L54 50 L62 44" strokeWidth="1.8"/>
      <path d="M58 44 L62 44 L62 48" strokeWidth="1.5"/>
      {/* Rupee coin - top right */}
      <circle cx="76" cy="22" r="14" strokeWidth="1.8"/>
      <path d="M70 16 L82 16" strokeWidth="1.5"/>
      <path d="M70 21 L82 21" strokeWidth="1.5"/>
      <path d="M70 16 Q82 16 82 21 Q82 26 70 26" strokeWidth="1.5"/>
      <path d="M70 21 L80 32" strokeWidth="1.5"/>
      {/* Woman figure - small, left side */}
      <circle cx="18" cy="22" r="8" strokeWidth="1.5"/>
      <path d="M12 34 Q18 30 24 34 L26 50 L10 50Z" strokeWidth="1.4"/>
      {/* Broken chain */}
      <path d="M24 46 Q28 44 30 46 Q28 50 24 50 Q22 48 24 46" strokeWidth="1.3" strokeOpacity="0.7"/>
      <path d="M30 46 Q34 44 36 46" strokeWidth="1.3" strokeDasharray="2 2" strokeOpacity="0.5"/>
    </S>
  );
}

// Card 2 — Proxy Representation (Sarpanch Pati)
// Woman with ballot + man's shadow behind her
export function ProxyIcon() {
  return (
    <S>
      {/* Panchayat/village building */}
      <rect x="28" y="48" width="40" height="36" rx="2" strokeWidth="1.6"/>
      <path d="M22 50 L48 32 L74 50" strokeWidth="1.8"/>
      {/* Pillars */}
      <line x1="38" y1="48" x2="38" y2="84" strokeWidth="1.3" strokeOpacity="0.5"/>
      <line x1="58" y1="48" x2="58" y2="84" strokeWidth="1.3" strokeOpacity="0.5"/>
      {/* Ballot box */}
      <rect x="40" y="60" width="16" height="13" rx="2" strokeWidth="1.5"/>
      <path d="M46 56 L46 62 L50 62 L50 56" strokeWidth="1.4"/>
      <line x1="40" y1="68" x2="56" y2="68" strokeWidth="1" strokeOpacity="0.4"/>
      {/* Woman figure (front, clear) */}
      <circle cx="48" cy="16" r="9" strokeWidth="1.8"/>
      <path d="M40 28 Q48 24 56 28 L58 48 L38 48Z" strokeWidth="1.5"/>
      {/* Man shadow behind (dotted, offset) */}
      <circle cx="58" cy="14" r="9" strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.35"/>
      <path d="M50 26 Q58 22 66 26 L68 48 L48 48" strokeWidth="1.3" strokeDasharray="3 2" strokeOpacity="0.3"/>
      {/* Question mark / blocked */}
      <text x="60" y="20" fontSize="12" stroke="none" fill="#1e3a5f" opacity="0.3" fontWeight="bold">?</text>
    </S>
  );
}

// Card 3 — Glass Ceiling
// Corporate building floors + woman hitting glass ceiling
export function GlassCeilingIcon() {
  return (
    <S>
      {/* Building levels */}
      <rect x="14" y="68" width="68" height="16" rx="2" strokeWidth="1.5" strokeOpacity="0.4"/>
      <rect x="18" y="52" width="60" height="14" rx="2" strokeWidth="1.5" strokeOpacity="0.55"/>
      <rect x="22" y="36" width="52" height="14" rx="2" strokeWidth="1.5" strokeOpacity="0.7"/>
      {/* GLASS CEILING */}
      <line x1="8" y1="34" x2="88" y2="34" strokeWidth="3" strokeOpacity="0.9"/>
      <text x="48" y="31" textAnchor="middle" fontSize="7" stroke="none" fill="#1e3a5f" opacity="0.5" fontWeight="bold">GLASS CEILING</text>
      {/* Top floor — only men (stick figures) */}
      <circle cx="38" cy="18" r="5" strokeWidth="1.4"/>
      <path d="M34 26 Q38 22 42 26 L44 34 L32 34Z" strokeWidth="1.2"/>
      <circle cx="58" cy="18" r="5" strokeWidth="1.4"/>
      <path d="M54 26 Q58 22 62 26 L64 34 L52 34Z" strokeWidth="1.2"/>
      {/* Woman figure hitting ceiling */}
      <circle cx="48" cy="46" r="7" strokeWidth="1.8"/>
      <path d="M42 56 Q48 52 54 56 L56 66 L40 66Z" strokeWidth="1.6"/>
      {/* Raised hand hitting ceiling */}
      <path d="M54 54 Q60 46 58 36" strokeWidth="1.6"/>
      <circle cx="57" cy="34" r="3" strokeWidth="1.5"/>
      {/* Crack lines in glass */}
      <path d="M57 34 L66 28 M57 34 L62 34 M57 34 L65 38" strokeWidth="1" strokeOpacity="0.5"/>
    </S>
  );
}

// Card 4 — Pay Gap
// Two rupee coin stacks — men's taller, women's shorter
export function PayGapIcon() {
  return (
    <S>
      {/* Label */}
      <text x="28" y="88" textAnchor="middle" fontSize="9" stroke="none" fill="#1e3a5f" fontWeight="bold">MEN</text>
      <text x="68" y="88" textAnchor="middle" fontSize="9" stroke="none" fill="#1e3a5f" fontWeight="bold">WOMEN</text>
      {/* Men's stack (taller) */}
      <ellipse cx="28" cy="78" rx="14" ry="5" strokeWidth="1.5"/>
      {[68, 58, 48, 38, 28, 18, 10].map((y, i) => (
        <g key={i}>
          <ellipse cx="28" cy={y} rx="14" ry="5" strokeWidth={i === 0 ? 1.5 : 1.2} strokeOpacity={i === 0 ? 1 : 0.6}/>
          {i > 0 && <rect x="14" y={y} width="28" height="10" strokeWidth="0" fill="white"/>}
          {i > 0 && <line x1="14" y1={y} x2="14" y2={y + 10} strokeWidth="1" strokeOpacity="0.5"/>}
          {i > 0 && <line x1="42" y1={y} x2="42" y2={y + 10} strokeWidth="1" strokeOpacity="0.5"/>}
        </g>
      ))}
      {/* Rupee symbol on top coin */}
      <text x="28" y="14" textAnchor="middle" fontSize="8" stroke="none" fill="#1e3a5f" fontWeight="bold">₹</text>
      {/* Women's stack (shorter) */}
      <ellipse cx="68" cy="78" rx="14" ry="5" strokeWidth="1.5"/>
      {[68, 58, 48, 40].map((y, i) => (
        <g key={i}>
          <ellipse cx="68" cy={y} rx="14" ry="5" strokeWidth={i === 0 ? 1.5 : 1.2} strokeOpacity={i === 0 ? 1 : 0.6}/>
          {i > 0 && <rect x="54" y={y} width="28" height="10" strokeWidth="0" fill="white"/>}
          {i > 0 && <line x1="54" y1={y} x2="54" y2={y + 10} strokeWidth="1" strokeOpacity="0.5"/>}
          {i > 0 && <line x1="82" y1={y} x2="82" y2={y + 10} strokeWidth="1" strokeOpacity="0.5"/>}
        </g>
      ))}
      <text x="68" y="44" textAnchor="middle" fontSize="8" stroke="none" fill="#1e3a5f" fontWeight="bold">₹</text>
      {/* Gap arrow */}
      <path d="M42 40 L54 40" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="2 1.5"/>
      <path d="M50 37 L54 40 L50 43" stroke="#dc2626" strokeWidth="1.5"/>
      <text x="48" y="35" textAnchor="middle" fontSize="7" stroke="none" fill="#dc2626" fontWeight="bold">-24%</text>
    </S>
  );
}

// Card 5 — Safety as an Economic Problem
// Woman + shield + city skyline + road
export function SafetyIcon() {
  return (
    <S>
      {/* City skyline in background */}
      <rect x="6"  y="56" width="10" height="28" rx="1" strokeWidth="1.2" strokeOpacity="0.3"/>
      <rect x="18" y="44" width="12" height="40" rx="1" strokeWidth="1.2" strokeOpacity="0.3"/>
      <rect x="66" y="50" width="12" height="34" rx="1" strokeWidth="1.2" strokeOpacity="0.3"/>
      <rect x="80" y="40" width="10" height="44" rx="1" strokeWidth="1.2" strokeOpacity="0.3"/>
      {/* Road */}
      <path d="M0 84 L96 84" strokeWidth="1.5" strokeOpacity="0.3"/>
      <path d="M8 84 L16 84 M26 84 L34 84 M44 84 L52 84 M62 84 L70 84 M80 84 L88 84" strokeWidth="1.2" strokeDasharray="6 4" stroke="#1e3a5f" strokeOpacity="0.25"/>
      {/* Big shield */}
      <path d="M48 14 L74 22 L74 48 Q74 66 48 76 Q22 66 22 48 L22 22 Z" strokeWidth="2"/>
      {/* Shield inner pattern */}
      <path d="M48 22 L66 28 L66 46 Q66 58 48 66 Q30 58 30 46 L30 28 Z" strokeWidth="1" strokeOpacity="0.35"/>
      {/* Checkmark inside shield */}
      <path d="M36 44 L44 52 L60 34" strokeWidth="2.5" strokeOpacity="0.8"/>
      {/* Woman figure walking (small, on road) */}
      <circle cx="48" cy="82" r="5" strokeWidth="1.5"/>
      <path d="M44 90 Q48 87 52 90 L53 95 L43 95Z" strokeWidth="1.3"/>
      {/* Footsteps */}
      <ellipse cx="38" cy="95" rx="3" ry="1.5" strokeWidth="1" strokeOpacity="0.4" transform="rotate(-15 38 95)"/>
      <ellipse cx="32" cy="94" rx="3" ry="1.5" strokeWidth="1" strokeOpacity="0.3" transform="rotate(-15 32 94)"/>
    </S>
  );
}

// Card 6 — Education's Broken Promise
// Graduation cap + open book + broken pipeline arrow
export function EducationIcon() {
  return (
    <S>
      {/* Open book */}
      <path d="M12 58 L12 82 Q12 84 14 84 L46 84 Q48 84 48 82 L48 58 Q48 56 46 56 L14 56 Q12 56 12 58Z" strokeWidth="1.6"/>
      <path d="M48 58 L48 82 Q48 84 50 84 L82 84 Q84 84 84 82 L84 58 Q84 56 82 56 L50 56 Q48 56 48 58Z" strokeWidth="1.6"/>
      <line x1="48" y1="56" x2="48" y2="84" strokeWidth="1.8"/>
      {/* Book lines */}
      <line x1="18" y1="64" x2="42" y2="64" strokeWidth="1.1" strokeOpacity="0.5"/>
      <line x1="18" y1="70" x2="42" y2="70" strokeWidth="1.1" strokeOpacity="0.5"/>
      <line x1="18" y1="76" x2="36" y2="76" strokeWidth="1.1" strokeOpacity="0.5"/>
      <line x1="54" y1="64" x2="78" y2="64" strokeWidth="1.1" strokeOpacity="0.5"/>
      <line x1="54" y1="70" x2="78" y2="70" strokeWidth="1.1" strokeOpacity="0.5"/>
      <line x1="54" y1="76" x2="70" y2="76" strokeWidth="1.1" strokeOpacity="0.5"/>
      {/* Graduation cap */}
      <path d="M20 44 L48 32 L76 44 L48 56 Z" strokeWidth="1.8"/>
      <rect x="44" y="44" width="8" height="12" strokeWidth="1.5"/>
      <path d="M52 50 Q62 52 64 60 L60 62 Q58 54 52 52" strokeWidth="1.3"/>
      <circle cx="60" cy="63" r="3" strokeWidth="1.3"/>
      {/* Broken pipeline / funnel */}
      <path d="M8 24 L22 32" strokeWidth="2" strokeLinecap="round"/>
      {/* Break gap */}
      <path d="M26 34 L18 44" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="3 2"/>
      {/* Sad small figures showing dropout */}
      <circle cx="14" cy="20" r="4" strokeWidth="1.3"/>
      <circle cx="80" cy="20" r="4" strokeWidth="1.3" strokeOpacity="0.3" strokeDasharray="2 1.5"/>
      {/* Pipeline percentage labels */}
      <text x="7"  y="16" fontSize="6" stroke="none" fill="#1e3a5f" fontWeight="bold">97%</text>
      <text x="73" y="16" fontSize="6" stroke="none" fill="#dc2626" fontWeight="bold" opacity="0.7">27%</text>
    </S>
  );
}

// Card 7 — Health Silence
// Group of women figures + heartbeat / medical cross
export function HealthIcon() {
  return (
    <S>
      {/* Three women silhouettes (group) */}
      {[20, 48, 76].map((cx, i) => (
        <g key={i} opacity={i === 1 ? 1 : 0.55}>
          <circle cx={cx} cy="30" r="9" strokeWidth={i === 1 ? 1.8 : 1.4}/>
          {/* bindi on middle woman */}
          {i === 1 && <circle cx={cx} cy="27" r="1.5" fill="#1e3a5f" stroke="none"/>}
          <path d={`M${cx-8} 42 Q${cx} 37 ${cx+8} 42 L${cx+10} 60 L${cx-10} 60Z`} strokeWidth={i === 1 ? 1.8 : 1.4}/>
        </g>
      ))}
      {/* Heartbeat line across bottom */}
      <path d="M4 78 L18 78 L24 66 L30 86 L36 72 L42 78 L52 78 L58 68 L64 88 L70 74 L76 78 L92 78" strokeWidth="2" stroke="#dc2626" strokeOpacity="0.8"/>
      {/* Medical cross */}
      <rect x="42" y="14" width="12" height="34" rx="2" strokeWidth="1.8"/>
      <rect x="30" y="22" width="36" height="12" rx="2" strokeWidth="1.8"/>
      {/* Missing women dots — faded */}
      {[8, 16, 24, 32, 40, 48, 56, 64].map((x, i) => (
        <circle key={i} cx={x} cy="6" r="2" fill="#dc2626" stroke="none" opacity={0.12 + i * 0.02}/>
      ))}
      <text x="48" y="8" textAnchor="middle" fontSize="6" stroke="none" fill="#dc2626" fontWeight="bold" opacity="0.5">63M missing</text>
    </S>
  );
}

export const HOOK_ICONS = {
  women_workforce: WorkforceIcon,
  women_proxy:     ProxyIcon,
  women_ceiling:   GlassCeilingIcon,
  women_pay_gap:   PayGapIcon,
  women_safety:    SafetyIcon,
  women_education: EducationIcon,
  women_health:    HealthIcon,
};
