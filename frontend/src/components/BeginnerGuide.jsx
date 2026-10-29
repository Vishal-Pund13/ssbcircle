import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield, Anchor, Plane, ArrowRight, Check, X, ChevronRight, ChevronDown, Heart, Compass, Search,
  DoorOpen, ClipboardList, Medal, Footprints, HelpCircle, Info, GraduationCap, School, Lightbulb,
  Waves, Flag, Mountain, Cpu, Stethoscope, Scale,
} from 'lucide-react';
import SiteNav from './SiteNav';
import {
  QUALITIES, MYTHS, INTERESTS, SERVICES, ENTRIES, SSB_DAYS, AFTER_SSB, START_STEPS, FAQ,
} from '../data/beginnerGuide';
import { trackEvent } from '../analytics';

// "How to become an officer in the Indian Armed Forces" — /become-an-officer.
//
// For someone who only has the dream so far. One page the reader moves around
// freely: tiles at the top and a sticky section bar jump anywhere, nothing is
// locked behind a previous step. The centre of the page is the role finder —
// pick what excites you and matching roles from all three services light up.
//
// Also our landing page for "how to become an officer" searches, so headings
// use the words people search with; the crawlable copy and FAQ structured data
// are built from the same data by scripts/prerender.mjs.

const SERVICE_ICON = { army: Shield, navy: Anchor, airforce: Plane };
const THEME = {
  army:     { solid: 'bg-emerald-700', soft: 'bg-emerald-50', text: 'text-emerald-800', bar: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  navy:     { solid: 'bg-blue-800',    soft: 'bg-blue-50',    text: 'text-blue-800',    bar: 'bg-blue-700',    chip: 'bg-blue-50 text-blue-800 border-blue-100' },
  airforce: { solid: 'bg-sky-600',     soft: 'bg-sky-50',     text: 'text-sky-800',     bar: 'bg-sky-500',     chip: 'bg-sky-50 text-sky-800 border-sky-100' },
};
const INTEREST_ICON = { Plane, Waves, Flag, Mountain, Cpu, Stethoscope, ClipboardList, GraduationCap, Scale };

const SECTIONS = [
  { id: 'services',    chip: 'Services',    title: 'Army, Navy or Air Force?', one: 'What each one does',            icon: Compass },
  { id: 'roles',       chip: 'Find a role', title: 'Find a role for you',      one: 'Pilot, infantry, engineer…',     icon: Search },
  { id: 'how-to-join', chip: 'How to join', title: 'How to join',              one: 'After 12th or graduation',       icon: DoorOpen },
  { id: 'can-i',       chip: 'Can I?',      title: 'Can I do this?',           one: 'What the board looks for',      icon: Heart },
  { id: 'ssb',         chip: 'SSB',         title: 'The SSB interview',        one: 'Five days, stage by stage',      icon: ClipboardList },
  { id: 'after-ssb',   chip: 'After SSB',   title: 'Medical to uniform',       one: 'Merit list, joining, training',  icon: Medal },
  { id: 'first-steps', chip: 'First steps', title: 'Your first steps',         one: 'What to do from today',          icon: Footprints },
  { id: 'faq',         chip: 'FAQ',         title: 'Questions',                one: 'Age, girls, coaching, rank',     icon: HelpCircle },
];

// Every role, flattened once, with its service and group attached
const ALL_ROLES = SERVICES.flatMap(s => s.groups.flatMap(g => g.roles.map(r => ({ ...r, service: s, group: g.title }))));

// Army, Navy, Air Force, Army, … — so the first screen of roles shows all three
// services instead of eight Army arms in a row
const MIXED_ROLES = (() => {
  const lists = SERVICES.map(s => ALL_ROLES.filter(r => r.service.id === s.id));
  const out = [];
  for (let i = 0; out.length < ALL_ROLES.length; i++) lists.forEach(l => { if (l[i]) out.push(l[i]); });
  return out;
})();
const FIRST_SHOWN = 8;

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } }

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try { history.replaceState(null, '', `#${id}`); } catch { /* ignore */ }
}

function SectionHead({ id, kicker, title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">{kicker}</p>
      <h2 id={`${id}-title`} className="mt-1.5 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{title}</h2>
      {children && <p className="mt-2 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">{children}</p>}
    </div>
  );
}

function Section({ id, className = 'bg-white', children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-32 border-t border-gray-100 px-4 sm:px-6 py-10 sm:py-14 ${className}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}

// ── Role detail sheet ───────────────────────────────────────────────────────

function RoleSheet({ role, onClose }) {
  const closeRef = useRef(null);
  const t = THEME[role.service.theme];
  const Icon = SERVICE_ICON[role.service.id];
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const rows = [
    ['What you would do', role.what],
    ['A day looks like', role.day],
    ['Good fit if', role.fit],
    ['How to join', role.join],
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="role-title" onMouseDown={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className={`${t.solid} text-white px-6 pt-5 pb-6 rounded-t-3xl`}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-white/85 flex items-center gap-1.5"><Icon className="w-4 h-4" /> {role.service.name} · {role.group}</p>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
              className={`-mr-2 -mt-1 w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/15 cursor-pointer shrink-0 ${focusRing}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <h3 id="role-title" className="text-2xl font-bold leading-tight">{role.name}</h3>
          <p className="mt-1 text-base text-white/90">{role.one}</p>
        </div>
        <dl className="px-6 py-5 space-y-5">
          {rows.map(([label, text]) => (
            <div key={label}>
              <dt className={`text-sm font-bold ${t.text}`}>{label}</dt>
              <dd className="mt-1 text-base text-gray-800 leading-relaxed">{text}</dd>
            </div>
          ))}
        </dl>
        <div className="px-6 pb-6">
          <Link to="/exams?tab=eligible" onClick={() => trackEvent('start_cta', { which: 'eligibility_role' })}
            className={`flex items-center justify-center gap-2 btn-primary text-base py-3 w-full ${focusRing}`}>
            Which entries are open to me? <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Services at a glance ────────────────────────────────────────────────────

function Services({ onSeeRoles }) {
  return (
    <div className="m-rail sm:grid-cols-3">
      {SERVICES.map(s => {
        const Icon = SERVICE_ICON[s.id];
        const t = THEME[s.theme];
        const count = ALL_ROLES.filter(r => r.service.id === s.id).length;
        return (
          <article key={s.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden flex flex-col">
            <div className={`${t.solid} text-white px-5 pt-5 pb-6 relative overflow-hidden`}>
              <Icon className="absolute -right-4 -bottom-5 w-28 h-28 opacity-15" aria-hidden="true" />
              <Icon className="w-8 h-8" aria-hidden="true" />
              <h3 className="mt-3 text-xl font-bold">{s.name}</h3>
              <p className="mt-1 text-base text-white/90 leading-snug">{s.oneLine}</p>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <p className="text-base text-gray-700 leading-relaxed">{s.intro}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2"><dt className="text-gray-500 w-20 shrink-0">Start as</dt><dd className="font-semibold text-gray-900">{s.rank}</dd></div>
                <div className="flex gap-2"><dt className="text-gray-500 w-20 shrink-0">Train at</dt><dd className="font-semibold text-gray-900">{s.academy}</dd></div>
              </dl>
              <button type="button" onClick={() => onSeeRoles(s.id)}
                className={`mt-5 inline-flex items-center justify-center gap-2 min-h-[48px] rounded-xl border-2 font-semibold text-base cursor-pointer ${t.text} border-current hover:bg-gray-50 ${focusRing}`}>
                See all {count} roles <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ── Role finder ─────────────────────────────────────────────────────────────

function RoleFinder({ service, setService }) {
  const [picked, setPicked] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [role, setRole] = useState(null);

  function toggle(id) {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setShowAll(false);
    trackEvent('start_interest', { interest: id });
  }

  const matches = MIXED_ROLES
    .filter(r => service === 'all' || r.service.id === service)
    .filter(r => !picked.length || r.tags.some(t => picked.includes(t)))
    // Roles matching more of what was picked come first
    .map(r => ({ r, score: r.tags.filter(t => picked.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.r);
  const shown = showAll ? matches : matches.slice(0, FIRST_SHOWN);

  return (
    <div>
      <p className="text-base font-bold text-gray-900">What excites you? <span className="font-normal text-gray-500">Tap one or more.</span></p>
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {INTERESTS.map(i => {
          const Icon = INTEREST_ICON[i.icon];
          const on = picked.includes(i.id);
          return (
            <button key={i.id} type="button" onClick={() => toggle(i.id)} aria-pressed={on}
              className={`relative flex flex-col items-center justify-center gap-1.5 px-1.5 py-3 min-h-[84px] rounded-2xl border-2 text-center text-[13px] sm:text-sm font-semibold leading-tight cursor-pointer transition ${focusRing} ${
                on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'}`}>
              {on && <Check className="absolute top-1.5 right-1.5 w-3.5 h-3.5" strokeWidth={3} />}
              <Icon className={`w-6 h-6 ${on ? 'text-white' : 'text-brand-600'}`} />
              {i.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Service" className="grid grid-cols-4 gap-1 bg-gray-100 p-1 rounded-xl sm:w-auto">
          {[{ id: 'all', short: 'All' }, ...SERVICES].map(s => {
            const on = service === s.id;
            return (
              <button key={s.id} role="radio" aria-checked={on} type="button" onClick={() => { setService(s.id); setShowAll(false); }}
                className={`px-3 min-h-[40px] rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap ${focusRing} ${on ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}>
                {s.short}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-600" aria-live="polite">
          <span className="font-bold text-gray-900">{matches.length}</span> role{matches.length === 1 ? '' : 's'}
          {picked.length ? ' match' : ''}
          {picked.length > 0 && (
            <button type="button" onClick={() => setPicked([])} className={`ml-2 font-semibold text-brand-700 underline cursor-pointer ${focusRing}`}>Clear</button>
          )}
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="mt-5 p-5 rounded-2xl bg-gray-50 text-base text-gray-700">
          No roles in this service match. Try <button type="button" onClick={() => setService('all')} className="font-semibold text-brand-700 underline cursor-pointer">all services</button>.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shown.map(r => {
            const t = THEME[r.service.theme];
            const Icon = SERVICE_ICON[r.service.id];
            return (
              <li key={r.service.id + r.name}>
                <button type="button" onClick={() => { setRole(r); trackEvent('start_role', { role: r.name }); }}
                  className={`w-full h-full flex items-stretch text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm cursor-pointer transition ${focusRing}`}>
                  <span className={`w-1.5 shrink-0 ${t.bar}`} aria-hidden="true" />
                  <span className="flex-1 min-w-0 px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${t.chip}`}>
                      <Icon className="w-3 h-3" /> {r.service.short}
                    </span>
                    <span className="block mt-1.5 text-base font-bold text-gray-900 leading-snug">{r.name}</span>
                    <span className="block text-sm text-gray-600 mt-0.5 leading-snug">{r.one}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-300 self-center mr-3 shrink-0" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {!showAll && matches.length > FIRST_SHOWN && (
        <button type="button" onClick={() => setShowAll(true)}
          className={`mt-4 w-full sm:w-auto btn-secondary text-base px-6 py-3 ${focusRing}`}>
          Show all {matches.length} roles
        </button>
      )}

      {service !== 'all' && (
        <p className="mt-5 flex gap-3 text-base text-gray-700 bg-gray-50 border border-gray-200 rounded-2xl p-4 leading-relaxed">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <span><span className="font-semibold">Good to know: </span>{SERVICES.find(s => s.id === service).note}</span>
        </p>
      )}

      {role && <RoleSheet role={role} onClose={() => setRole(null)} />}
    </div>
  );
}

// ── Other sections ──────────────────────────────────────────────────────────

function HowToJoin() {
  const cols = [
    { id: 'school', icon: School, title: 'After Class 12', sub: 'Or while in Class 12', list: ENTRIES.school },
    { id: 'graduate', icon: GraduationCap, title: 'After graduation', sub: 'Or in the final year', list: ENTRIES.graduate },
  ];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cols.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center"><c.icon className="w-5 h-5" /></span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
                <p className="text-sm text-gray-500">{c.sub}</p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-gray-100">
              {c.list.map(e => (
                <li key={e.name} className="py-3.5">
                  <p className="text-base font-bold text-gray-900">{e.name}</p>
                  <p className="text-sm font-semibold text-brand-700">{e.who}</p>
                  <p className="text-base text-gray-700 mt-1 leading-relaxed">{e.note}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link to="/exams?tab=eligible" onClick={() => trackEvent('start_cta', { which: 'eligibility' })}
        className={`mt-5 flex items-center justify-between gap-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-5 py-4 min-h-[64px] ${focusRing}`}>
        <span className="text-base font-semibold">Enter your date of birth and see exactly which entries you can apply for</span>
        <ArrowRight className="w-5 h-5 shrink-0" />
      </Link>
    </>
  );
}

function CanI() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
        <h3 className="text-lg font-bold text-gray-900">What the board looks for</h3>
        <p className="text-base text-gray-700 mt-1">Qualities you can grow, not marks or money.</p>
        <ul className="mt-4 space-y-2.5">
          {QUALITIES.map(q => (
            <li key={q} className="flex items-center gap-2.5 text-base text-gray-800"><Check className="w-5 h-5 text-amber-600 shrink-0" />{q}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">Common worries</h3>
        <div className="space-y-2.5">
          {MYTHS.map(m => (
            <details key={m.myth} className="group bg-white border border-gray-200 rounded-2xl">
              <summary className="list-none flex items-center justify-between gap-3 px-5 min-h-[56px] cursor-pointer">
                <span className="text-base font-semibold text-gray-900">"{m.myth}"</span>
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-4 text-base text-gray-700 leading-relaxed flex gap-2.5"><Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />{m.truth}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function SsbStages() {
  return (
    <ol className="relative grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {SSB_DAYS.map((d, n) => (
        <li key={d.title} className="relative pl-12 pb-6">
          <span className="absolute left-0 top-0 w-9 h-9 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center">{n + 1}</span>
          {n < SSB_DAYS.length - 1 && <span className="md:hidden absolute left-[17px] top-10 bottom-1 w-0.5 bg-gray-200" aria-hidden="true" />}
          <p className="text-sm font-semibold text-gray-500">{d.day}</p>
          <h3 className="text-lg font-bold text-gray-900">{d.title}</h3>
          <p className="mt-1 text-base text-gray-700 leading-relaxed">{d.what}</p>
          <p className="mt-2 flex gap-2 text-sm text-gray-700 leading-relaxed"><Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{d.tip}</p>
        </li>
      ))}
    </ol>
  );
}

function AfterSsb() {
  return (
    <ol className="m-rail sm:grid-cols-2 lg:grid-cols-4">
      {AFTER_SSB.map((a, n) => (
        <li key={a.title} className="bg-white border border-gray-200 rounded-3xl p-5">
          <span className="text-3xl font-bold text-brand-600/25 tabular-nums">0{n + 1}</span>
          <h3 className="mt-1 text-lg font-bold text-gray-900">{a.title}</h3>
          <p className="mt-1.5 text-base text-gray-700 leading-relaxed">{a.what}</p>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{a.tip}</p>
        </li>
      ))}
    </ol>
  );
}

function FirstSteps() {
  const [done, setDone] = useState(() => load('ssbc:start-plan', {}));
  function toggle(i) {
    const next = { ...done, [i]: !done[i] };
    setDone(next); save('ssbc:start-plan', next);
    if (next[i]) trackEvent('start_step_done', { step: i + 1 });
  }
  const count = START_STEPS.filter((_, i) => done[i]).length;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4" aria-live="polite">
        <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(count / START_STEPS.length) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold text-gray-700 tabular-nums">{count} of {START_STEPS.length} done</span>
      </div>
      <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {START_STEPS.map((st, i) => (
          <li key={st.title} className={`flex items-start gap-4 border rounded-2xl p-4 ${done[i] ? 'border-emerald-200 bg-emerald-50/60' : 'border-gray-200 bg-white'}`}>
            <button type="button" onClick={() => toggle(i)} aria-pressed={!!done[i]} aria-label={`${st.title}: ${done[i] ? 'done' : 'not done'}`}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${focusRing} ${done[i] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'}`}>
              {done[i] ? <Check className="w-5 h-5 text-white" strokeWidth={3} /> : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-bold ${done[i] ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{st.title}</p>
              <p className="text-base text-gray-600 mt-0.5">{st.what}</p>
              {st.to && (
                <Link to={st.to} onClick={() => trackEvent('start_cta', { which: st.to })}
                  className={`mt-1 inline-flex items-center gap-1 text-base font-semibold text-brand-700 hover:text-brand-900 min-h-[36px] ${focusRing}`}>
                  {st.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Faq() {
  return (
    <div className="space-y-2.5 max-w-3xl">
      {FAQ.map(f => (
        <details key={f.q} className="group bg-white border border-gray-200 rounded-2xl">
          <summary className="list-none flex items-center justify-between gap-3 px-5 py-4 min-h-[56px] cursor-pointer">
            <h3 className="text-base font-semibold text-gray-900">{f.q}</h3>
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <p className="px-5 pb-5 text-base text-gray-700 leading-relaxed">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function BeginnerGuide() {
  const { hash } = useLocation();
  const [active, setActive] = useState(null);
  const [service, setService] = useState('all');
  const chipBar = useRef(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'How to Become an Officer in the Indian Army, Navy & Air Force | SSBCircle';
    return () => { document.title = prev; };
  }, []);

  // Arriving with #roles etc. — go straight there once the page has laid out
  useEffect(() => {
    const id = hash.replace('#', '');
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Highlight the section in view, and keep its chip visible in the bar
  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-35% 0px -60% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    chipBar.current?.querySelector(`[data-id="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  function jump(id, from) {
    scrollToId(id);
    trackEvent('start_jump', { to: id, from });
  }

  function seeRoles(id) {
    setService(id);
    trackEvent('start_service', { service: id });
    scrollToId('roles');
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      {/* Hero — the dream, then every part of the page one tap away */}
      <header className="bg-gradient-to-b from-brand-50 to-white px-4 sm:px-6 pt-8 sm:pt-14 pb-8">
        <div className="max-w-5xl mx-auto">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-white border border-brand-100 px-3 py-1.5 rounded-full">
            <Shield className="w-4 h-4" /> Indian Army · Indian Navy · Indian Air Force
          </p>
          <h1 className="mt-4 text-[1.75rem] sm:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight max-w-3xl">
            How to become an officer in the Indian Armed Forces
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl">
            Dream of the uniform? Here is what you can become, how to join after 12th or after graduation,
            and how selection works — in simple words. Read in any order.
          </p>

          <nav aria-label="Jump to a part of this guide" className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} onClick={e => { e.preventDefault(); jump(s.id, 'tile'); }}
                className={`flex items-center gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-2xl hover:border-brand-600/40 hover:shadow-sm transition ${focusRing}`}>
                <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0"><s.icon className="w-5 h-5" /></span>
                <span className="min-w-0">
                  <span className="block text-sm sm:text-base font-bold text-gray-900 leading-tight">{s.title}</span>
                  <span className="block text-xs sm:text-sm text-gray-500 leading-snug mt-0.5">{s.one}</span>
                </span>
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* Sticky section bar — move anywhere at any time */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur border-y border-gray-200">
        <nav ref={chipBar} aria-label="Sections" className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(s => (
            <a key={s.id} data-id={s.id} href={`#${s.id}`} onClick={e => { e.preventDefault(); jump(s.id, 'bar'); }}
              aria-current={active === s.id ? 'true' : undefined}
              className={`shrink-0 px-3.5 min-h-[36px] inline-flex items-center rounded-full text-sm font-semibold whitespace-nowrap transition ${focusRing} ${
                active === s.id ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {s.chip}
            </a>
          ))}
        </nav>
      </div>

      <main>
        <Section id="services">
          <SectionHead id="services" kicker="The three services" title="Indian Army, Navy or Air Force?">
            All three need officers to lead. Each works in a different world — land, sea or sky.
          </SectionHead>
          <Services onSeeRoles={seeRoles} />
        </Section>

        <Section id="roles" className="bg-gray-50">
          <SectionHead id="roles" kicker="Branches and roles" title="Find a role that fits you">
            Pilot, infantry officer, naval engineer, doctor, lawyer — there are {ALL_ROLES.length} kinds of officer across the three services.
          </SectionHead>
          <RoleFinder service={service} setService={setService} />
        </Section>

        <Section id="how-to-join">
          <SectionHead id="how-to-join" kicker="Entries" title="How to join after 12th or after graduation">
            An entry is a door into the forces. Which doors are open depends on your studies and age.
          </SectionHead>
          <HowToJoin />
        </Section>

        <Section id="can-i" className="bg-gray-50">
          <SectionHead id="can-i" kicker="Is this for me?" title="Can I become an officer?">
            Yes, if you are willing to grow. You do not need to be the smartest or the richest.
          </SectionHead>
          <CanI />
        </Section>

        <Section id="ssb">
          <SectionHead id="ssb" kicker="Selection" title="The SSB interview, stage by stage">
            Almost every officer passes through the Services Selection Board: about five days at a Selection Centre where you are tested as a whole person. It is free.
          </SectionHead>
          <SsbStages />
        </Section>

        <Section id="after-ssb" className="bg-gray-50">
          <SectionHead id="after-ssb" kicker="After the SSB" title="Medical exam, merit list and training">
            Being recommended is a big step. Four more take you to the uniform.
          </SectionHead>
          <AfterSsb />
        </Section>

        <Section id="first-steps">
          <SectionHead id="first-steps" kicker="Start today" title="Your first steps">
            You do not have to do everything at once. Start with one. Tick each as you finish it — we remember on this device.
          </SectionHead>
          <FirstSteps />
        </Section>

        <Section id="faq" className="bg-gray-50">
          <SectionHead id="faq" kicker="FAQ" title="Questions people ask" />
          <Faq />
        </Section>

        <section className="px-4 sm:px-6 py-12 bg-brand-600 text-white text-center">
          <p className="text-2xl font-bold max-w-xl mx-auto">Every officer you admire started exactly where you are.</p>
          <p className="mt-2 text-base text-white/85">With a dream, and one first step.</p>
          <Link to="/exams?tab=eligible" onClick={() => trackEvent('start_cta', { which: 'eligibility_footer' })}
            className={`mt-6 inline-flex items-center gap-2 bg-white text-brand-700 font-semibold text-base px-6 py-3 rounded-xl hover:bg-brand-50 ${focusRing}`}>
            Check my eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>
    </div>
  );
}
