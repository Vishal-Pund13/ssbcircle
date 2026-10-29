import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPiq, getTat } from '../services/api';
import { trackEvent } from '../analytics';
import { FileText, PenLine, BookOpen, Radio, ArrowRight, Check, Eye, Users, Mic, Brain } from 'lucide-react';

// Two home-page blocks that answer "where do I start?".
//
// PrepPath is a short, ordered path through the tools. For a signed-in
// aspirant it also shows where they are on it — what they have done and the
// one thing to do next — so a returning visitor picks up where they left off
// instead of facing the whole site again.
//
// SsbStages maps the real SSB (screening, psychology, GTO, interview) to what
// the site offers for each, so it reads as prep for the whole board, not GD.

export function PrepPath({ user, liveCount = 0 }) {
  const [status, setStatus] = useState({});

  useEffect(() => {
    if (!user) { setStatus({}); return; }
    let cancelled = false;
    Promise.allSettled([getPiq(), getTat()]).then(([piq, tat]) => {
      if (cancelled) return;
      const p = piq.value || {};
      const filled = p.piq && Object.keys(p.piq).length > 3;
      setStatus({
        piq: p.analysis ? 'Report ready' : filled ? 'Filled — get your report' : null,
        piqDone: !!p.analysis,
        tat: tat.value?.attempts?.length ? `${tat.value.attempts.length} ${tat.value.attempts.length === 1 ? 'story' : 'stories'} written` : null,
        tatDone: (tat.value?.attempts?.length || 0) > 0,
      });
    });
    return () => { cancelled = true; };
  }, [user]);

  const steps = [
    { to: '/piq',             icon: FileText, title: 'Know yourself',     desc: 'Fill your PIQ and see what your IO will ask', status: status.piq, done: status.piqDone },
    { to: '/tat',             icon: PenLine,  title: 'Write a TAT story', desc: 'See a picture, write in 4 minutes, get feedback', status: status.tat, done: status.tatDone },
    { to: '/current-affairs', icon: BookOpen, title: 'Read a news card',  desc: 'Current affairs made simple for GD and PI' },
    { to: '/?tab=live',       icon: Radio,    title: 'Practise live',     desc: 'GD, PPDT and Lecturette with other aspirants', status: liveCount > 0 ? `${liveCount} live now` : null, rooms: true },
  ];
  const next = user ? steps.findIndex(s => !s.done) : 0;
  const doneCount = steps.filter(s => s.done).length;

  function scrollRooms(e) {
    e.preventDefault();
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-gray-900">{user ? 'Your SSB prep' : 'Your SSB prep path'}</p>
          <p className="text-xs text-gray-500">{user ? `${doneCount} of 2 key steps done` : 'Four steps. Start with the first.'}</p>
        </div>
        {user && (
          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(doneCount / 2) * 100}%` }} />
          </div>
        )}
      </div>

      <ol className="space-y-1.5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isNext = i === next;
          return (
            <li key={s.title}>
              <Link to={s.to} onClick={e => { trackEvent('home_path_click', { step: s.title, signed_in: !!user }); if (s.rooms) scrollRooms(e); }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isNext
                  ? 'border-brand-200 bg-brand-50 hover:bg-brand-100/60'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.done ? 'bg-emerald-500' : isNext ? 'bg-brand-600' : 'bg-gray-100'}`}>
                  {s.done ? <Check className="w-4 h-4 text-white" /> : <Icon className={`w-4 h-4 ${isNext ? 'text-white' : 'text-gray-500'}`} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    {s.title}
                    {isNext && <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand-700 bg-white border border-brand-200 px-1.5 py-0.5 rounded-full">{user ? 'Next' : 'Start here'}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{s.status || s.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 shrink-0 transition-colors" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const STAGES = [
  {
    n: 1, icon: Eye, title: 'Screening', tests: 'OIR test · PPDT',
    desc: 'Picture story and group discussion on day one. Most candidates are sent back here.',
    links: [{ to: '/?tab=live', label: 'Practise PPDT live', rooms: true }, { to: '/tat', label: 'Picture story practice' }],
  },
  {
    n: 2, icon: Brain, title: 'Psychology', tests: 'TAT · WAT · SRT · Self description',
    desc: 'What you write quickly shows how you really think. Practise writing your own thoughts.',
    links: [{ to: '/tat', label: 'TAT practice with feedback' }],
    soon: 'WAT and SRT coming soon',
  },
  {
    n: 3, icon: Users, title: 'GTO', tests: 'GD · Lecturette · group tasks',
    desc: 'Speaking up, working with a group and leading without pushing.',
    links: [{ to: '/?tab=live', label: 'Live GD and Lecturette rooms', rooms: true }, { to: '/current-affairs', label: 'News cards for topics' }],
  },
  {
    n: 4, icon: Mic, title: 'Interview', tests: 'Personal interview from your PIQ',
    desc: 'The IO asks from your own form. Know your life story well and answer honestly.',
    links: [{ to: '/piq', label: 'PIQ Analyzer' }, { to: '/prep', label: 'Prep Sheet' }],
  },
];

export function SsbStages() {
  function onLink(e, l) {
    if (!l.rooms) return;
    e.preventDefault();
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="border-t border-gray-100 bg-white px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600">The whole board, not just GD</p>
        <h2 className="mt-1.5 text-xl sm:text-2xl font-bold text-gray-900">Prepare for every stage of the SSB</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Five days, four parts. Here is what we have for each.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STAGES.map(({ n, icon: Icon, title, tests, desc, links, soon }) => (
            <div key={title} className="border border-gray-200 rounded-2xl p-4 flex flex-col">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400">STAGE {n}</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
                </div>
              </div>
              <p className="text-[12px] font-semibold text-brand-700">{tests}</p>
              <p className="text-xs text-gray-500 leading-relaxed mt-1.5 flex-1">{desc}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                {links.map(l => (
                  <Link key={l.label} to={l.to} onClick={e => onLink(e, l)}
                    className="flex items-center justify-between gap-2 text-xs font-semibold text-brand-600 hover:text-brand-800">
                    {l.label} <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                ))}
                {soon && <p className="text-[12px] text-gray-400">{soon}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
