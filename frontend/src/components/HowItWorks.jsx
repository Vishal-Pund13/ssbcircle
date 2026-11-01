import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, CalendarDays, FileText, ListChecks, PenLine, BookOpen, Radio, Users, MessageCircle, Target,
  Signpost, Clock, LogIn, ArrowRight, Sun, Repeat,
} from 'lucide-react';
import SiteNav from './SiteNav';
import { CoverBand, PageHead } from './PageCover';
import MentorNudge from './MentorNudge';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../analytics';
import { TOOLS, STAGES, DAILY, WEEKLY } from '../data/platformGuide';

// "How SSBCircle works": what to do first for where you are, a 20-minute
// daily routine, and every tool explained. Free to scroll — the stage picker
// only changes which path is shown, it never locks anything.

const ICON = { Compass, CalendarDays, FileText, ListChecks, PenLine, BookOpen, Radio, Users, MessageCircle, Target };

function ToolLink({ id, children, className }) {
  const t = TOOLS[id];
  return (
    <Link to={t.to} onClick={() => trackEvent('guide_tool', { tool: id })} className={className}>{children}</Link>
  );
}

export default function HowItWorks() {
  const { user } = useAuth();
  const [stage, setStage] = useState(user?.ssb_date ? 'ssb' : 'starting');
  const current = STAGES.find(s => s.id === stage);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />
      <CoverBand scene="prep" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <PageHead icon={Signpost} title="How SSBCircle works"
          subtitle="Everything on SSBCircle, and what to do first — based on where you are in your journey to becoming an officer." />

        {/* ── Where are you right now? ── */}
        <section className="mt-8" aria-labelledby="stage-h">
          <h2 id="stage-h" className="text-lg sm:text-xl font-bold text-gray-900">Where are you right now?</h2>
          <p className="text-sm text-gray-500 mt-1">Pick one. We will show you what to use, in order.</p>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5" role="tablist">
            {STAGES.map(s => {
              const Icon = ICON[s.icon];
              const on = s.id === stage;
              return (
                <button key={s.id} type="button" role="tab" aria-selected={on}
                  onClick={() => { setStage(s.id); trackEvent('guide_stage', { stage: s.id }); }}
                  className={`text-left rounded-2xl border p-3.5 sm:p-4 cursor-pointer transition-colors ${on ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 hover:border-brand-600/40'}`}>
                  <Icon className={`w-5 h-5 ${on ? 'text-white' : 'text-brand-600'}`} />
                  <span className={`mt-2 block text-sm font-bold leading-snug ${on ? 'text-white' : 'text-gray-900'}`}>{s.label}</span>
                  <span className={`mt-0.5 block text-xs leading-snug ${on ? 'text-white/80' : 'text-gray-500'}`}>{s.sub}</span>
                </button>
              );
            })}
          </div>

          <ol className="mt-4 space-y-2.5" role="tabpanel" aria-label={current.label}>
            {current.steps.map((id, i) => {
              const t = TOOLS[id];
              const Icon = ICON[t.icon];
              return (
                <li key={id}>
                  <ToolLink id={id}
                    className={`flex items-start gap-3.5 rounded-2xl border bg-white p-4 hover:shadow-sm transition-shadow ${t.mentor ? 'border-emerald-200' : 'border-gray-200 hover:border-brand-600/40'}`}>
                    <span className="w-8 h-8 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[15px] font-bold text-gray-900">
                        <Icon className={`w-4 h-4 shrink-0 ${t.mentor ? 'text-emerald-600' : 'text-brand-600'}`} /> {t.name}
                      </span>
                      <span className="mt-1 block text-sm text-gray-600 leading-relaxed">{t.what}</span>
                      <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {t.time}</span>
                        {t.signIn && !user && <span className="inline-flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> Needs sign-in</span>}
                      </span>
                    </span>
                    <ArrowRight className="w-5 h-5 text-brand-600 shrink-0 mt-1.5" />
                  </ToolLink>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Daily routine ── */}
        <section className="mt-12" aria-labelledby="daily-h">
          <h2 id="daily-h" className="text-lg sm:text-xl font-bold text-gray-900">A 20-minute daily routine</h2>
          <p className="text-sm text-gray-500 mt-1">Steady daily work beats last-minute cramming. This is enough to keep you moving.</p>
          <div className="mt-4 grid lg:grid-cols-[1fr_320px] gap-4">
            <ol className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
              {DAILY.map((d, i) => (
                <li key={d.text}>
                  <ToolLink id={d.tool} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50">
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="flex-1 text-sm text-gray-800"><span className="font-semibold">{i + 1}.</span> {d.text}</span>
                    <span className="text-xs font-semibold text-gray-500 tabular-nums">{d.time}</span>
                  </ToolLink>
                </li>
              ))}
            </ol>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-gray-900"><Repeat className="w-4 h-4 text-brand-600" /> Every week</p>
              <ul className="mt-2.5 space-y-2">
                {WEEKLY.map(wk => (
                  <li key={wk.text}>
                    <ToolLink id={wk.tool} className="text-sm text-brand-700 hover:underline">{wk.text}</ToolLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Every tool ── */}
        <section className="mt-12" aria-labelledby="tools-h">
          <h2 id="tools-h" className="text-lg sm:text-xl font-bold text-gray-900">Everything on SSBCircle</h2>
          <p className="text-sm text-gray-500 mt-1">What each tool does, when to use it, and how long it takes.</p>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(TOOLS).map(([id, t]) => {
              const Icon = ICON[t.icon];
              return (
                <ToolLink key={id} id={id}
                  className={`group flex flex-col rounded-2xl border bg-white p-4 hover:shadow-sm transition-shadow ${t.mentor ? 'border-emerald-200' : 'border-gray-200 hover:border-brand-600/40'}`}>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.mentor ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600'}`}><Icon className="w-5 h-5" /></span>
                  <span className="mt-3 text-[15px] font-bold text-gray-900 group-hover:text-brand-700">{t.name}</span>
                  <span className="mt-1 text-sm text-gray-600 leading-relaxed flex-1">{t.what}</span>
                  <span className="mt-3 text-xs text-gray-500"><span className="font-semibold text-gray-700">When:</span> {t.when}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" /> {t.time}</span>
                </ToolLink>
              );
            })}
          </div>
        </section>

        <MentorNudge source="how_it_works" className="mt-12" title="Not sure where you stand?"
          text="Talk to a verified ex-officer. You get an honest view of your preparation, and a plan for what to do next." />
      </main>
    </div>
  );
}
