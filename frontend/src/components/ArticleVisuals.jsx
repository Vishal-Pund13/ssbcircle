import { useEffect, useRef, useState } from 'react';
import RealMap from './ArticleMaps';
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

// ── Maps: [VISUAL:map|Title|preset|note] — real maps, see ArticleMaps ─────
const MapVisual = ({ title, args }) => <RealMap title={title} preset={args[0]} note={args[1]} />;

const TYPES = { timeline: Timeline, stats: Stats, flow: Flow, bars: Bars, icons: IconCards, dots: Dots, hub: Hub, map: MapVisual };

export default function ArticleVisual({ type, title, args, rows }) {
  const V = TYPES[type];
  return V ? <V title={title} args={args} rows={rows} /> : null;
}
