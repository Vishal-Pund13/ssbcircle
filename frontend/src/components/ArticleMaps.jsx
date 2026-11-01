import { useEffect, useRef, useState } from 'react';

// Real maps for articles: [VISUAL:map|Title|preset|note]
//
// Country shapes come from Natural Earth's "India point of view" edition
// (public domain), which draws India's boundaries as India officially claims
// them — all of Jammu & Kashmir and Ladakh, including Aksai Chin, and
// Arunachal Pradesh. A map of India that shows other boundaries must not be
// published in India, so never swap in a generic world map here. The files
// in public/maps/ are clipped to each region and simplified (built with
// mapshaper; d3-geo needs clockwise outer rings, so they were rewound).
//
// Places are plotted at real coordinates. d3-geo and the map file load only
// when the map scrolls into view.

const INK = '#1e3a5f';
const INK_SOFT = '#6b86ad';

const SOURCE = "Boundaries as per India's official position (Natural Earth, India view). Simplified for illustration.";

// [lon, lat]
const PRESETS = {
  lac: {
    width: 360,
    files: ['lac'],
    bounds: [[72.5, 25], [97.5, 37.6]],
    highlight: ['IND'],
    note: 'The LAC — the line each side actually controls — runs inside this boundary in places. Aksai Chin is held by China but claimed by India.',
    regions: [
      { at: [86.5, 33.8], text: 'CHINA (TIBET)', big: true },
      { at: [79.5, 26.3], text: 'INDIA', big: true },
      { at: [84.1, 28.4], text: 'NEPAL' },
      { at: [72.75, 30.4], text: 'PAKISTAN', start: true },
      { at: [97.3, 29.05], text: 'Arunachal Pradesh', sub: 'claimed by China', claim: true, end: true },
    ],
    points: [
      { at: [79.6, 35.2], off: [42, -4], label: 'Aksai Chin', dx: 12, tag: 'Western sector',
        title: 'Aksai Chin', text: 'About 38,000 sq km of Ladakh, held by China but claimed by India. China built a highway through it in the 1950s to link Tibet and Xinjiang — India found out only later. It remains the core of the dispute in the west.' },
      { at: [78.05, 35.35], off: [-18, -18], label: 'Depsang', dx: 12, tag: 'Western sector',
        title: 'Depsang Plains', text: 'A flat high plain near Daulat Beg Oldi, India\'s northernmost post. Chinese troops blocked Indian patrols here from 2020. Under the October 2024 deal, patrolling resumed in November 2024.' },
      { at: [78.2, 34.75], off: [-26, 8], label: 'Galwan', dx: -12, anchor: 'end', tag: 'Western sector',
        title: 'Galwan Valley — 15 June 2020', text: 'The deadliest clash in decades. 20 Indian soldiers, including Col B. Santosh Babu (Maha Vir Chakra), were killed. No shots were fired — old agreements bar firearms near the LAC.' },
      { at: [78.7, 33.75], off: [16, 2], label: 'Pangong Tso', dx: 12, tag: 'Western sector',
        title: 'Pangong Tso (lake)', text: 'A long lake split by the LAC. In August 2020 the Indian Army took the heights of the Kailash Range to its south. That pressure helped bring the first pullback, in February 2021.' },
      { at: [79.45, 32.7], off: [14, 6], label: 'Demchok', dx: 12, tag: 'Western sector',
        title: 'Demchok', text: 'The southernmost friction point in Ladakh. Along with Depsang, it was settled in the October 2024 patrolling deal. Patrolling resumed on 1 November 2024.' },
      { at: [89.0, 27.3], label: 'Doklam', dx: -12, anchor: 'end', tag: 'Eastern sector',
        title: 'Doklam — 2017 stand-off', text: 'A plateau that Bhutan claims, near the India-Bhutan-China tri-junction. Indian troops stopped a Chinese road here. The stand-off lasted 73 days. It matters because it is close to the narrow Siliguri Corridor that links the Northeast to the rest of India.' },
      { at: [91.86, 27.59], label: 'Tawang', dy: 22, anchor: 'middle', tag: 'Eastern sector',
        title: 'Tawang, Arunachal Pradesh', text: 'Home to a famous Buddhist monastery. China claims all of Arunachal Pradesh, about 90,000 sq km. In December 2022, troops clashed at Yangtse in the Tawang sector.' },
    ],
    pins: [
      { at: [77.21, 28.61], text: 'New Delhi', dx: 7, city: true },
    ],
    sectors: [
      { at: [72.8, 32.6], lines: ['Western sector', 'Ladakh · 1,597 km'], anchor: 'start' },
      { at: [80.6, 31.25], lines: ['Middle sector', 'HP, Uttarakhand · 545 km'], anchor: 'start' },
      { at: [97.2, 30.7], lines: ['Eastern sector', 'Sikkim, Arunachal · 1,346 km'], anchor: 'end' },
    ],
  },
  'indo-pacific': {
    width: 380,
    files: ['indo-pacific'],
    bounds: [[36, -32], [151, 43]],
    highlight: ['IND'],
    partners: ['JPN', 'AUS'],
    regions: [
      { at: [104, 33], text: 'CHINA' },
      { at: [82, -16], text: 'Indian Ocean', sea: true },
      { at: [138, 9], text: 'Pacific Ocean', sea: true },
      { at: [114, 12.5], text: 'South China Sea', sea: true, small: true },
    ],
    routes: [
      [[56.4, 26.3], [60, 23], [66, 17], [74, 9], [80.6, 5.5], [88, 5.8], [95, 6.2], [100.2, 3.6], [103.8, 1.2], [109, 6], [113, 11], [118, 19], [124, 24], [131, 30], [137, 33.6], [139.8, 34.8]],
      [[43.4, 12.6], [50, 12.5], [58, 11], [66, 9.5], [74, 9]],
    ],
    points: [
      { at: [56.3, 26.6], label: 'Hormuz', dy: -13, anchor: 'middle', choke: true,
        title: 'Strait of Hormuz', text: 'The narrow exit from the Persian Gulf. About a fifth of the world\'s oil passes through it, and much of India\'s crude oil and gas comes this way. A closure would hit India\'s fuel prices at once.' },
      { at: [43.33, 12.58], label: 'Bab-el-Mandeb', dy: 22, dx: -4, anchor: 'start', choke: true,
        title: 'Bab-el-Mandeb', text: 'The gate to the Red Sea and the Suez Canal — India\'s shortest sea route to Europe. Houthi attacks on ships in 2024 forced many to sail around Africa, and the Indian Navy deployed warships to protect shipping.' },
      { at: [79, 20], label: 'India', dx: 12,
        title: 'India — at the centre', text: 'India sits in the middle of the Indian Ocean, beside the main east-west sea route. About 95% of its trade by volume goes by sea, so safe sea lanes are a matter of national security.' },
      { at: [92.73, 11.62], label: 'Andaman & Nicobar', dx: -12, anchor: 'end',
        title: 'Andaman & Nicobar Islands', text: 'India\'s only tri-service command (Army, Navy and Air Force together, set up in 2001) sits here, close to the western entrance of the Malacca Strait. It works as India\'s watchtower over the busiest route into the Pacific.' },
      { at: [100.6, 3.0], label: 'Malacca', dy: 24, anchor: 'middle', choke: true,
        title: 'Malacca Strait', text: 'One of the busiest sea lanes in the world. Most of the oil for China, Japan and South Korea passes here. China\'s fear of being blocked at this point is called its "Malacca dilemma".' },
      { at: [138, 36], label: 'Japan', dx: -12, anchor: 'end', partner: true,
        title: 'Japan — Quad partner', text: 'Funds roads, ports and metro projects in India and the region, and joins the Malabar naval exercise.' },
      { at: [134, -24], label: 'Australia', dy: -14, anchor: 'middle', partner: true,
        title: 'Australia — Quad partner', text: 'Guards the southern approaches to the Indo-Pacific and supplies critical minerals. Rejoined Malabar in 2020, making it a four-navy exercise.' },
    ],
    edge: { at: [150, 22], text: 'USA →' },
  },
  indus: {
    width: 380,
    files: ['indus-countries', 'indus-rivers'],
    bounds: [[66.2, 23.2], [79.8, 36.8]],
    highlight: ['IND'],
    rivers: { west: ['Indus', 'Jhelum', 'Chenab'], east: ['Ravi', 'Beas', 'Sutlej', 'Satluj'] },
    regions: [
      { at: [69.3, 28.6], text: 'PAKISTAN', big: true },
      { at: [77.3, 27.0], text: 'INDIA', big: true },
      { at: [67.9, 34.0], text: 'AFGHANISTAN', small: true },
      { at: [66.5, 24.6], text: 'Arabian Sea', sea: true, start: true },
    ],
    labels: [
      { at: [78.1, 34.55], text: 'Indus', anchor: 'start' },
      { at: [73.0, 33.0], text: 'Jhelum', anchor: 'end' },
      { at: [74.0, 32.25], text: 'Chenab', anchor: 'end' },
      { at: [76.35, 32.5], text: 'Ravi', anchor: 'start' },
      { at: [77.2, 31.95], text: 'Beas', anchor: 'start' },
      { at: [78.2, 31.35], text: 'Sutlej', anchor: 'start' },
    ],
    points: [
      { at: [72.69, 34.09], label: 'Tarbela', dx: -12, anchor: 'end',
        title: 'Tarbela Dam, Pakistan', text: 'Pakistan\'s biggest dam, on the Indus. The western rivers — Indus, Jhelum and Chenab — carry about 80% of the system\'s water, and the treaty gives most of it to Pakistan.' },
      { at: [74.65, 34.4], off: [10, -26], label: 'Kishanganga', dx: 12,
        title: 'Kishanganga project, J&K', text: 'India\'s 330 MW hydropower plant on a tributary of the Jhelum, a western river. The treaty allows such "run-of-the-river" plants, which use the flow without storing it. Pakistan still objected, and the case went to international experts.' },
      { at: [75.79, 33.32], label: 'Ratle', dx: 12,
        title: 'Ratle project, Chenab', text: 'An 850 MW plant being built in Kishtwar on the Chenab, another western river. With the treaty on hold since April 2025, India has said it will speed up such projects.' },
      { at: [76.43, 31.41], label: 'Bhakra', dx: 12,
        title: 'Bhakra Dam, Sutlej', text: 'One of India\'s biggest dams, completed in 1963. The eastern rivers — Ravi, Beas and Sutlej — are India\'s to use fully, for irrigation and power in Punjab, Haryana and Rajasthan.' },
      { at: [67.6, 24.1], label: 'Indus mouth', dx: 12,
        title: 'Into the Arabian Sea', text: 'All six rivers join the Indus, which flows the length of Pakistan into the Arabian Sea. This is why the treaty matters so much to Pakistan\'s farms, cities and power.' },
    ],
    pins: [
      { at: [74.35, 31.55], text: 'Lahore', dx: -6, anchor: 'end', city: true },
      { at: [74.8, 34.08], text: 'Srinagar', dx: 6, dy: 10, city: true },
    ],
  },
};

const DEFAULT_W = 420;

export default function RealMap({ title, preset, note }) {
  const cfg = PRESETS[preset];
  const W = cfg?.width || DEFAULT_W;
  const holder = useRef(null);
  const [state, setState] = useState(null);   // { path, project, layers, H }
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const points = cfg?.points || [];

  useEffect(() => {
    const el = holder.current;
    if (!el || !cfg) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [{ geoMercator, geoPath }, ...files] = await Promise.all([
          import('d3-geo'),
          ...cfg.files.map(f => fetch(`/maps/${f}.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); })),
        ]);
        if (cancelled) return;
        const [[x0, y0], [x1, y1]] = cfg.bounds;
        const frame = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]]] } };
        // Height follows the region's shape so every map fills its width
        const probe = geoMercator().fitWidth(W, frame);
        const [[, top], [, bottom]] = geoPath(probe).bounds(frame);
        const H = Math.round(bottom - top);
        const projection = geoMercator().fitExtent([[0, 0], [W, H]], frame);
        setState({ path: geoPath(projection), project: projection, layers: files, H });
        requestAnimationFrame(() => setShown(true));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cfg) return null;
  const fade = (ms = 0) => ({ opacity: shown ? 1 : 0, transition: `opacity 500ms ease-out ${ms}ms` });

  return (
    <figure ref={holder} className="my-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 not-prose">
      {title && <figcaption className="text-[15px] sm:text-base font-bold text-gray-900 mb-4">{title}</figcaption>}
      <div className="rounded-xl overflow-hidden border border-gray-100 bg-[#eef4fb]" style={{ aspectRatio: state ? `${W} / ${state.H}` : '4 / 3' }}>
        {failed && <p className="p-6 text-sm text-gray-500">The map could not load. Check your connection and refresh.</p>}
        {!state && !failed && <p className="p-6 text-sm text-gray-400">Loading the map…</p>}
        {state && (() => {
          const { path, project, layers, H } = state;
          const [countries, rivers] = layers;
          const P = at => project(at);
          return (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label={`Map: ${title}`}>
              {countries.features.map((f, i) => {
                const a3 = f.properties.ADM0_A3;
                const fill = cfg.highlight.includes(a3) ? '#dbe6f3' : cfg.partners?.includes(a3) ? '#c3d3e8' : '#f8fafc';
                return <path key={i} d={path(f)} fill={fill} stroke={cfg.highlight.includes(a3) ? INK_SOFT : '#cbd5e1'} strokeWidth={cfg.highlight.includes(a3) ? 1.2 : 0.8} />;
              })}

              {rivers && rivers.features.map((f, i) => {
                const name = f.properties.name;
                const west = cfg.rivers.west.includes(name);
                return <path key={`r${i}`} d={path(f)} fill="none" stroke={west ? INK_SOFT : INK} strokeWidth={name === 'Indus' ? 3 : 2}
                  strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={shown ? 0 : 1}
                  style={{ transition: `stroke-dashoffset 1400ms ease-out ${i * 60}ms` }} />;
              })}

              {cfg.routes?.map((r, i) => (
                <path key={`sea${i}`} d={path({ type: 'LineString', coordinates: r })} fill="none" stroke={INK} strokeWidth="2"
                  strokeDasharray="5 4" style={fade(300 + i * 200)} />
              ))}

              {cfg.regions?.map(r => {
                const [x, y] = P(r.at);
                const size = r.big ? 12 : r.small ? 9.5 : 10.5;
                return (
                  <g key={r.text} style={fade(200)}>
                    <text x={x} y={y} textAnchor={r.start ? 'start' : r.end ? 'end' : 'middle'} fontSize={size} fontWeight={r.sea ? 400 : 700}
                      fontStyle={r.sea ? 'italic' : 'normal'} letterSpacing={r.sea || r.claim ? 0 : 1.2}
                      fill={r.sea ? '#7c93b8' : r.claim ? '#334155' : '#64748b'}>{r.text}</text>
                    {r.sub && <text x={x} y={y + 11} textAnchor={r.start ? 'start' : r.end ? 'end' : 'middle'} fontSize="9" fill="#64748b">({r.sub})</text>}
                  </g>
                );
              })}

              {cfg.sectors?.map((s, i) => {
                const [x, y] = P(s.at);
                return (
                  <g key={s.lines[0]} style={fade(900 + i * 150)}>
                    {s.lines.map((l, k) => (
                      <text key={l} x={x} y={y + k * 12} textAnchor={s.anchor || 'middle'} fontSize={k ? 9.5 : 10.5}
                        fontWeight={k ? 400 : 700} fill={k ? '#334155' : INK}
                        stroke="#eef4fb" strokeWidth="3" paintOrder="stroke">{l}</text>
                    ))}
                  </g>
                );
              })}

              {cfg.labels?.map(l => {
                const [x, y] = P(l.at);
                return <text key={l.text} x={x} y={y} textAnchor={l.anchor || 'middle'} fontSize="10.5" fontWeight="700" fill="#0f172a"
                  stroke="#ffffff" strokeWidth="3" paintOrder="stroke" style={fade(800)}>{l.text}</text>;
              })}

              {cfg.pins?.map((p, i) => {
                const [x, y] = P(p.at);
                return (
                  <g key={p.text} style={fade(600 + i * 110)}>
                    <circle cx={x} cy={y} r={p.city ? 3 : 4.5} fill={p.ring ? '#fff' : INK} stroke={INK} strokeWidth="2" />
                    <text x={x + (p.dx || 0)} y={y + (p.dy ?? 4)} textAnchor={p.anchor || 'start'} fontSize={p.city ? 9.5 : 10.5}
                      fontWeight={p.city ? 500 : 700} fill="#0f172a" stroke="#ffffff" strokeWidth="3" paintOrder="stroke">{p.text}</text>
                  </g>
                );
              })}

              {points.map((pt, i) => {
                const [tx, ty] = P(pt.at);
                const [x, y] = [tx + (pt.off?.[0] || 0), ty + (pt.off?.[1] || 0)];
                const on = i === active;
                return (
                  <g key={pt.label} role="button" tabIndex={0} aria-label={`${i + 1}. ${pt.title}`} aria-pressed={on}
                    onClick={() => setActive(i)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(i); } }}
                    className="cursor-pointer outline-none" style={fade(700 + i * 120)}>
                    {pt.off && <line x1={tx} y1={ty} x2={x} y2={y} stroke={INK} strokeWidth="1.2" />}
                    {pt.off && <circle cx={tx} cy={ty} r="2.5" fill={INK} />}
                    {on && (
                      <circle cx={x} cy={y} r="10" fill="none" stroke={INK} strokeWidth="2">
                        <animate attributeName="r" values="10;20;10" dur="1.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={x} cy={y} r="14" fill="transparent" />
                    <circle cx={x} cy={y} r={on ? 10 : 8} fill={on ? INK : pt.choke ? '#fff' : INK_SOFT} stroke={INK} strokeWidth="2" />
                    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={on ? 11 : 10} fontWeight="800" fill={on || !pt.choke ? '#fff' : INK}>{i + 1}</text>
                    <text x={x + (pt.dx || 0)} y={y + (pt.dy ?? 4)} textAnchor={pt.anchor || 'start'} fontSize="10.5" fontWeight={on ? 800 : 700}
                      fill={on ? INK : '#0f172a'} stroke="#ffffff" strokeWidth="3" paintOrder="stroke">{pt.label}</text>
                  </g>
                );
              })}

              {cfg.edge && (() => {
                const [x, y] = P(cfg.edge.at);
                return <text x={x} y={y} textAnchor="end" fontSize="10.5" fontWeight="700" fill={INK} style={fade(1100)}>{cfg.edge.text}</text>;
              })()}
            </svg>
          );
        })()}
      </div>
      {points.length > 0 && state && (
        <div className="mt-4">
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4" aria-live="polite">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-extrabold flex items-center justify-center shrink-0">{active + 1}</span>
              <div className="min-w-0">
                {points[active].tag && <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">{points[active].tag}</p>}
                <p className="text-[15px] font-bold text-gray-900 leading-snug">{points[active].title}</p>
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">{points[active].text}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button type="button" disabled={active === 0} onClick={() => setActive(a => a - 1)}
                className="text-sm font-semibold text-brand-700 disabled:text-gray-300 cursor-pointer disabled:cursor-default">← Previous</button>
              <span className="text-xs text-gray-500">{active + 1} of {points.length} · tap a number on the map</span>
              <button type="button" disabled={active === points.length - 1} onClick={() => setActive(a => a + 1)}
                className="text-sm font-semibold text-brand-700 disabled:text-gray-300 cursor-pointer disabled:cursor-default">Next →</button>
            </div>
          </div>
          <ol className="mt-3 grid sm:grid-cols-2 gap-1.5">
            {points.map((pt, i) => (
              <li key={pt.label}>
                <button type="button" onClick={() => setActive(i)}
                  className={`w-full flex items-center gap-2 text-left rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${i === active ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                  <span className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${i === active ? 'bg-white text-brand-700' : 'bg-brand-50 text-brand-700'}`}>{i + 1}</span>
                  <span className="truncate">{pt.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      {cfg.rivers && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
          <span className="inline-flex items-center gap-2"><span className="w-5 h-[3px] rounded" style={{ background: INK_SOFT }} /> Western rivers — mostly Pakistan's use</span>
          <span className="inline-flex items-center gap-2"><span className="w-5 h-[3px] rounded" style={{ background: INK }} /> Eastern rivers — India's full use</span>
        </div>
      )}
      {cfg.routes && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600">
          <span className="inline-flex items-center gap-2"><span className="w-5 border-t-2 border-dashed" style={{ borderColor: INK }} /> Main sea route: oil, gas and trade</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 bg-white" style={{ borderColor: INK }} /> Choke point</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: '#c3d3e8' }} /> Quad partners</span>
        </div>
      )}
      <p className="mt-3 text-xs text-gray-400 leading-relaxed">{[note, cfg.note, SOURCE].filter(Boolean).join(' ')}</p>
    </figure>
  );
}
