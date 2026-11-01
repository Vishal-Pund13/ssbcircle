import { useEffect, useRef, useState } from 'react';
import {
  MapPin, Landmark, Wheat, Medal, Wrench, Users, Shield, Plane, Anchor, Globe, Smartphone, ShieldAlert,
  GraduationCap, HeartPulse, Factory, Briefcase, Scale, BookOpen, Vote, Rocket, Satellite, Cpu, Eye, Radar,
  Wifi, Brain, Bot, Leaf, Sun, Wind, Droplets, CloudRain, Thermometer, Mountain, Waves, Flame, Siren, HardHat,
  LifeBuoy, Building2, Clock, Target, Lightbulb, Handshake, Flag, Star, AlertTriangle, MessageCircle, Mic,
  Footprints, Dumbbell, Award, Heart, Lock, Search, Tractor, IndianRupee, TrendingUp, Ban, Megaphone, Newspaper,
  Moon, Ship, QrCode, Fingerprint, Crosshair, Route, Truck, ScrollText, Gavel, Home, Sprout, Zap, Network,
  Helicopter, ChevronRight,
} from 'lucide-react';

// Visual blocks for articles, so the key facts stay in memory as pictures:
// timelines, number tiles, step flows, bar charts, icon cards, a 100-dot grid
// and a hub diagram. Each is written in the article text as
//
//   [VISUAL:type|Title|extra…]
//   one row per line, fields split by |
//   [/VISUAL]
//
// and animates in once when scrolled into view (instantly for readers who
// ask for reduced motion). scripts/prerender.mjs turns the same rows into
// plain HTML tables for search engines.

const ICONS = {
  MapPin, Landmark, Wheat, Medal, Wrench, Users, Shield, Plane, Anchor, Globe, Smartphone, ShieldAlert,
  GraduationCap, HeartPulse, Factory, Briefcase, Scale, BookOpen, Vote, Rocket, Satellite, Cpu, Eye, Radar,
  Wifi, Brain, Bot, Leaf, Sun, Wind, Droplets, CloudRain, Thermometer, Mountain, Waves, Flame, Siren, HardHat,
  LifeBuoy, Building2, Clock, Target, Lightbulb, Handshake, Flag, Star, AlertTriangle, MessageCircle, Mic,
  Footprints, Dumbbell, Award, Heart, Lock, Search, Tractor, IndianRupee, TrendingUp, Ban, Megaphone, Newspaper,
  Moon, Ship, QrCode, Fingerprint, Crosshair, Route, Truck, ScrollText, Gavel, Home, Sprout, Zap, Network,
  Helicopter,
};

// Brand navy marks the point of the chart; the lighter blue is context.
// Checked for colour-blind separation and 3:1 contrast against white.
const INK = '#1e3a5f';
const INK_SOFT = '#6b86ad';
const INK_FAINT = '#cbd5e1';

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// True once the element has been scrolled into view
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (reduceMotion() || typeof IntersectionObserver === 'undefined') { setShown(true); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown];
}

// Fades and lifts a child in, a little after the one before it
const rise = (shown, i, step = 90) => ({
  className: 'transition-all duration-500 ease-out',
  style: {
    opacity: shown ? 1 : 0,
    transform: shown ? 'none' : 'translateY(10px)',
    transitionDelay: shown ? `${i * step}ms` : '0ms',
  },
});

function Frame({ title, note, children, frameRef }) {
  return (
    <figure ref={frameRef} className="my-8 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 not-prose">
      {title && <figcaption className="text-[15px] sm:text-base font-bold text-gray-900 mb-4">{title}</figcaption>}
      {children}
      {note && <p className="mt-4 text-xs text-gray-400 leading-relaxed">{note}</p>}
    </figure>
  );
}

// ── Timeline: when | title | note ───────────────────────────────────────────
function Timeline({ title, args, rows }) {
  const [ref, shown] = useReveal();
  return (
    <Frame title={title} note={args[0]} frameRef={ref}>
      <ol className="relative">
        <span aria-hidden="true" className="absolute left-[calc(5.775rem-1px)] sm:left-[calc(6.775rem-1px)] top-2 bottom-2 w-0.5 bg-brand-100 origin-top transition-transform duration-1000 ease-out"
          style={{ transform: shown ? 'scaleY(1)' : 'scaleY(0)' }} />
        {rows.map(([when, head, text], i) => (
          <li key={i} {...rise(shown, i, 110)} className={`${rise(shown, i).className} relative flex gap-4 pb-5 last:pb-0`}>
            <span className="w-[4.4rem] sm:w-[5.4rem] shrink-0 text-right text-sm font-bold text-brand-700 tabular-nums pt-0.5">{when}</span>
            <span aria-hidden="true" className="relative z-10 mt-1.5 w-3 h-3 rounded-full bg-brand-600 ring-4 ring-white shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm sm:text-[15px] font-semibold text-gray-900 leading-snug">{head}</span>
              {text && <span className="block text-sm text-gray-500 leading-relaxed mt-0.5">{text}</span>}
            </span>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

// ── Number tiles: value | label — the number counts up ──────────────────────
function CountUp({ value, shown }) {
  const m = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  // A year is a label, not a quantity: "1962" should not count up from 0
  const animate = m && !/^[–-]\s*\d/.test(m[3]) && !/^(19|20)\d\d$/.test(value.trim());
  const target = animate ? parseFloat(m[2].replace(/,/g, '')) : 0;
  const decimals = animate ? (m[2].split('.')[1] || '').length : 0;
  const grouped = animate && m[2].includes(',');
  const [n, setN] = useState(animate && !reduceMotion() ? 0 : target);
  useEffect(() => {
    if (!animate || !shown || reduceMotion()) { setN(target); return; }
    let raf, start;
    const tick = t => {
      start ??= t;
      const p = Math.min(1, (t - start) / 900);
      setN(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!animate) return value;
  const num = grouped ? n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : n.toFixed(decimals);
  return <>{m[1]}{num}{m[3]}</>;
}

function Stats({ title, args, rows }) {
  const [ref, shown] = useReveal();
  return (
    <Frame title={title} note={args[0]} frameRef={ref}>
      <div className={`grid grid-cols-2 ${rows.length >= 4 ? 'lg:grid-cols-4' : `sm:grid-cols-${rows.length}`} gap-3`}>
        {rows.map(([value, label], i) => (
          <div key={i} {...rise(shown, i)} className={`${rise(shown, i).className} rounded-xl bg-brand-50 border border-brand-100 px-4 py-4`}>
            <p className="text-2xl sm:text-3xl font-extrabold text-brand-700 tracking-tight tabular-nums leading-none">
              <CountUp value={value} shown={shown} />
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ── Flow: step | text — numbered steps with arrows ──────────────────────────
function Flow({ title, args, rows }) {
  const [ref, shown] = useReveal();
  return (
    <Frame title={title} note={args[0]} frameRef={ref}>
      <ol className="flex flex-col sm:flex-row gap-2 sm:gap-1 sm:items-stretch">
        {rows.map(([head, text], i) => (
          <li key={i} className="contents">
            <div {...rise(shown, i, 140)} className={`${rise(shown, i).className} flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4`}>
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <p className="mt-2 text-sm sm:text-[15px] font-bold text-gray-900 leading-snug">{head}</p>
              {text && <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>}
            </div>
            {i < rows.length - 1 && (
              <span aria-hidden="true" {...rise(shown, i + 0.5, 140)}
                className={`${rise(shown, i).className} self-center text-brand-300 rotate-90 sm:rotate-0`}>
                <ChevronRight className="w-5 h-5" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

// ── Bars: label | value | * (highlight) — horizontal, growing from zero ─────
function Bars({ title, args, rows }) {
  const [ref, shown] = useReveal();
  const [unit, note] = args;
  const values = rows.map(r => parseFloat(r[1]));
  const max = Math.max(...values);
  return (
    <Frame title={title} note={note} frameRef={ref}>
      {unit && <p className="-mt-3 mb-4 text-xs text-gray-500">{unit}</p>}
      <ul className="space-y-3" role="list">
        {rows.map(([label, value, mark], i) => {
          const pct = (parseFloat(value) / max) * 100;
          return (
            <li key={i} className="grid grid-cols-[minmax(0,7.5rem)_1fr] sm:grid-cols-[minmax(0,10rem)_1fr] items-center gap-3"
              title={`${label}: ${value}${unit ? ` (${unit})` : ''}`}>
              <span className={`text-xs sm:text-sm leading-tight ${mark ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-5 rounded-r-[4px] transition-[width] duration-1000 ease-out hover:opacity-80"
                  style={{ width: shown ? `max(${pct}%, 4px)` : '0%', maxWidth: 'calc(100% - 4rem)', background: mark ? INK : INK_SOFT, transitionDelay: `${i * 80}ms` }} />
                <span className={`text-xs sm:text-sm tabular-nums whitespace-nowrap ${mark ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{value}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

// ── Icon cards: Icon | title | text ─────────────────────────────────────────
function IconCards({ title, args, rows }) {
  const [ref, shown] = useReveal();
  return (
    <Frame title={title} note={args[0]} frameRef={ref}>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${rows.length % 3 === 0 ? 'lg:grid-cols-3' : ''} gap-3`}>
        {rows.map(([icon, head, text], i) => {
          const Icon = ICONS[icon] || Lightbulb;
          return (
            <div key={i} {...rise(shown, i, 80)} className={`${rise(shown, i).className} flex gap-3 rounded-xl border border-gray-200 p-3.5`}>
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-gray-900 leading-snug">{head}</span>
                {text && <span className="block text-[13px] sm:text-sm text-gray-600 leading-relaxed mt-0.5">{text}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

// ── 100 dots: count | label — "out of every 100" ────────────────────────────
function Dots({ title, args, rows }) {
  const [ref, shown] = useReveal();
  const colours = [INK, INK_SOFT, INK_FAINT];
  const cells = rows.flatMap(([count], g) => Array(parseInt(count)).fill(g));
  return (
    <Frame title={title} note={args[0]} frameRef={ref}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="grid grid-cols-10 gap-1.5 w-full max-w-[240px] shrink-0" role="img"
          aria-label={rows.map(([c, l]) => `${c} out of 100: ${l}`).join('; ')}>
          {cells.map((g, i) => (
            <span key={i} className="aspect-square rounded-full transition-all duration-300"
              style={{ background: colours[g], opacity: shown ? 1 : 0, transform: shown ? 'scale(1)' : 'scale(0.4)', transitionDelay: `${i * 9}ms` }} />
          ))}
        </div>
        <ul className="space-y-2.5">
          {rows.map(([count, label], g) => (
            <li key={g} className="flex items-start gap-2.5">
              <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ background: colours[g] }} />
              <span className="text-sm text-gray-700 leading-snug"><span className="text-lg font-extrabold text-gray-900 tabular-nums mr-1">{count}</span> {label}</span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

// ── Hub: centre in the title args; rows are name | note around it ───────────
function Hub({ title, args, rows }) {
  const [ref, shown] = useReveal();
  const [centre, note] = args;
  const W = 340, H = 250, cx = W / 2, cy = H / 2, R = 92;
  const nodes = rows.map(([name], i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / rows.length;
    return { name, x: cx + R * 1.28 * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  return (
    <Frame title={title} note={note} frameRef={ref}>
      <div className="grid sm:grid-cols-[340px_1fr] gap-5 items-center">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[340px] mx-auto" role="img"
          aria-label={`${centre} linked with ${rows.map(r => r[0]).join(', ')}`}>
          {nodes.map((n, i) => (
            <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={INK_SOFT} strokeWidth="1.5"
              strokeDasharray="200" strokeDashoffset={shown ? 0 : 200}
              style={{ transition: `stroke-dashoffset 700ms ease-out ${i * 90}ms` }} />
          ))}
          <circle cx={cx} cy={cy} r="34" fill={INK} />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{centre}</text>
          {nodes.map((n, i) => (
            <g key={i} style={{ opacity: shown ? 1 : 0, transition: `opacity 400ms ease-out ${300 + i * 90}ms` }}>
              <rect x={n.x - 46} y={n.y - 14} width="92" height="28" rx="14" fill="#fff" stroke={INK_SOFT} strokeWidth="1.5" />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1f2937">{n.name}</text>
            </g>
          ))}
        </svg>
        <ul className="space-y-2">
          {rows.map(([name, text], i) => (
            <li key={i} {...rise(shown, i, 80)} className={`${rise(shown, i).className} text-sm leading-snug`}>
              <span className="font-bold text-gray-900">{name}:</span> <span className="text-gray-600">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

// ── Schematic maps: [VISUAL:map|Title|preset] ───────────────────────────────
// Places, routes and relationships only — never border outlines. Publishing a
// map of India whose boundaries differ from the Survey of India's is an
// offence, and free map data draws them the way other countries claim them.
// So these are diagrams in a map's arrangement, and say so on the figure.

const SCHEMATIC_NOTE = 'Schematic diagram, not to scale. Not an official map of India.';

function Pin({ x, y, label, dy = -10, anchor = 'middle', shown, i, ring = false }) {
  return (
    <g style={{ opacity: shown ? 1 : 0, transition: `opacity 400ms ease-out ${600 + i * 120}ms` }}>
      <circle cx={x} cy={y} r="4.5" fill={ring ? '#fff' : INK} stroke={INK} strokeWidth="2" />
      <text x={x} y={y + dy} textAnchor={anchor} fontSize="11" fontWeight="600" fill="#1f2937">{label}</text>
    </g>
  );
}

function LacMap({ shown }) {
  // Sector widths follow the official lengths: 1,597 + 545 + 1,346 = 3,488 km
  const x0 = 20, W = 380;
  const xm = x0 + W * (1597 / 3488), xe = xm + W * (545 / 3488), x1 = x0 + W;
  const line = `M${x0},128 C70,112 120,146 170,126 S${xm + 20},${118} ${xm + 40},128 S${xe + 30},140 ${xe + 60},126 S350,112 ${x1},130`;
  return (
    <svg viewBox="0 0 420 250" className="w-full" role="img"
      aria-label="Schematic of the Line of Actual Control: Western sector in Ladakh, 1,597 km; Middle sector in Himachal Pradesh and Uttarakhand, 545 km; Eastern sector in Sikkim and Arunachal Pradesh, 1,346 km.">
      <text x="210" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6b7280" letterSpacing="2">CHINA (TIBET)</text>
      <text x="210" y="238" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6b7280" letterSpacing="2">INDIA</text>
      <text x="95" y="48" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#4b5563">Aksai Chin</text>
      <text x="95" y="62" textAnchor="middle" fontSize="10" fill="#6b7280">held by China, claimed by India</text>
      <text x="335" y="48" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#4b5563">Arunachal Pradesh</text>
      <text x="335" y="62" textAnchor="middle" fontSize="10" fill="#6b7280">China claims ~90,000 sq km</text>
      <path d={line} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" pathLength="1"
        strokeDasharray="1" strokeDashoffset={shown ? 0 : 1} style={{ transition: 'stroke-dashoffset 1400ms ease-out' }} />
      {[xm, xe].map(x => <line key={x} x1={x} y1="104" x2={x} y2="152" stroke={INK_SOFT} strokeWidth="1.5" strokeDasharray="3 3" />)}
      <Pin x={38} y={124} label="Depsang" shown={shown} i={0} />
      <Pin x={78} y={121} label="Galwan" dy={22} shown={shown} i={1} />
      <Pin x={120} y={135} label="Pangong Tso" shown={shown} i={2} />
      <Pin x={165} y={127} label="Demchok" dy={22} shown={shown} i={3} />
      <Pin x={xe + 14} y={135} label="Doklam (Bhutan)" dy={22} anchor="start" shown={shown} i={4} ring />
      <Pin x={330} y={118} label="Tawang" shown={shown} i={5} />
      {[[(x0 + xm) / 2, 'Western · Ladakh', '1,597 km'], [(xm + xe) / 2, 'Middle', '545 km'], [(xe + x1) / 2, 'Eastern · Sikkim, Arunachal', '1,346 km']]
        .map(([x, a, b], i) => (
          <g key={a} style={{ opacity: shown ? 1 : 0, transition: `opacity 400ms ease-out ${1200 + i * 150}ms` }}>
            <text x={x} y="184" textAnchor="middle" fontSize="11" fontWeight="700" fill={INK}>{a}</text>
            <text x={x} y="199" textAnchor="middle" fontSize="11" fill="#4b5563">{b}</text>
          </g>
        ))}
      <text x={(xm + xe) / 2} y="213" textAnchor="middle" fontSize="10" fill="#6b7280">HP, Uttarakhand</text>
    </svg>
  );
}

function IndoPacificMap({ shown }) {
  const lane = 'M70,92 C110,120 130,150 160,150 S230,160 258,150 S300,118 320,104 S370,70 392,62';
  const quad = [[160, 118, 'India', 0], [392, 62, 'Japan', 22], [330, 214, 'Australia', 22]];
  const choke = [[70, 92, 'Strait of Hormuz', -10], [36, 140, 'Bab-el-Mandeb', 22], [258, 150, 'Malacca Strait', 22]];
  return (
    <svg viewBox="0 0 440 260" className="w-full" role="img"
      aria-label="Schematic of the Indo-Pacific: the sea route from the Gulf past India through the Malacca Strait to Japan, with the choke points Hormuz, Bab-el-Mandeb and Malacca, and the Quad countries India, Japan, Australia and the USA.">
      <rect x="0" y="0" width="440" height="260" rx="12" fill="#f1f5f9" />
      <text x="140" y="228" textAnchor="middle" fontSize="13" fontStyle="italic" fill="#94a3b8">Indian Ocean</text>
      <text x="380" y="150" textAnchor="middle" fontSize="13" fontStyle="italic" fill="#94a3b8">Pacific Ocean</text>
      <text x="290" y="88" textAnchor="middle" fontSize="10.5" fill="#94a3b8">South China Sea</text>
      <path d={lane} fill="none" stroke={INK_SOFT} strokeWidth="2.5" strokeDasharray="6 5"
        style={{ opacity: shown ? 1 : 0, transition: 'opacity 900ms ease-out' }} />
      <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 500ms ease-out 1300ms' }}>
        <text x="185" y="196" textAnchor="middle" fontSize="10.5" fill="#475569">- - - Main sea route: oil, gas and trade</text>
      </g>
      {choke.map(([x, y, l, dy], i) => <Pin key={l} x={x} y={y} label={l} dy={dy} anchor={x < 60 ? 'start' : 'middle'} shown={shown} i={i} ring />)}
      {quad.map(([x, y, l, dy], i) => <Pin key={l} x={x} y={y} label={l} dy={dy || -10} shown={shown} i={i + 3} />)}
      <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 400ms ease-out 1100ms' }}>
        <circle cx="428" cy="120" r="4.5" fill={INK} />
        <text x="420" y="108" textAnchor="end" fontSize="11" fontWeight="600" fill="#1f2937">USA →</text>
      </g>
    </svg>
  );
}

function IndusMap({ shown }) {
  const west = [['Indus', 60], ['Jhelum', 105], ['Chenab', 150]];
  const east = [['Ravi', 215], ['Beas', 260], ['Sutlej', 305]];
  const river = x => `M${x},40 C${x},120 ${x - (x - 60) * 0.4},170 ${60 + (x - 60) * 0.25},215 L60,232`;
  return (
    <svg viewBox="0 0 360 270" className="w-full max-w-[420px] mx-auto" role="img"
      aria-label="Schematic of the Indus river system: the western rivers Indus, Jhelum and Chenab are mostly for Pakistan's use; the eastern rivers Ravi, Beas and Sutlej are for India's full use. All join the Indus, which flows to the Arabian Sea.">
      <text x="180" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6b7280" letterSpacing="2">HIMALAYAS</text>
      {[...west, ...east].map(([name, x], i) => (
        <g key={name}>
          <path d={river(x)} fill="none" stroke={i < 3 ? INK_SOFT : INK} strokeWidth={name === 'Indus' ? 4 : 2.5} strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset={shown ? 0 : 1} style={{ transition: `stroke-dashoffset 1200ms ease-out ${i * 120}ms` }} />
          <text x={x} y="34" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#1f2937"
            style={{ opacity: shown ? 1 : 0, transition: `opacity 300ms ease-out ${i * 120}ms` }}>{name}</text>
        </g>
      ))}
      <g style={{ opacity: shown ? 1 : 0, transition: 'opacity 500ms ease-out 1200ms' }}>
        {/* Legend in the empty corner, so no label sits on a river */}
        <line x1="222" y1="186" x2="244" y2="186" stroke={INK_SOFT} strokeWidth="3" strokeLinecap="round" />
        <text x="250" y="190" fontSize="10.5" fontWeight="700" fill="#1f2937">Western rivers</text>
        <text x="250" y="204" fontSize="10" fill="#4b5563">Mostly Pakistan's use</text>
        <line x1="222" y1="222" x2="244" y2="222" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <text x="250" y="226" fontSize="10.5" fontWeight="700" fill="#1f2937">Eastern rivers</text>
        <text x="250" y="240" fontSize="10" fill="#4b5563">India's full use</text>
        <text x="70" y="256" fontSize="11" fontWeight="600" fill="#1f2937">→ Indus flows to the Arabian Sea</text>
      </g>
    </svg>
  );
}

const MAPS = { lac: LacMap, 'indo-pacific': IndoPacificMap, indus: IndusMap };

function SchematicMap({ title, args }) {
  const [ref, shown] = useReveal();
  const [preset, note] = args;
  const M = MAPS[preset];
  if (!M) return null;
  return (
    <Frame title={title} note={[note, SCHEMATIC_NOTE].filter(Boolean).join(' ')} frameRef={ref}>
      <M shown={shown} />
    </Frame>
  );
}

const TYPES = { timeline: Timeline, stats: Stats, flow: Flow, bars: Bars, icons: IconCards, dots: Dots, hub: Hub, map: SchematicMap };

export default function ArticleVisual({ type, title, args, rows }) {
  const V = TYPES[type];
  return V ? <V title={title} args={args} rows={rows} /> : null;
}
