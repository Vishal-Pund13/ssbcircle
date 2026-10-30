import { useState, useEffect, useCallback } from 'react';
import {
  Users, Eye, Sparkles, ThumbsUp, AlertTriangle, CheckCircle2, XCircle, Clock, Zap, Lightbulb,
  PenLine, FileText, CheckSquare, CalendarDays, BookOpen, MessageSquare, Radio, RefreshCw,
} from 'lucide-react';

// The v2 admin dashboard's insight panels: overview, sections & features,
// AI usage and AI feedback. One /api/admin/analytics call feeds all four.
// Charts are plain SVG/HTML: one series each, brand navy, with hover values,
// and status colours only for success / failure (always with a label).

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const NAVY = '#1e3a5f';

const SECTION_LABEL = {
  home: 'Home', piq: 'PIQ', tat: 'TAT practice', prep: 'Prep Sheet', exams: 'Exam calendar',
  news: 'News cards', community: 'Community', rooms: 'Live rooms', mentors: 'Mentors',
  profile: 'Profile', signup: 'Sign in / up', start: 'Become an officer guide', other: 'Other',
};
const FEATURE_LABEL = { piq: 'PIQ analysis', tat: 'TAT feedback', prep_speak: 'Prep speaking feedback', other: 'Other' };
const EVENT_LABEL = {
  tat_start: 'TAT started', tat_submit: 'TAT submitted', tat_error: 'TAT failed', tat_rewrite: 'TAT rewrite',
  piq_save: 'PIQ saved', piq_analyse: 'PIQ analysed', piq_error: 'PIQ analysis failed', piq_pdf: 'PIQ PDF downloaded',
  eligibility_check: 'Eligibility checked', exams_tab: 'Exam tab switched',
  home_path_click: 'Home: prep path click', home_cta: 'Home: hero button',
  community_post: 'Community post', community_comment: 'Community comment',
  tabbar: 'Phone tab bar tap', home_mentor_connect: 'Home: talk to a mentor', home_prep_section: 'Home: Prep Sheet section tile', home_prep_totd: 'Home: topic of the day', home_prep_open: 'Home: open Prep Sheet', home_prep_streak_signup: 'Home: start-streak sign-up', home_rail: 'Home: section jump', home_rail_open: 'Home: opened section list', home_stage_click: 'Home: SSB stage link', poster_view: 'Poster: shown', poster_cta: 'Poster: tapped through', poster_close: 'Poster: closed', start_service: 'Guide: service viewed',start_role: 'Guide: role opened', start_interest: 'Guide: interest picked', start_jump: 'Guide: jumped to section',start_cta: 'Guide: next-step click', start_step_done: 'Guide: plan step ticked',
};

const fmt = n => (n ?? 0).toLocaleString('en-IN');
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const secs = ms => (ms ? `${(ms / 1000).toFixed(1)}s` : '—');
const shortDay = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// ── Building blocks ─────────────────────────────────────────────────────────

function Card({ title, note, children, className = '' }) {
  return (
    <section className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      {title && <p className="text-sm font-bold text-gray-900">{title}</p>}
      {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
      <div className={title || note ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className="w-4 h-4" /><span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// Daily bars, one series, value on hover
function Bars({ data, field, label, height = 120 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map(d => d[field] || 0));
  const total = data.reduce((s, d) => s + (d[field] || 0), 0);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600">{label}</p>
        <p className="text-xs text-gray-500 tabular-nums">{fmt(total)} total</p>
      </div>
      <div className="relative">
        <div className="flex items-end gap-[3px]" style={{ height }} onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => {
            const v = d[field] || 0;
            return (
              <div key={d.day} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
                <div className="w-full rounded-t-[4px] transition-opacity"
                  style={{ height: v ? `${Math.max(3, (v / max) * 100)}%` : 2, background: v ? NAVY : '#e5e7eb', opacity: hover === null || hover === i ? 1 : 0.45 }} />
              </div>
            );
          })}
        </div>
        {hover !== null && (
          <div className="absolute -top-2 -translate-y-full bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 pointer-events-none whitespace-nowrap"
            style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translate(-50%, -100%)' }}>
            {shortDay(data[hover].day)} · <span className="font-bold">{fmt(data[hover][field])}</span>
          </div>
        )}
        <div className="flex justify-between mt-1.5 text-[11px] text-gray-400">
          <span>{shortDay(data[0].day)}</span><span>{shortDay(data[data.length - 1].day)}</span>
        </div>
      </div>
    </div>
  );
}

// Ranked horizontal bars
function Ranked({ rows, valueKey, labelOf, subOf }) {
  const max = Math.max(1, ...rows.map(r => r[valueKey]));
  if (!rows.length) return <Empty />;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-gray-800 truncate">{labelOf(r)}</span>
            <span className="text-gray-900 font-semibold tabular-nums shrink-0">{fmt(r[valueKey])}
              {subOf && <span className="text-xs font-normal text-gray-400 ml-1.5">{subOf(r)}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(r[valueKey] / max) * 100}%`, background: NAVY }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ text = 'No data in this period yet.' }) {
  return <p className="text-sm text-gray-400 py-4">{text}</p>;
}

function Status({ good, label }) {
  const Icon = good ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${good ? 'text-emerald-700' : 'text-amber-700'}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

// ── Things to look at: plain rules over the numbers ─────────────────────────

function hints(d) {
  const out = [];
  const t = d.totals;
  if (t.llm_calls >= 5 && pct(t.llm_failed, t.llm_calls) >= 10)
    out.push({ bad: true, text: `${pct(t.llm_failed, t.llm_calls)}% of AI calls failed. See AI usage for the error types — usually quota or an overloaded free model.` });
  for (const f of d.llm.by_feature) {
    if (f.calls >= 5 && f.avg_ms > 40000) out.push({ bad: true, text: `${FEATURE_LABEL[f.feature] || f.feature} takes ${secs(f.avg_ms)} on average. Users may leave before it finishes.` });
    if (f.calls >= 5 && pct(f.fallbacks, f.calls) >= 30) out.push({ bad: true, text: `${pct(f.fallbacks, f.calls)}% of ${FEATURE_LABEL[f.feature] || f.feature} calls fell back to the lite model. The main model is often busy or out of quota.` });
  }
  for (const f of d.feedback.by_feature) {
    if (f.total >= 5 && pct(f.helpful, f.total) < 60) out.push({ bad: true, text: `Only ${pct(f.helpful, f.total)}% found ${FEATURE_LABEL[f.feature] || f.feature} useful. Read the comments in Feedback and adjust the prompt.` });
    if (f.total >= 5 && pct(f.helpful, f.total) >= 80) out.push({ bad: false, text: `${pct(f.helpful, f.total)}% found ${FEATURE_LABEL[f.feature] || f.feature} useful.` });
  }
  const tat = d.features.tat;
  const starts = d.events.find(e => e.event === 'tat_start')?.n || 0;
  if (starts >= 10 && pct(tat.attempts, starts) < 40)
    out.push({ bad: true, text: `Only ${pct(tat.attempts, starts)}% of TAT starts end in a submitted story. The 4-minute writing step may be too hard to finish, or people drop off while waiting.` });
  const f = d.funnel;
  if (f.signed_up >= 10 && pct(f.used_a_tool, f.signed_up) < 30)
    out.push({ bad: true, text: `Only ${pct(f.used_a_tool, f.signed_up)}% of new sign-ups used PIQ, TAT or the Prep Sheet. The first step after sign-up needs to be clearer.` });
  if (d.sections.length) {
    const top = d.sections[0];
    out.push({ bad: false, text: `${SECTION_LABEL[top.section] || top.section} is the most visited section (${fmt(top.views)} views from ${fmt(top.visitors)} visitors).` });
    const seen = new Set(d.sections.map(s => s.section));
    const unseen = ['piq', 'tat', 'prep', 'exams'].filter(s => !seen.has(s));
    if (unseen.length && t.page_views >= 100) out.push({ bad: true, text: `No visits to ${unseen.map(s => SECTION_LABEL[s]).join(', ')} in this period. Check they are easy to find.` });
  }
  if (!out.length) out.push({ bad: false, text: 'Not enough activity yet for useful signals. Check back after a few days of real use.' });
  return out;
}

// ── Panels ──────────────────────────────────────────────────────────────────

function Overview({ d, live }) {
  const t = d.totals, f = d.funnel;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Eye} label="Visitors" value={fmt(t.visitors)} sub={`${fmt(t.page_views)} page views`} />
        <Stat icon={Users} label="New users" value={fmt(t.users_new)} sub={`${fmt(t.users_total)} total · ${fmt(t.users_active)} active`} />
        <Stat icon={Sparkles} label="AI calls" value={fmt(t.llm_calls)}
          sub={t.llm_calls ? `${pct(t.llm_calls - t.llm_failed, t.llm_calls)}% succeeded` : 'none yet'} />
        <Stat icon={ThumbsUp} label="AI rated useful" value={t.feedback_total ? `${pct(t.feedback_helpful, t.feedback_total)}%` : '—'}
          sub={`${fmt(t.feedback_total)} ratings`} />
      </div>

      {live && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 px-1">
          <span><span className="font-semibold text-gray-800">{fmt(live.activeRooms)}</span> rooms live now</span>
          <span><span className="font-semibold text-gray-800">{fmt(live.upcomingSessions)}</span> upcoming scheduled rooms</span>
          <span><span className="font-semibold text-gray-800">{fmt(live.todayRooms)}</span> rooms in the last 24h</span>
        </div>
      )}

      <Card title="Things to look at" note="Plain rules over this period's numbers.">
        <ul className="space-y-2">
          {hints(d).map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              {h.bad ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {h.text}
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><Bars data={d.daily} field="visitors" label="Visitors per day" /></Card>
        <Card><Bars data={d.daily} field="signups" label="Sign-ups per day" /></Card>
        <Card><Bars data={d.daily} field="tat" label="TAT stories per day" /></Card>
        <Card><Bars data={d.daily} field="prep_actions" label="Prep Sheet actions per day" /></Card>
      </div>

      <Card title="New users this period" note="Did people who signed up start preparing, and did they come back?">
        <div className="space-y-3">
          {[
            ['Signed up', f.signed_up],
            ['Used PIQ, TAT or the Prep Sheet', f.used_a_tool],
            ['Came back on another day', f.came_back],
          ].map(([label, n]) => (
            <div key={label}>
              <div className="flex justify-between text-sm"><span className="text-gray-700">{label}</span>
                <span className="font-semibold tabular-nums">{fmt(n)} <span className="text-xs font-normal text-gray-400">{pct(n, f.signed_up)}%</span></span></div>
              <div className="mt-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct(n, f.signed_up)}%`, background: NAVY }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Features({ d }) {
  const { tat, piq, prep, news, community, rooms, eligibility } = d.features;
  const fitTotal = tat.verdicts.reduce((s, v) => s + v.n, 0);
  const tiles = [
    { icon: PenLine, label: 'TAT stories', value: fmt(tat.attempts), sub: `${fmt(tat.users)} people · ${tat.avg_words} words avg` },
    { icon: FileText, label: 'PIQ analyses', value: fmt(piq.analyses), sub: `${fmt(piq.saved_in_range)} PIQs saved · ${fmt(piq.with_report)} with a report` },
    { icon: CheckSquare, label: 'Prep Sheet actions', value: fmt(prep.actions), sub: `${fmt(prep.users)} people · ${fmt(prep.speaks)} spoken answers` },
    { icon: CalendarDays, label: 'Eligibility checks', value: fmt(eligibility.checks), sub: `${fmt(eligibility.people)} people · ${eligibility.avg_eligible} entries open on avg` },
    { icon: BookOpen, label: 'News card reads', value: fmt(news.views), sub: `${pct(news.completed, news.views)}% read to the end` },
    { icon: MessageSquare, label: 'Community', value: fmt(community.posts + community.comments), sub: `${fmt(community.posts)} posts · ${fmt(community.comments)} comments` },
    { icon: Radio, label: 'Rooms', value: fmt(rooms.rooms_created), sub: `${fmt(rooms.scheduled)} scheduled · ${fmt(rooms.im_in)} "I'm in"` },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Sections people visit" note="Page views, with unique visitors.">
          <Ranked rows={d.sections} valueKey="views" labelOf={r => SECTION_LABEL[r.section] || r.section} subOf={r => `${fmt(r.visitors)} visitors`} />
        </Card>
        <Card title="Key actions" note="What people did, and how many different people did it.">
          <Ranked rows={d.events} valueKey="n" labelOf={r => EVENT_LABEL[r.event] || r.event} subOf={r => `${fmt(r.people)} people`} />
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(t => <Stat key={t.label} {...t} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="TAT: does the story fit the picture?" note="The AI's verdict on each story.">
          {fitTotal ? (
            <div className="space-y-2">
              {['fits', 'partly', 'off'].map(v => {
                const n = tat.verdicts.find(x => x.verdict === v)?.n || 0;
                return (
                  <div key={v} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{{ fits: 'Fits', partly: 'Partly fits', off: 'Does not fit' }[v]}</span>
                    <span className="font-semibold tabular-nums">{fmt(n)} <span className="text-xs font-normal text-gray-400">{pct(n, fitTotal)}%</span></span>
                  </div>
                );
              })}
              <p className="text-xs text-gray-500 pt-1">{fmt(tat.with_piq)} stories got PIQ-based ideas.</p>
            </div>
          ) : <Empty />}
        </Card>
        <Card title="Most used TAT pictures">
          <Ranked rows={tat.pictures} valueKey="n" labelOf={r => `Picture ${r.picture_id === 0 ? '(blank)' : r.picture_id}`} />
        </Card>
        <Card title="Top news cards">
          <Ranked rows={news.top} valueKey="views" labelOf={r => r.title} subOf={r => `${pct(r.completed, r.views)}% finished`} />
        </Card>
      </div>
    </div>
  );
}

const PRICE = { input: 2, output: 10 };   // $ per million tokens, Claude Sonnet 5, for planning

function AiUsage({ d }) {
  const L = d.llm;
  const inTok = L.by_feature.reduce((s, f) => s + Number(f.input_tokens), 0);
  const outTok = L.by_feature.reduce((s, f) => s + Number(f.output_tokens), 0);
  const cost = (inTok * PRICE.input + outTok * PRICE.output) / 1e6;
  const daily = L.daily.map(x => ({ ...x, total: x.ok + x.failed }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Sparkles} label="AI calls" value={fmt(d.totals.llm_calls)} sub={`${fmt(d.totals.llm_failed)} failed`} />
        <Stat icon={Zap} label="Tokens used" value={fmt(inTok + outTok)} sub={`${fmt(inTok)} in · ${fmt(outTok)} out`} />
        <Stat icon={Clock} label="Slowest feature (avg)" value={L.by_feature.length ? secs(Math.max(...L.by_feature.map(f => f.avg_ms))) : '—'} />
        <Stat icon={FileText} label="Cost if on paid Claude" value={`$${cost.toFixed(2)}`} sub="At Sonnet 5 rates, for planning" />
      </div>

      <Card><Bars data={daily} field="total" label="AI calls per day" /></Card>

      <Card title="By feature" note="Success, speed and size of each AI feature.">
        {L.by_feature.length ? (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                {['Feature', 'Calls', 'Success', 'Avg time', 'Slowest 5%', 'Fell back', 'Tokens in / out', 'People'].map(h => <th key={h} className="px-1 py-2 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {L.by_feature.map(f => {
                  const rate = pct(f.ok, f.calls);
                  return (
                    <tr key={f.feature} className="border-b border-gray-50">
                      <td className="px-1 py-2.5 font-semibold text-gray-900">{FEATURE_LABEL[f.feature] || f.feature}</td>
                      <td className="px-1 py-2.5 tabular-nums">{fmt(f.calls)}</td>
                      <td className="px-1 py-2.5"><Status good={rate >= 90} label={`${rate}%`} /></td>
                      <td className="px-1 py-2.5 tabular-nums">{secs(f.avg_ms)}</td>
                      <td className="px-1 py-2.5 tabular-nums">{secs(f.p95_ms)}</td>
                      <td className="px-1 py-2.5 tabular-nums">{fmt(f.fallbacks)}</td>
                      <td className="px-1 py-2.5 tabular-nums text-gray-600">{fmt(Number(f.input_tokens))} / {fmt(Number(f.output_tokens))}</td>
                      <td className="px-1 py-2.5 tabular-nums">{fmt(f.users)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty text="No AI calls in this period yet." />}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="By model">
          {L.by_model.length ? (
            <div className="space-y-2">
              {L.by_model.map(m => (
                <div key={m.provider + m.model} className="flex items-center justify-between text-sm">
                  <span className="text-gray-800"><span className="text-gray-400">{m.provider} ·</span> {m.model}</span>
                  <span className="tabular-nums font-semibold">{fmt(m.calls)} <span className="text-xs font-normal text-gray-400">{pct(m.ok, m.calls)}% ok</span></span>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Card>
        <Card title="Errors" note="BUSY = quota or overload · UPSTREAM = provider error · TIMEOUT = over 85s · REFUSED = safety block">
          {L.errors.length ? (
            <div className="space-y-2">
              {L.errors.map(e => (
                <div key={e.error_code} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-800"><XCircle className="w-4 h-4 text-red-500" /> {e.error_code}</span>
                  <span className="tabular-nums"><span className="font-semibold">{fmt(e.n)}</span> <span className="text-xs text-gray-400">last {new Date(e.last_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-emerald-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No failed calls in this period.</p>}
        </Card>
      </div>
    </div>
  );
}

function Feedback({ d }) {
  const [only, setOnly] = useState('all');
  const rows = d.feedback.recent.filter(r => only === 'all' || (only === 'bad' ? !r.helpful : r.helpful));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['piq', 'tat', 'prep_speak'].map(f => {
          const row = d.feedback.by_feature.find(x => x.feature === f) || { total: 0, helpful: 0 };
          return (
            <Stat key={f} icon={ThumbsUp} label={FEATURE_LABEL[f]}
              value={row.total ? `${pct(row.helpful, row.total)}% useful` : '—'}
              sub={`${fmt(row.total)} ratings · ${fmt(row.total - row.helpful)} not useful`} />
          );
        })}
      </div>

      <Card title="Recent ratings" note="TAT ratings show the story and the AI's summary, so you can judge the prompt against real output. PIQ content is never shown here.">
        <div className="flex gap-1.5 mb-4">
          {[['all', 'All'], ['bad', 'Not useful'], ['good', 'Useful']].map(([id, label]) => (
            <button key={id} onClick={() => setOnly(id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer ${only === id ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.id} className={`border rounded-xl p-4 ${r.helpful ? 'border-gray-200' : 'border-red-200 bg-red-50/30'}`}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-2">
                    {r.helpful
                      ? <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> Useful</span>
                      : <span className="inline-flex items-center gap-1 font-semibold text-red-700"><XCircle className="w-3.5 h-3.5" /> Not useful</span>}
                    <span className="text-gray-400">· {FEATURE_LABEL[r.feature] || r.feature} · {r.display_name}</span>
                  </span>
                  <span className="text-gray-400">{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-gray-900 font-medium">"{r.comment}"</p>}
                {r.story && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">Story · picture {r.picture_id}</p>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{r.story}</p>
                    </div>
                    <div className="bg-brand-50 rounded-lg p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-1">AI summary · {r.verdict || '—'}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{r.ai_summary || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <Empty text="No ratings in this period yet." />}
      </Card>
    </div>
  );
}

// ── Container ───────────────────────────────────────────────────────────────

export const INSIGHT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Sections & features' },
  { id: 'ai',       label: 'AI usage' },
  { id: 'feedback', label: 'AI feedback' },
];

export default function Insights({ tab, authHeaders, onAuthFail, live }) {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/admin/analytics?days=${days}`, { headers: authHeaders() });
      if (res.status === 401 || res.status === 403) { onAuthFail(); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError('Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{INSIGHT_TABS.find(t => t.id === tab)?.label}</h1>
          <p className="text-xs text-gray-500 mt-0.5">Last {days} days, Indian time{data && ` · updated ${new Date(data.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            {[7, 14, 30].map(n => (
              <button key={n} onClick={() => setDays(n)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer ${days === n ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                {n} days
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gray-800 cursor-pointer" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>}
      {!data && loading && <div className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse" />}
      {data && (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {tab === 'overview' && <Overview d={data} live={live} />}
          {tab === 'features' && <Features d={data} />}
          {tab === 'ai'       && <AiUsage d={data} />}
          {tab === 'feedback' && <Feedback d={data} />}
        </div>
      )}
    </div>
  );
}
