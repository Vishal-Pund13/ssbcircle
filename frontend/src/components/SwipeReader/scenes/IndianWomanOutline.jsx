// Line-art outline of an Indian Army woman officer — peaked cap, epaulettes,
// rank stars, medal ribbons, belt, trousers and boots. Brand-navy strokes.

export default function IndianWomanOutline({ className = '', color = '#1e3a5f' }) {
  return (
    <svg
      viewBox="0 0 100 268"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Indian Army woman officer"
    >
      {/* ── Peaked cap ── */}
      {/* Crown dome */}
      <path d="M32 60 Q34 40 50 38 Q66 40 68 60" strokeWidth="1.8" />
      {/* Band */}
      <line x1="26" y1="60" x2="74" y2="60" strokeWidth="2.6" />
      {/* Brim curve */}
      <path d="M26 60 Q50 66 74 60" strokeWidth="1.3" />
      {/* Cap badge — 5-pt star */}
      <path d="M50 50 L51.5 54 L55.5 54 L52.3 56.4 L53.6 60.4 L50 58 L46.4 60.4 L47.7 56.4 L44.5 54 L48.5 54 Z"
        fill={color} stroke="none" opacity="0.6" />

      {/* ── Head ── */}
      <circle cx="50" cy="73" r="17" strokeWidth="1.7" />

      {/* ── Hair lines at temples (bun pulled back) ── */}
      <path d="M34 62 Q37 58 39 65" strokeWidth="1" strokeOpacity="0.45" />
      <path d="M66 62 Q63 58 61 65" strokeWidth="1" strokeOpacity="0.45" />

      {/* ── Face ── */}
      {/* Eyes */}
      <ellipse cx="43" cy="71" rx="3" ry="1.8" strokeWidth="1.1" />
      <ellipse cx="57" cy="71" rx="3" ry="1.8" strokeWidth="1.1" />
      <circle cx="44" cy="71" r="1.1" fill={color} stroke="none" />
      <circle cx="58" cy="71" r="1.1" fill={color} stroke="none" />
      {/* Nose */}
      <path d="M50 74 Q48 78 49 80 Q50 81 51 80 Q52 78 50 74" strokeWidth="0.9" />
      {/* Composed mouth */}
      <path d="M45 84 Q50 87 55 84" strokeWidth="1.1" />

      {/* ── Ears ── */}
      <path d="M33 69 Q29 73 31 79 Q33 83 37 81" strokeWidth="1.1" />
      <path d="M67 69 Q71 73 69 79 Q67 83 63 81" strokeWidth="1.1" />
      {/* Small earrings */}
      <circle cx="30" cy="76" r="1.4" strokeWidth="1.1" />
      <circle cx="70" cy="76" r="1.4" strokeWidth="1.1" />

      {/* ── Neck ── */}
      <path d="M44 90 L42 99" strokeWidth="1.4" />
      <path d="M56 90 L58 99" strokeWidth="1.4" />
      <path d="M42 99 Q50 103 58 99" strokeWidth="1.3" />

      {/* ── Uniform jacket ── */}
      <path d="M16 110 Q14 136 14 158 L86 158 Q86 136 84 110 Q68 100 50 100 Q32 100 16 110 Z"
        strokeWidth="1.6" />

      {/* Collar — V shape */}
      <path d="M42 99 L36 110 L46 118" strokeWidth="1.3" />
      <path d="M58 99 L64 110 L54 118" strokeWidth="1.3" />
      {/* Centre line */}
      <line x1="50" y1="102" x2="50" y2="120" strokeWidth="0.9" strokeOpacity="0.5" />

      {/* ── Left epaulette (shoulder board) ── */}
      <path d="M16 110 L5 105 Q3 97 10 95 Q21 92 27 104 L20 112" strokeWidth="1.3" />
      {/* 3 rank stars */}
      <circle cx="9"  cy="100" r="1.9" fill={color} stroke="none" opacity="0.8" />
      <circle cx="14" cy="97"  r="1.9" fill={color} stroke="none" opacity="0.8" />
      <circle cx="19" cy="95"  r="1.9" fill={color} stroke="none" opacity="0.8" />

      {/* ── Right epaulette ── */}
      <path d="M84 110 L95 105 Q97 97 90 95 Q79 92 73 104 L80 112" strokeWidth="1.3" />
      {/* 3 rank stars */}
      <circle cx="91" cy="100" r="1.9" fill={color} stroke="none" opacity="0.8" />
      <circle cx="86" cy="97"  r="1.9" fill={color} stroke="none" opacity="0.8" />
      <circle cx="81" cy="95"  r="1.9" fill={color} stroke="none" opacity="0.8" />

      {/* ── Buttons down centre ── */}
      <circle cx="50" cy="120" r="1.8" fill={color} stroke="none" opacity="0.6" />
      <circle cx="50" cy="131" r="1.8" fill={color} stroke="none" opacity="0.6" />
      <circle cx="50" cy="142" r="1.8" fill={color} stroke="none" opacity="0.6" />
      <circle cx="50" cy="153" r="1.8" fill={color} stroke="none" opacity="0.6" />

      {/* ── Medal ribbons (left chest) ── */}
      <rect x="26" y="120" width="11" height="6" rx="0.5" strokeWidth="1.2" />
      <line x1="28.7" y1="120" x2="28.7" y2="126" strokeWidth="0.9" />
      <line x1="31.5" y1="120" x2="31.5" y2="126" strokeWidth="0.9" />
      <line x1="34.3" y1="120" x2="34.3" y2="126" strokeWidth="0.9" />

      {/* ── Belt ── */}
      <line x1="14" y1="158" x2="86" y2="158" strokeWidth="2.4" />
      {/* Buckle */}
      <rect x="44" y="154" width="12" height="8" rx="1" strokeWidth="1.3" />
      <line x1="50" y1="154" x2="50" y2="162" strokeWidth="1" strokeOpacity="0.45" />

      {/* ── Left arm (at side, at attention) ── */}
      <path d="M14 114 Q6 134 6 154 Q6 166 10 175" strokeWidth="1.5" />
      <path d="M6 167 Q8 172 12 172" strokeWidth="1.2" />
      {/* fingers */}
      <path d="M10 175 Q6 179 8 181 M10 175 Q8 181 10 184 M10 175 Q13 180 15 179"
        strokeWidth="0.9" strokeOpacity="0.6" />

      {/* ── Right arm ── */}
      <path d="M86 114 Q94 134 94 154 Q94 166 90 175" strokeWidth="1.5" />
      <path d="M94 167 Q92 172 88 172" strokeWidth="1.2" />
      {/* fingers */}
      <path d="M90 175 Q94 179 92 181 M90 175 Q92 181 90 184 M90 175 Q87 180 85 179"
        strokeWidth="0.9" strokeOpacity="0.6" />

      {/* ── Trouser waistband ── */}
      <path d="M16 162 Q50 166 84 162" strokeWidth="1.4" />

      {/* ── Left trouser leg ── */}
      <path d="M16 166 L12 252" strokeWidth="1.5" />
      <path d="M44 166 L46 252" strokeWidth="1.5" />
      <line x1="28" y1="168" x2="28" y2="249" strokeWidth="0.7" strokeOpacity="0.38" />

      {/* ── Right trouser leg ── */}
      <path d="M56 166 L54 252" strokeWidth="1.5" />
      <path d="M84 166 L86 252" strokeWidth="1.5" />
      <line x1="71" y1="168" x2="71" y2="249" strokeWidth="0.7" strokeOpacity="0.38" />

      {/* ── Left boot ── */}
      <path d="M12 250 Q8 255 8 260 Q8 266 26 266 Q40 266 42 260 Q44 254 46 250" strokeWidth="1.5" />
      <line x1="6" y1="266" x2="44" y2="266" strokeWidth="1.3" />

      {/* ── Right boot ── */}
      <path d="M54 250 Q52 255 52 260 Q52 266 70 266 Q84 266 86 260 Q88 254 86 250" strokeWidth="1.5" />
      <line x1="50" y1="266" x2="88" y2="266" strokeWidth="1.3" />

      {/* ── Ground shadow ── */}
      <line x1="2" y1="268" x2="98" y2="268" strokeWidth="1" strokeOpacity="0.16" />
    </svg>
  );
}
