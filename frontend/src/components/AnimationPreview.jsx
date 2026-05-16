import { Link } from 'react-router-dom';

// ── Option A: Orbit Animation ─────────────────────────────────────────────────
function OrbitAnimation() {
  const cx = 120, cy = 120, r = 88;

  const cities = [
    { name: 'Dehradun',  angle: -90  },
    { name: 'Kolkata',   angle: -18  },
    { name: 'Bangalore', angle:  54  },
    { name: 'Chennai',   angle: 126  },
    { name: 'Pune',      angle: 198  },
    { name: 'Bhopal',    angle: 270  },
  ];

  function pt(angle) {
    const a = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  return (
    <svg viewBox="0 0 240 240" className="w-72 h-72">
      {/* Outer orbit ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e3a5f"
        strokeWidth="0.5" strokeDasharray="3 5" opacity="0.2" />
      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#1e3a5f"
        strokeWidth="0.5" strokeDasharray="2 6" opacity="0.1" />

      {/* Animated connecting lines city → center */}
      {cities.map((city, i) => {
        const { x, y } = pt(city.angle);
        const len = Math.hypot(x - cx, y - cy);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke="#1e3a5f" strokeWidth="1" strokeDasharray="5 4" opacity="0.35">
            <animate attributeName="stroke-dashoffset"
              from={len} to="0" dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* City dots with pulse */}
      {cities.map((city, i) => {
        const { x, y } = pt(city.angle);
        const above = y < cy - 10;
        const right = x > cx + 10;
        const anchor = right ? 'start' : x < cx - 10 ? 'end' : 'middle';
        const lx = right ? x + 9 : x < cx - 10 ? x - 9 : x;
        const ly = above ? y - 10 : y + 18;

        return (
          <g key={i}>
            {/* Pulse ring */}
            <circle cx={x} cy={y} r="4" fill="#1e3a5f" opacity="0.15">
              <animate attributeName="r" values="4;14;4"
                dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0;0.15"
                dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r="4.5" fill="#1e3a5f" />
            <circle cx={x} cy={y} r="2.5" fill="white" />
            <text x={lx} y={ly} fontSize="8.5" fill="#1e3a5f" opacity="0.75"
              textAnchor={anchor} fontWeight="700" fontFamily="Inter, sans-serif">
              {city.name}
            </text>
          </g>
        );
      })}

      {/* Centre: SSBCircle logo */}
      <circle cx={cx} cy={cy} r="22" fill="white" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx={cx - 8}  cy={cy - 5} r="2.8" fill="#1e3a5f" />
      <circle cx={cx}      cy={cy - 10} r="2.8" fill="#1e3a5f" />
      <circle cx={cx + 8}  cy={cy - 5} r="2.8" fill="#1e3a5f" />
      <circle cx={cx + 5}  cy={cy + 5} r="2.8" fill="#1e3a5f" />
      <circle cx={cx - 5}  cy={cy + 5} r="2.8" fill="#1e3a5f" />
      <path d={`M${cx-8} ${cy-5} L${cx} ${cy-10} L${cx+8} ${cy-5} L${cx+5} ${cy+5} L${cx-5} ${cy+5} Z`}
        stroke="#1e3a5f" strokeWidth="1.2" fill="none" />

      {/* Slow rotation hint — orbiting dot */}
      <circle r="3" fill="#1e3a5f" opacity="0.4">
        <animateMotion dur="12s" repeatCount="indefinite">
          <mpath href="#orbitPath" />
        </animateMotion>
      </circle>
      <path id="orbitPath" d={`M${cx + r},${cy} a${r},${r} 0 1,1 -0.01,0`} fill="none" />
    </svg>
  );
}

// ── Option B: India Map Animation ─────────────────────────────────────────────
function IndiaMapAnimation() {
  // Accurate India outline — viewBox 0 0 300 305, scale 10.1px per degree
  const mapPath = [
    'M 60,0',
    'L 84,16 L 90,31 L 109,41',
    'L 129,72 L 119,82',
    'L 200,97 L 215,94',
    'L 292,92 L 296,97',
    'L 272,111 L 262,126 L 250,140',
    'L 247,153 L 210,153 L 205,158',
    'L 190,173',
    'L 157,200 L 124,213',
    'L 120,233 L 122,274',
    'L 95,293',
    'L 85,284 L 70,254 L 63,228 L 59,223',
    'L 47,184',
    'L 38,168 L 38,153',
    'L 13,158',
    'L 18,143 L 13,137 L 3,132',
    'L 18,82 L 49,52',
    'L 60,0 Z',
  ].join(' ');

  const centers = [
    { name: 'Dehradun',  x: 99,  y: 69,  delay: 0   },
    { name: 'Allahabad', x: 137, y: 117, delay: 0.5 },
    { name: 'Kolkata',   x: 204, y: 146, delay: 1.0 },
    { name: 'Pune',      x: 58,  y: 188, delay: 1.5 },
    { name: 'Bangalore', x: 95,  y: 243, delay: 2.0 },
    { name: 'Chennai',   x: 122, y: 242, delay: 2.5 },
  ];

  // Connections between nearby centers
  const connections = [
    [0, 1], [1, 2], [1, 3], [0, 3], [3, 4], [3, 5], [4, 5],
  ];

  return (
    <svg viewBox="0 0 300 305" className="w-56 h-56">
      {/* Map outline */}
      <path d={mapPath} fill="#f0f4f8" stroke="#1e3a5f" strokeWidth="1.5"
        strokeLinejoin="round" opacity="0.9" />

      {/* Connecting lines between centers */}
      {connections.map(([a, b], i) => {
        const ca = centers[a], cb = centers[b];
        const len = Math.hypot(cb.x - ca.x, cb.y - ca.y);
        return (
          <line key={i} x1={ca.x} y1={ca.y} x2={cb.x} y2={cb.y}
            stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4 3" opacity="0.3">
            <animate attributeName="stroke-dashoffset"
              from={len} to="0" dur={`${1.8 + i * 0.2}s`} repeatCount="indefinite" />
          </line>
        );
      })}

      {/* SSB Center dots */}
      {centers.map((c, i) => {
        const above = c.y < 150;
        const right = c.x > 150;
        const anchor = right ? 'start' : 'end';
        const lx = right ? c.x + 7 : c.x - 7;
        const ly = above ? c.y - 8 : c.y + 14;

        return (
          <g key={i}>
            {/* Pulse */}
            <circle cx={c.x} cy={c.y} r="4" fill="#1e3a5f" opacity="0.12">
              <animate attributeName="r" values="4;13;4"
                dur={`${2.2 + i * 0.3}s`} begin={`${c.delay}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0;0.15"
                dur={`${2.2 + i * 0.3}s`} begin={`${c.delay}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={c.x} cy={c.y} r="4.5" fill="#1e3a5f" />
            <circle cx={c.x} cy={c.y} r="2.2" fill="white" />
            <text x={lx} y={ly} fontSize="7.5" fill="#1e3a5f" opacity="0.8"
              textAnchor={anchor} fontWeight="700" fontFamily="Inter, sans-serif">
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Preview page ──────────────────────────────────────────────────────────────
export default function AnimationPreview() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Back to home</Link>

        <h1 className="text-xl font-bold text-gray-900 mt-4 mb-1">Animation Preview</h1>
        <p className="text-sm text-gray-400 mb-10">Both options use pure SVG + CSS — zero JS runtime, zero performance cost.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Option A */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Option A</span>
              <h2 className="text-base font-bold text-gray-900 mt-1">Orbit</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">SSB aspirants from major cities orbiting the platform — shows connection</p>
            </div>
            <OrbitAnimation />
          </div>

          {/* Option B */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Option B</span>
              <h2 className="text-base font-bold text-gray-900 mt-1">India Map</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">SSB centres across India pulsing and connecting — more meaningful, SSB-specific</p>
            </div>
            <IndiaMapAnimation />
          </div>

        </div>

        <p className="text-center text-xs text-gray-300 mt-8">Tell me which one you prefer and I'll add it to the homepage hero.</p>
      </div>
    </div>
  );
}
