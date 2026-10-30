// Small line-and-fill illustrations for the page covers, one per page. Drawn
// here rather than taken from photos: no licence questions, they stay sharp at
// any size, and they share the site's own colours.
//
// Every scene is drawn in a 520 × 160 box and pinned to the band's bottom-right
// corner; figures cut off by the bottom edge are meant to be.

const C = '#1e3a5f';       // brand-600
const AMBER = '#f59e0b';
const GREEN = '#10b981';
const line = { stroke: C, strokeOpacity: 0.35, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
const ink = o => Math.min(o * 1.6, 0.55);   // figures need more weight than props
const card = { fill: '#fff', stroke: C, strokeOpacity: 0.22, strokeWidth: 1.5 };

// A seated person seen from behind; (x, y) is the centre of the head
function Back({ x, y, s = 1, o = 0.22 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={C} fillOpacity={ink(o)}>
      <circle r="9" />
      <path d="M-17 32 C-17 17 -10 12 0 12 C10 12 17 17 17 32 Z" />
    </g>
  );
}

// A person facing us from the chest up
function Bust({ x, y, s = 1, o = 0.24 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={C} fillOpacity={ink(o)}>
      <circle r="11" />
      <path d="M-22 42 C-22 22 -12 15 0 15 C12 15 22 22 22 42 Z" />
    </g>
  );
}

// A person at a desk, head down, writing on a sheet
function Writer({ x, y, s = 1, o = 0.24 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={C} fillOpacity={ink(o)}>
        <circle cy="2" r="9" />
        <path d="M-16 32 C-16 18 -9 13 0 13 C9 13 16 18 16 32 Z" />
      </g>
      <rect x="-32" y="27" width="64" height="7" rx="2" fill={C} fillOpacity={ink(o + 0.08)} />
      <path d="M-14 20 L12 20 L15 27 L-17 27 Z" {...card} />
      <path d="M-9 23 H6" {...line} strokeWidth="1.2" />
      <path d="M8 13 L13 24" stroke={C} strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Tat() {
  return (
    <>
      {/* The screen with a TAT-style picture on it */}
      <rect x="250" y="10" width="200" height="94" rx="6" {...card} strokeWidth="2" />
      <rect x="258" y="18" width="184" height="78" rx="3" fill={C} fillOpacity="0.06" />
      <circle cx="412" cy="36" r="9" fill={AMBER} fillOpacity="0.45" />
      <path d="M258 96 L308 58 L340 78 L372 60 L442 96 Z" fill={C} fillOpacity="0.16" />
      <g fill={C} fillOpacity="0.45">
        <circle cx="322" cy="58" r="3.5" />
        <path d="M318 76 L320 63 L324 63 L326 76 Z" />
      </g>
      {/* Aspirants in rows, all facing it */}
      {[230, 266, 302, 338, 374, 410, 446, 482].map(x => <Back key={x} x={x} y={122} s={0.7} o={0.16} />)}
      {[212, 254, 296, 338, 380, 422, 464, 506].map(x => <Back key={x} x={x} y={136} s={0.88} o={0.22} />)}
      {[232, 284, 336, 388, 440, 492].map(x => <Back key={x} x={x} y={153} s={1.05} o={0.3} />)}
    </>
  );
}

function Piq() {
  return (
    <>
      {/* The form itself */}
      <g transform="rotate(-6 175 70)">
        <rect x="140" y="18" width="70" height="92" rx="5" {...card} />
        <rect x="150" y="28" width="34" height="5" rx="2" fill={C} fillOpacity="0.35" />
        {[44, 58, 72, 86].map(y => (
          <g key={y}>
            <rect x="150" y={y} width="7" height="7" rx="1.5" fill="none" stroke={C} strokeOpacity="0.4" strokeWidth="1.3" />
            <path d={`M162 ${y + 3.5} H200`} {...line} strokeWidth="1.3" />
          </g>
        ))}
        <path d="M151 47 L153 49 L156 45" stroke={GREEN} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M151 61 L153 63 L156 59" stroke={GREEN} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      {/* Aspirants writing theirs */}
      {[262, 332, 402, 472].map(x => <Writer key={x} x={x} y={62} s={0.78} o={0.16} />)}
      {[232, 318, 404, 488].map(x => <Writer key={x} x={x} y={112} s={0.98} o={0.26} />)}
    </>
  );
}

function Prep() {
  return (
    <>
      {/* Open book */}
      <path d="M150 128 C175 116 200 116 222 126 L222 70 C200 60 175 60 150 72 Z" {...card} />
      <path d="M222 126 C244 116 269 116 294 128 L294 72 C269 60 244 60 222 70 Z" {...card} />
      {[80, 92, 104].map(y => <path key={y} d={`M162 ${y} C178 ${y - 6} 196 ${y - 6} 212 ${y}`} {...line} strokeWidth="1.3" />)}
      {[80, 92, 104].map(y => <path key={y} d={`M232 ${y} C248 ${y - 6} 266 ${y - 6} 282 ${y}`} {...line} strokeWidth="1.3" />)}
      {/* Checklist */}
      <rect x="312" y="16" width="96" height="112" rx="6" {...card} />
      {[32, 56, 80, 104].map((y, i) => (
        <g key={y}>
          <circle cx="328" cy={y} r="6" fill={i < 3 ? GREEN : 'none'} fillOpacity={i < 3 ? 0.75 : 0} stroke={i < 3 ? 'none' : C} strokeOpacity="0.35" strokeWidth="1.5" />
          {i < 3 && <path d={`M325 ${y} L327.5 ${y + 2.5} L331.5 ${y - 2.5}`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />}
          <path d={`M340 ${y} H${i % 2 ? 392 : 384}`} {...line} strokeWidth="1.5" />
        </g>
      ))}
      {/* A month of daily practice */}
      {Array.from({ length: 28 }, (_, i) => {
        const v = [0.75, 0.55, 0.9, 0.35, 0.75, 0.15, 0.6][(i * 3) % 7];
        return <rect key={i} x={428 + (i % 7) * 13} y={30 + Math.floor(i / 7) * 13} width="10" height="10" rx="2" fill={GREEN} fillOpacity={v * 0.8} />;
      })}
      {/* Speak your answer */}
      <rect x="458" y="94" width="18" height="30" rx="9" fill={C} fillOpacity="0.28" />
      <path d="M450 112 C450 126 484 126 484 112 M467 125 V136 M458 136 H476" {...line} />
    </>
  );
}

function Exams() {
  return (
    <>
      {/* Calendar with the exam day ringed */}
      <rect x="290" y="14" width="118" height="112" rx="7" {...card} />
      <rect x="290" y="14" width="118" height="22" rx="7" fill={C} fillOpacity="0.3" />
      <rect x="290" y="28" width="118" height="8" fill={C} fillOpacity="0.3" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect key={i} x={300 + (i % 5) * 21} y={46 + Math.floor(i / 5) * 19} width="14" height="12" rx="2" fill={C} fillOpacity={i === 13 ? 0 : 0.1} />
      ))}
      <circle cx="370" cy="88" r="11" fill="none" stroke={AMBER} strokeWidth="2.5" strokeOpacity="0.8" />
      <rect x="363" y="82" width="14" height="12" rx="2" fill={AMBER} fillOpacity="0.4" />
      {/* Clock */}
      <circle cx="462" cy="54" r="30" {...card} strokeWidth="2" />
      <path d="M462 34 V54 L476 62" stroke={C} strokeOpacity="0.5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Exam hall */}
      {[150, 190, 230, 270].map(x => <Back key={x} x={x} y={118} s={0.75} o={0.16} />)}
      {[130, 175, 220, 265].map(x => <Back key={x} x={x} y={142} s={0.95} o={0.24} />)}
      {[450, 500].map(x => <Back key={x} x={x} y={140} s={0.95} o={0.2} />)}
    </>
  );
}

function Guide() {
  return (
    <>
      {/* Hills, water, sky — one for each service */}
      <path d="M120 128 L170 84 L200 104 L238 64 L290 128 Z" fill={C} fillOpacity="0.1" />
      <rect x="290" y="128" width="230" height="32" fill={C} fillOpacity="0.07" />
      <path d="M120 128 H520" {...line} strokeOpacity="0.2" />
      {/* Army: a tank */}
      <g fill={C} fillOpacity="0.32">
        <rect x="170" y="114" width="70" height="12" rx="6" />
        <path d="M178 114 L184 104 L226 104 L232 114 Z" />
        <rect x="194" y="96" width="24" height="10" rx="3" />
        <rect x="216" y="99" width="36" height="3.5" rx="1.5" />
      </g>
      {/* Navy: a ship */}
      <g fill={C} fillOpacity="0.32">
        <path d="M318 122 L420 122 L410 136 L328 136 Z" />
        <rect x="344" y="108" width="40" height="14" rx="2" />
        <rect x="356" y="96" width="16" height="12" rx="2" />
        <rect x="363" y="80" width="2.5" height="16" />
      </g>
      <path d="M322 142 C334 138 346 146 358 142 S382 138 394 142" {...line} strokeOpacity="0.2" />
      {/* Air Force: a jet with its trail */}
      <path d="M330 52 C380 46 420 40 448 34" stroke={C} strokeOpacity="0.15" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M492 28 L452 32 L440 22 L434 22 L440 34 L452 38 L492 34 Q500 31 492 28 Z" fill={C} fillOpacity="0.35" />
      <path d="M468 34 L456 48 L462 48 L478 35 Z" fill={C} fillOpacity="0.35" />
      <circle cx="104" cy="40" r="14" fill={AMBER} fillOpacity="0.3" />
    </>
  );
}

function Moderators() {
  return (
    <>
      {/* A team around a table, one wearing the MOD badge */}
      {[[288, 70], [342, 56], [396, 56], [450, 70]].map(([x, y]) => <Back key={x} x={x} y={y} s={0.85} o={0.18} />)}
      <ellipse cx="370" cy="118" rx="124" ry="24" fill={C} fillOpacity="0.1" />
      <ellipse cx="370" cy="114" rx="124" ry="24" {...card} />
      <rect x="338" y="104" width="34" height="20" rx="2" fill="#fff" stroke={C} strokeOpacity="0.25" transform="rotate(-8 355 114)" />
      {[[232, 138], [300, 150], [440, 150], [500, 138]].map(([x, y]) => <Bust key={x} x={x} y={y} s={0.9} o={0.26} />)}
      <g transform="translate(160 26)">
        <path d="M0 0 L22 -6 L44 0 L44 22 C44 38 32 48 22 52 C12 48 0 38 0 22 Z" fill={C} fillOpacity="0.14" stroke={C} strokeOpacity="0.3" strokeWidth="2" />
        <path d="M13 24 L20 31 L32 17" stroke={GREEN} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M220 40 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" fill={AMBER} fillOpacity="0.6" />
    </>
  );
}

function News() {
  return (
    <>
      {/* Stacked news cards */}
      {[[-8, 240], [-2, 262], [4, 286]].map(([r, x], i) => (
        <g key={x} transform={`rotate(${r} ${x + 55} 80)`}>
          <rect x={x} y="20" width="110" height="118" rx="7" {...card} />
          {i === 2 && (
            <>
              <rect x={x + 10} y="30" width="90" height="38" rx="4" fill={C} fillOpacity="0.12" />
              <path d={`M${x + 10} 68 L${x + 38} 48 L${x + 58} 60 L${x + 76} 46 L${x + 100} 68 Z`} fill={C} fillOpacity="0.14" />
              <rect x={x + 10} y="78" width="70" height="6" rx="3" fill={C} fillOpacity="0.4" />
              {[92, 102, 112].map(y => <path key={y} d={`M${x + 10} ${y} H${x + (y === 112 ? 70 : 100)}`} {...line} strokeWidth="1.4" />)}
            </>
          )}
        </g>
      ))}
      {/* Globe */}
      <g {...line} strokeOpacity="0.32">
        <circle cx="454" cy="58" r="34" fill="#fff" />
        <ellipse cx="454" cy="58" rx="14" ry="34" />
        <path d="M420 58 H488 M424 42 H484 M424 74 H484" />
      </g>
      {/* A rising line */}
      <path d="M418 136 L440 118 L458 126 L486 100 L506 106" stroke={GREEN} strokeOpacity="0.7" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Community() {
  return (
    <>
      {/* Aspirants talking it through */}
      <g transform="translate(232 18)">
        <rect width="86" height="40" rx="12" {...card} />
        <path d="M24 40 L30 52 L38 40" {...card} />
        <path d="M14 15 H72 M14 26 H52" {...line} strokeWidth="1.5" />
      </g>
      <g transform="translate(352 8)">
        <rect width="70" height="34" rx="12" fill={C} fillOpacity="0.14" />
        <path d="M40 34 L44 44 L50 34" fill={C} fillOpacity="0.14" />
        {[22, 35, 48].map(x => <circle key={x} cx={x} cy="17" r="3.2" fill={C} fillOpacity="0.45" />)}
      </g>
      <g transform="translate(446 26)">
        <rect width="58" height="34" rx="12" {...card} />
        <path d="M20 34 L24 44 L30 34" {...card} />
        <path d="M29 26 C20 20 18 13 23 11 C26 10 28 12 29 14 C30 12 32 10 35 11 C40 13 38 20 29 26 Z" fill={AMBER} fillOpacity="0.6" />
      </g>
      <Bust x={270} y={104} s={1.05} o={0.24} />
      <Bust x={384} y={92} s={1.15} o={0.3} />
      <Bust x={480} y={106} s={1.05} o={0.22} />
      <Bust x={176} y={118} s={0.85} o={0.14} />
    </>
  );
}

export const SCENES = { tat: Tat, piq: Piq, prep: Prep, exams: Exams, guide: Guide, moderators: Moderators, news: News, community: Community };
