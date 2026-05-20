// Geometric outline of a rural Indian woman carrying a water pot.
// Drawn in the same line-art style as the India map — brand-navy strokes,
// clean paths, no fill (except accent dots for bindi/bangles).

export default function IndianWomanOutline({ className = '', color = '#1e3a5f' }) {
  return (
    <svg
      viewBox="0 0 140 290"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Rural Indian woman"
    >
      {/* ── Water pot (matka) ── */}
      <ellipse cx="68" cy="14"  rx="18" ry="12" strokeWidth="1.6"/>
      <ellipse cx="68" cy="6"   rx="10" ry="4.5" strokeWidth="1.4"/>
      <path    d="M50 20 Q68 30 86 20"              strokeWidth="1.4"/>
      {/* pot handles */}
      <path d="M52 10 Q46 14 49 20" strokeWidth="1.1" strokeOpacity="0.5"/>
      <path d="M84 10 Q90 14 87 20" strokeWidth="1.1" strokeOpacity="0.5"/>

      {/* ── Head ── */}
      <circle cx="68" cy="48" r="20" strokeWidth="1.6"/>

      {/* ── Hair / juda (bun at back-top) ── */}
      <path d="M80 33 Q92 26 94 34 Q94 43 87 43 Q81 43 80 37" strokeWidth="1.4"/>
      {/* loose hair strands */}
      <path d="M84 36 Q88 40 86 44" strokeWidth="1"  strokeOpacity="0.45"/>
      <path d="M88 30 Q95 28 96 34" strokeWidth="1"  strokeOpacity="0.35"/>

      {/* ── Face details ── */}
      {/* bindi */}
      <circle cx="68" cy="44" r="2" fill={color} stroke="none"/>
      {/* eyes */}
      <ellipse cx="60" cy="50" rx="3.5" ry="2" strokeWidth="1.1"/>
      <ellipse cx="76" cy="50" rx="3.5" ry="2" strokeWidth="1.1"/>
      <circle  cx="61" cy="50" r="1.2"  fill={color} stroke="none"/>
      <circle  cx="77" cy="50" r="1.2"  fill={color} stroke="none"/>
      {/* nose */}
      <path d="M68 52 Q65 57 67 59 Q68 60 69 59 Q71 57 68 52" strokeWidth="1"/>
      {/* lips */}
      <path d="M63 63 Q68 67 73 63" strokeWidth="1.2"/>
      {/* ear */}
      <path d="M48 47 Q44 50 46 56 Q48 60 52 58" strokeWidth="1.1"/>
      {/* earring */}
      <circle cx="45" cy="53" r="3" strokeWidth="1.1"/>
      <line x1="45" y1="56" x2="45" y2="61" strokeWidth="1.1"/>
      <circle cx="45" cy="63" r="2.5" strokeWidth="1.1"/>

      {/* ── Neck ── */}
      <path d="M60 68 L58 78 M76 68 L74 78"  strokeWidth="1.4"/>
      <path d="M58 78 Q68 82 74 78"           strokeWidth="1.4"/>
      {/* necklace */}
      <path d="M56 82 Q68 90 80 82"          strokeWidth="1"   strokeOpacity="0.55"/>
      <circle cx="68" cy="89" r="2"           strokeWidth="1"   strokeOpacity="0.55"/>

      {/* ── Blouse (choli) ── */}
      <path d="M46 76 Q52 72 68 72 Q84 72 90 76 Q96 82 90 92 Q84 98 68 98 Q52 98 46 92 Q40 82 46 76 Z" strokeWidth="1.5"/>
      {/* blouse pattern lines */}
      <path d="M50 80 Q68 76 86 80" strokeWidth="0.8" strokeOpacity="0.35"/>

      {/* ── Saree pallu (over left shoulder, flowing) ── */}
      <path d="M46 76 Q36 84 28 96 Q22 108 26 122 Q30 134 40 140" strokeWidth="1.4"/>
      {/* pallu drape folds */}
      <path d="M30 100 Q24 112 26 124" strokeWidth="1"   strokeOpacity="0.5"/>
      <path d="M34 96  Q28 108 30 120" strokeWidth="1"   strokeOpacity="0.4"/>
      {/* pallu hanging end */}
      <path d="M26 122 Q20 136 18 152 Q16 162 20 170" strokeWidth="1.3" strokeOpacity="0.7"/>

      {/* ── Left arm (slightly raised, hand at side) ── */}
      <path d="M46 84 Q38 96 34 112 Q30 126 34 138" strokeWidth="1.5"/>
      {/* left hand fingers */}
      <path d="M34 138 Q30 142 28 140 M34 138 Q32 144 30 143 M34 138 Q34 145 32 145" strokeWidth="1" strokeOpacity="0.6"/>
      {/* bangles */}
      <ellipse cx="34" cy="128" rx="5" ry="2"  strokeWidth="1.2"/>
      <ellipse cx="34" cy="133" rx="5" ry="2"  strokeWidth="1.2"/>
      <ellipse cx="34" cy="138" rx="4.5" ry="2" strokeWidth="1.2"/>

      {/* ── Right arm (down, holding saree end) ── */}
      <path d="M90 84 Q100 98 104 114 Q106 126 102 136" strokeWidth="1.5"/>
      {/* right hand */}
      <path d="M102 136 Q106 140 108 138 M102 136 Q104 143 106 142 M102 136 Q102 143 104 144" strokeWidth="1" strokeOpacity="0.6"/>
      {/* right bangles */}
      <ellipse cx="104" cy="120" rx="5" ry="2" strokeWidth="1.2"/>
      <ellipse cx="105" cy="126" rx="5" ry="2" strokeWidth="1.2"/>

      {/* ── Saree body (main draped fabric) ── */}
      <path d="M46 98 Q40 128 38 160 Q36 188 40 210 Q44 228 68 232 Q92 228 96 210 Q100 188 98 160 Q96 128 90 98" strokeWidth="1.6"/>

      {/* ── Saree pleats (front, fan-folded) ── */}
      <path d="M52 178 Q56 172 60 178 Q64 184 68 178 Q72 172 76 178 Q80 184 84 178" strokeWidth="1.2" strokeOpacity="0.7"/>
      <path d="M50 188 Q54 182 58 188 Q62 194 66 188 Q70 182 74 188 Q78 194 82 188 Q86 182 90 188" strokeWidth="1.2" strokeOpacity="0.55"/>
      {/* horizontal saree border lines */}
      <path d="M40 208 Q68 214 96 208" strokeWidth="1.1" strokeOpacity="0.45"/>
      <path d="M42 212 Q68 218 94 212" strokeWidth="1.1" strokeOpacity="0.35"/>

      {/* ── Legs / feet (under saree) ── */}
      <path d="M56 232 Q54 248 52 262 Q50 272 52 278" strokeWidth="1.4"/>
      <path d="M80 232 Q80 248 80 262 Q80 272 78 278" strokeWidth="1.4"/>
      {/* feet / payal (anklet) */}
      <path d="M46 276 Q52 280 60 278" strokeWidth="1.2"/>
      <path d="M78 276 Q82 280 90 278" strokeWidth="1.2"/>
      <ellipse cx="52" cy="268" rx="6" ry="2"  strokeWidth="1"  strokeOpacity="0.6"/>
      <ellipse cx="80" cy="268" rx="6" ry="2"  strokeWidth="1"  strokeOpacity="0.6"/>

      {/* ── Ground line ── */}
      <line x1="32" y1="282" x2="104" y2="282" strokeWidth="1.2" strokeOpacity="0.25"/>

      {/* ── Shadow dots (artistic accent) ── */}
      <circle cx="50"  cy="220" r="1"   fill={color} stroke="none" opacity="0.2"/>
      <circle cx="86"  cy="220" r="1"   fill={color} stroke="none" opacity="0.2"/>
      <circle cx="68"  cy="224" r="1.2" fill={color} stroke="none" opacity="0.2"/>
    </svg>
  );
}
