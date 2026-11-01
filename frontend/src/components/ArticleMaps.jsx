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
      { at: [81.0, 35.15], text: 'Aksai Chin', sub: 'held by China', claim: true },
      { at: [97.3, 28.45], text: 'Arunachal Pradesh', sub: 'claimed by China', claim: true, end: true },
    ],
    pins: [
      { at: [78.05, 35.35], text: 'Depsang', dx: -6, anchor: 'end' },
      { at: [78.2, 34.75], text: 'Galwan', dx: -6, anchor: 'end' },
      { at: [78.7, 33.75], text: 'Pangong Tso', dx: 7 },
      { at: [79.45, 32.7], text: 'Demchok', dx: 7 },
      { at: [89.0, 27.3], text: 'Doklam (Bhutan)', dx: -7, anchor: 'end', ring: true },
      { at: [91.86, 27.59], text: 'Tawang', dy: 15, anchor: 'middle' },
      { at: [77.21, 28.61], text: 'New Delhi', dx: 7, city: true },
    ],
    sectors: [
      { at: [72.8, 36.9], lines: ['Western sector', 'Ladakh · 1,597 km'], anchor: 'start' },
      { at: [80.6, 31.25], lines: ['Middle sector', 'HP, Uttarakhand · 545 km'], anchor: 'start' },
      { at: [97.2, 30.7], lines: ['Eastern sector', 'Sikkim, Arunachal · 1,346 km'], anchor: 'end' },
    ],
  },
  'indo-pacific': {
    files: ['indo-pacific'],
    bounds: [[36, -32], [151, 43]],
    highlight: ['IND'],
    partners: ['JPN', 'AUS'],
    regions: [
      { at: [79, 21], text: 'INDIA', big: true },
      { at: [138, 37.5], text: 'JAPAN' },
      { at: [133, -24], text: 'AUSTRALIA', big: true },
      { at: [104, 33], text: 'CHINA' },
      { at: [82, -16], text: 'Indian Ocean', sea: true },
      { at: [138, 9], text: 'Pacific Ocean', sea: true },
      { at: [114, 12.5], text: 'South China Sea', sea: true, small: true },
    ],
    routes: [
      [[56.4, 26.3], [60, 23], [66, 17], [74, 9], [80.6, 5.5], [88, 5.8], [95, 6.2], [100.2, 3.6], [103.8, 1.2], [109, 6], [113, 11], [118, 19], [124, 24], [131, 30], [137, 33.6], [139.8, 34.8]],
      [[43.4, 12.6], [50, 12.5], [58, 11], [66, 9.5], [74, 9]],
    ],
    pins: [
      { at: [56.3, 26.6], text: 'Strait of Hormuz', dy: -9, anchor: 'middle', ring: true },
      { at: [43.33, 12.58], text: 'Bab-el-Mandeb', dx: -2, dy: 17, anchor: 'start', ring: true },
      { at: [100.6, 3.0], text: 'Malacca Strait', dx: -8, dy: 12, anchor: 'end', ring: true },
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
      { at: [76.5, 35.25], text: 'Indus' },
      { at: [74.6, 34.45], text: 'Jhelum' },
      { at: [75.9, 33.35], text: 'Chenab' },
      { at: [76.35, 32.5], text: 'Ravi', anchor: 'start' },
      { at: [77.2, 31.95], text: 'Beas', anchor: 'start' },
      { at: [78.2, 31.35], text: 'Sutlej', anchor: 'start' },
    ],
    pins: [
      { at: [74.35, 31.55], text: 'Lahore', dx: -6, anchor: 'end', city: true },
      { at: [74.8, 34.08], text: 'Srinagar', dx: -6, anchor: 'end', city: true },
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

              {cfg.edge && (() => {
                const [x, y] = P(cfg.edge.at);
                return <text x={x} y={y} textAnchor="end" fontSize="10.5" fontWeight="700" fill={INK} style={fade(1100)}>{cfg.edge.text}</text>;
              })()}
            </svg>
          );
        })()}
      </div>
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
