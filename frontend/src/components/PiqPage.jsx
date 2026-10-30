import { useState, useEffect } from 'react';
import { getPiq, savePiq, deletePiq, analyzePiq } from '../services/api';
import { SAMPLE_PIQ } from '../data/samplePiq';
import { Check, AlertCircle, Trash2, Lock, Plus, X, Sparkles, ChevronDown, Lightbulb, Eye, Heart, FileText, ClipboardList, MessageCircleQuestion, UserRound } from 'lucide-react';
import PiqPdfButton from './PiqPdfButton';
import AiWaitPanel from './AiWaitPanel';
import { SoldierLoader } from './SoldierRunner';
import { trackEvent } from '../analytics';
import AiFeedback from './AiFeedback';
import { firstName } from './Hello';
import { CoverBand, PageHead } from './PageCover';
import SiteNav from './SiteNav';
import { useAuth } from '../context/AuthContext';

// A working copy of the Personal Information Questionnaire (DIPR 107-A).
//
// The real form is what the Interviewing Officer reads before the interview and
// questions you from, so filling it honestly here is the preparation — the
// analysis that follows only has something to work with if this is real.
//
// It holds sensitive detail by design, because the paper form does. Nothing here
// is visible to other members, and the delete button really deletes.

const FAMILY_ROWS = [
  'Father', 'Mother', 'Guardian',
  'Elder Brother / Sister', 'Elder Brother / Sister',
  'Younger Brother / Sister', 'Younger Brother / Sister',
];

const EDUCATION_ROWS = [
  'Matric / Hr. Sec.',
  '10+2 Equivalent',
  'Graduation',
  'Post-Graduation / Professional',
];

const emptyForm = () => ({
  selection_board: '', batch_no: '', chest_no: '', roll_no: '',
  name: '', father_name: '',
  max_residence: '', max_population: '',
  present_residence: '', present_population: '',
  permanent_residence: '', permanent_population: '', is_district_hq: '',
  state_district: '', religion: '', category: '', mother_tongue: '',
  dob: '', marital_status: '',
  parents_alive: '', age_at_parent_death: '',
  family: FAMILY_ROWS.map(relation => ({ relation, education: '', occupation: '', income: '' })),
  education: EDUCATION_ROWS.map(level => ({
    level, qualification: '', institution: '', board: '', year: '',
    marks: '', medium: '', boarder: '', achievement: '',
  })),
  age: '', height_m: '', weight_kg: '',
  present_occupation: '', personal_income: '',
  ncc_trained: '', ncc_total_training: '', ncc_wing: '', ncc_division: '', ncc_certificate: '',
  sports: [],
  hobbies: '',
  extracurricular: [],
  positions_ncc: '', positions_other: '',
  commission_nature: '', service_choice: '',
  chances_availed: '',
  previous_interviews: [],
});

const NEW_SPORT    = () => ({ name: '', duration: '', represented: '', achievement: '' });
const NEW_ACTIVITY = () => ({ activity: '', duration: '', achievement: '' });
const NEW_INTERVIEW = () => ({ entry_type: '', ssb_place: '', date: '', chest_batch: '' });

function Section({ no, title, children }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
      <h2 className="text-sm font-bold text-gray-900 flex items-baseline gap-2">
        <span className="text-brand-600 tabular-nums">{no}.</span> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[12px] font-bold text-gray-600 mb-1">{label}</span>
      <input type={type} className="input-base text-sm w-full" value={value || ''}
        onChange={e => onChange(e.target.value)} />
      {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
    </label>
  );
}

// Repeating tables are blank on the paper form, so rows are added as needed.
function RowList({ rows, columns, onChange, onAdd, onRemove, addLabel }) {
  return (
    <div>
      {rows.length === 0 && (
        <p className="text-xs text-gray-400 mb-3">Nothing added yet.</p>
      )}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="relative border border-gray-100 rounded-xl p-3 pr-9 bg-gray-50/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {columns.map(col => (
                <Field key={col.key} label={col.label} value={row[col.key]}
                  onChange={v => onChange(i, col.key, v)} />
              ))}
            </div>
            <button type="button" onClick={() => onRemove(i)}
              className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-500 cursor-pointer"
              title="Remove">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer">
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

// ── The report ──────────────────────────────────────────────────────────────
// Reports saved before the leadership lens existed have plain-string strengths
// and no leadership or practice sections, so every part renders only if present.
// Each part is its own numbered card so a long report scans in order.

const LEADERSHIP = [
  { key: 'understanding', label: 'Understanding', hint: 'Seeing a situation fully, from all sides', icon: Eye },
  { key: 'character',     label: 'Character',     hint: 'Caring about people, not only yourself',   icon: Heart },
  { key: 'solutions',     label: 'Solutions',     hint: 'Bringing your own ideas to change things', icon: Lightbulb },
];

function ReportCard({ id, n, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-20 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{n}</span>
        <div>
          <h3 className="text-base font-bold text-gray-900 leading-tight">{title}</h3>
          {intro && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{intro}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// Ticks are a per-device convenience, so they live in localStorage and are
// keyed to this report: a fresh analysis starts a fresh checklist.
function usePracticeTicks(key) {
  const storageKey = `piq-practice:${key}`;
  const [ticks, setTicks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  function toggle(i) {
    setTicks(t => {
      const next = { ...t, [i]: !t[i] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  return [ticks, toggle];
}

function AnalysisReport({ analysis, analysedAt, name }) {
  const lead = analysis.leadership;
  const [openQ, setOpenQ] = useState(0);
  const [ticks, toggleTick] = usePracticeTicks(analysedAt || 'latest');

  const sections = [
    analysis.summary                  && { id: 'r-summary',   title: 'First impression' },
    lead                              && { id: 'r-lead',      title: 'Leadership check' },
    analysis.strengths?.length        && { id: 'r-strengths', title: 'Strong points' },
    analysis.likely_questions?.length && { id: 'r-questions', title: 'Likely questions' },
    analysis.gaps?.length             && { id: 'r-gaps',      title: 'Where the IO will press' },
    analysis.practice?.length         && { id: 'r-practice',  title: 'Practice plan' },
  ].filter(Boolean);
  const num = id => sections.findIndex(s => s.id === id) + 1;
  const jump = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-4 mb-10">
      {/* Header */}
      <div className="bg-brand-600 rounded-2xl p-5 sm:p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-brand-100">Your PIQ report</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{name ? `${name}, here is how your PIQ reads` : 'Here is how your PIQ reads'}</h2>
            {analysedAt && <p className="text-xs text-brand-100 mt-1">Analysed {new Date(analysedAt).toLocaleString('en-IN')}</p>}
          </div>
          <div className="shrink-0 text-right">
            <PiqPdfButton analysis={analysis} name={name} analysedAt={analysedAt} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {sections.map((s, i) => (
            <button key={s.id} type="button" onClick={() => jump(s.id)}
              className="text-[12px] font-semibold bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 rounded-full cursor-pointer transition-colors">
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      </div>

      {analysis.summary && (
        <ReportCard id="r-summary" n={num('r-summary')} title="First impression" intro="How an Interviewing Officer is likely to see you after reading your form.">
          <p className="text-base text-gray-800 leading-relaxed">{analysis.summary}</p>
        </ReportCard>
      )}

      {lead && (
        <ReportCard id="r-lead" n={num('r-lead')} title="Leadership check"
          intro="A leader understands a situation, cares enough to feel it must change, and brings a solution.">
          <div className="divide-y divide-gray-100">
            {LEADERSHIP.map(({ key, label, hint, icon: Icon }) => lead[key] && (
              <div key={key} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-brand-600" />
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-[12px] text-gray-400 hidden sm:block">· {hint}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-xl px-3.5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">What your PIQ shows</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{lead[key].seen}</p>
                  </div>
                  <div className="bg-brand-50 rounded-xl px-3.5 py-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-0.5">How to grow</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{lead[key].grow}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {analysis.strengths?.length > 0 && (
        <ReportCard id="r-strengths" n={num('r-strengths')} title="Strong points" intro="Things the IO is likely to notice in a good way. Be ready to talk about each.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {analysis.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 border border-emerald-100 bg-emerald-50/50 rounded-xl px-3.5 py-3">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                {typeof s === 'string' ? <p className="text-sm text-gray-700 leading-relaxed">{s}</p> : (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.point}</p>
                    {s.evidence && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.evidence}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {analysis.likely_questions?.length > 0 && (
        <ReportCard id="r-questions" n={num('r-questions')} title="Likely questions"
          intro="The IO often asks several questions in one go. They usually fall into groups like these. Open one group at a time and practise answering out loud.">
          <div className="space-y-2">
            {analysis.likely_questions.map((group, i) => {
              const open = openQ === i;
              return (
                <div key={i} className={`border rounded-xl overflow-hidden ${open ? 'border-brand-200' : 'border-gray-200'}`}>
                  <button type="button" onClick={() => setOpenQ(open ? -1 : i)} aria-expanded={open}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer ${open ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'}`}>
                    <span className="text-sm font-semibold text-gray-900">{group.area}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] text-gray-400">{(group.questions || []).length} questions</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-2 bg-white">
                      <ol className="space-y-2">
                        {(group.questions || []).map((q, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-gray-800 leading-relaxed">
                            <span className="text-xs font-bold text-brand-600 w-4 shrink-0 mt-0.5">{j + 1}.</span>{q}
                          </li>
                        ))}
                      </ol>
                      {group.tip && (
                        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-700 leading-relaxed"><span className="font-semibold">How to answer: </span>{group.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ReportCard>
      )}

      {analysis.gaps?.length > 0 && (
        <ReportCard id="r-gaps" n={num('r-gaps')} title="Where the IO will press you"
          intro="Thin or unclear parts of your form. Prepare an honest answer for each before the interview.">
          <div className="space-y-2.5">
            {analysis.gaps.map((gap, i) => (
              <div key={i} className="border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-gray-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{gap.issue}
                </p>
                <div className="mt-2 pl-6 space-y-1.5">
                  {gap.why && <p className="text-xs text-gray-600 leading-relaxed"><span className="font-semibold text-gray-700">Why it matters: </span>{gap.why}</p>}
                  {gap.fix && <p className="text-xs text-gray-600 leading-relaxed"><span className="font-semibold text-brand-700">Before your interview: </span>{gap.fix}</p>}
                </div>
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {analysis.practice?.length > 0 && (
        <ReportCard id="r-practice" n={num('r-practice')} title="Practice plan"
          intro="Small exercises built on your own life. Tick them off as you do them — they improve how you think, not only how you answer.">
          <div className="space-y-2">
            {analysis.practice.map((p, i) => (
              <label key={i} className={`flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${ticks[i] ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={!!ticks[i]} onChange={() => toggleTick(i)} className="mt-1 w-4 h-4 accent-emerald-600 shrink-0" />
                <div>
                  <p className={`text-sm font-semibold ${ticks[i] ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{p.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{p.task}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-[12px] text-gray-400 mt-3">
            {Object.values(ticks).filter(Boolean).length} of {analysis.practice.length} done
          </p>
        </ReportCard>
      )}

      <AiFeedback feature="piq" refId={analysedAt} prompt="Was this PIQ report useful?" />

      <p className="text-[12px] text-gray-400 leading-relaxed px-1">
        This is practice guidance based on what you wrote, not a real assessment. Be honest on the day:
        the truth needs no remembering. Nobody is perfect; keep improving.
      </p>
    </div>
  );
}

export default function PiqPage() {
  const { user: me } = useAuth();
  const [form,    setForm]    = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [updated, setUpdated] = useState(null);

  const [analysis,  setAnalysis]  = useState(null);
  const [analysedAt, setAnalysedAt] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [aError,    setAError]    = useState('');

  useEffect(() => {
    let cancelled = false;
    getPiq()
      .then(({ piq, updated_at, analysis: saved, analysed_at }) => {
        if (cancelled) return;
        // Merge over a fresh blank so a form saved before a field existed still
        // opens cleanly instead of leaving undefined inputs.
        if (piq) setForm({ ...emptyForm(), ...piq });
        setUpdated(updated_at);
        setAnalysis(saved || null);
        setAnalysedAt(analysed_at || null);
      })
      .catch(() => { if (!cancelled) setError('Could not load your PIQ.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const set = (key, value) => { setForm(f => ({ ...f, [key]: value })); setSaved(false); setError(''); };

  const setRow = (listKey, index, field, value) =>
    setForm(f => ({
      ...f,
      [listKey]: f[listKey].map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));

  const addRow    = (listKey, make) => setForm(f => ({ ...f, [listKey]: [...f[listKey], make()] }));
  const removeRow = (listKey, index) => setForm(f => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== index) }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const { updated_at } = await savePiq(form);
      setUpdated(updated_at);
      setSaved(true);
      trackEvent('piq_save');
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not save your PIQ.');
    } finally {
      setSaving(false);
    }
  }

  // Saves first, so the analysis always reflects what is on screen rather than
  // whatever was last written to the database.
  async function analyse() {
    setAnalysing(true); setAError(''); setError('');
    try {
      await savePiq(form);
      const { analysis: result, analysed_at } = await analyzePiq();
      setAnalysis(result);
      setAnalysedAt(analysed_at);
      trackEvent('piq_analyse');
      // Bring the fresh report into view once it has rendered
      setTimeout(() => jumpTo('piq-report'), 100);
    } catch (err) {
      setAError(err.message || 'Could not analyse your PIQ.');
      trackEvent('piq_error');
    } finally {
      setAnalysing(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete your PIQ? This removes everything you have filled in and cannot be undone.')) return;
    setSaving(true); setError('');
    try {
      await deletePiq();
      setForm(emptyForm());
      setUpdated(null);
    } catch (err) {
      setError(err.message || 'Could not delete your PIQ.');
    } finally {
      setSaving(false);
    }
  }

  const jumpTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (loading) return <SoldierLoader label="Opening your PIQ…" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />
      {/* The form is long, so saving stays in reach just under the site nav */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 sm:px-6 py-2 sticky top-14 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-700">Your PIQ</span>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <button onClick={save} disabled={saving}
              className="btn-primary text-xs px-4 py-2">
              {saving ? 'Saving…' : 'Save PIQ'}
            </button>
          </div>
        </div>
      </div>

      <CoverBand deco={[ClipboardList, MessageCircleQuestion, UserRound]} />

      <form onSubmit={save} className="max-w-3xl mx-auto px-4 sm:px-6 pb-7 space-y-4">

        <PageHead icon={FileText} eyebrow="PIQ Analyzer"
          title={me ? `${firstName(me)}'s Personal Information Questionnaire` : 'Your Personal Information Questionnaire'}
          subtitle="This is the form you fill on day one at the SSB, and the one your Interviewing Officer reads before calling you in. Fill it as you would on the day — the questions you get asked come straight out of it.">
          {/* Local testing only — stripped from production builds */}
          {import.meta.env.DEV && (
            <button type="button"
              onClick={() => { setForm({ ...emptyForm(), ...structuredClone(SAMPLE_PIQ) }); setSaved(false); setError(''); }}
              className="mt-3 text-[12px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-amber-100">
              Dev: fill sample PIQ
            </button>
          )}
          {updated && (
            <p className="mt-2 text-[12px] text-gray-400">
              Last saved {new Date(updated).toLocaleString('en-IN')}
            </p>
          )}
        </PageHead>

        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5">
          <Lock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800">Only you can see this.</span>{' '}
            Your PIQ is never shown to other members and never appears on your public profile.
            Delete it whenever you like and it is removed from our database, not just hidden.
          </p>
        </div>

        {/* A finished report lives at the bottom of a long form, so point to it from the top */}
        {analysis && (
          <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">Your PIQ report is ready</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {analysedAt && <>Analysed {new Date(analysedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                  {analysis.likely_questions?.length > 0 && <> · {analysis.likely_questions.length} question groups</>}
                  {analysis.gaps?.length > 0 && <> · {analysis.gaps.length} points the IO may press</>}
                </p>
                {updated && analysedAt && new Date(updated) > new Date(analysedAt) && (
                  <p className="text-xs text-amber-700 mt-1.5">
                    You have changed your PIQ since this report. Analyse again to see an updated one.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3.5 sm:pl-12">
              <button type="button" onClick={() => jumpTo('piq-report')}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5">
                View my report
              </button>
              <button type="button" onClick={() => jumpTo('piq-form')}
                className="btn-secondary text-xs px-4 py-2">
                Edit and re-analyse
              </button>
            </div>
            <p className="text-[12px] text-gray-400 mt-2.5 sm:pl-12">
              To update: change anything in the form below, then press <span className="font-semibold">Analyse again</span> at the end.
            </p>
          </div>
        )}

        <div id="piq-form" className="scroll-mt-20" />
        <Section no="1" title="Selection Board">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Selection Board (No. & Place)" value={form.selection_board} onChange={v => set('selection_board', v)} />
            <Field label="Batch No." value={form.batch_no} onChange={v => set('batch_no', v)} />
            <Field label="Chest No." value={form.chest_no} onChange={v => set('chest_no', v)} />
            <Field label="UPSC / Other Roll No." value={form.roll_no} onChange={v => set('roll_no', v)} />
          </div>
        </Section>

        <Section no="2–3" title="Name and father's name">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name (as in the matriculation certificate)" value={form.name} onChange={v => set('name', v)} />
            <Field label="Father's name" value={form.father_name} onChange={v => set('father_name', v)} />
          </div>
        </Section>

        <Section no="4" title="Residence">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field className="sm:col-span-2" label="Place of maximum residence (place, district, state)"
                value={form.max_residence} onChange={v => set('max_residence', v)} />
              <Field label="Approx. population" value={form.max_population} onChange={v => set('max_population', v)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field className="sm:col-span-2" label="Place of present residence"
                value={form.present_residence} onChange={v => set('present_residence', v)} />
              <Field label="Approx. population" value={form.present_population} onChange={v => set('present_population', v)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field className="sm:col-span-2" label="Place of permanent residence"
                value={form.permanent_residence} onChange={v => set('permanent_residence', v)} />
              <Field label="Approx. population" value={form.permanent_population} onChange={v => set('permanent_population', v)} />
            </div>
            <Field label="Is it the district headquarters?" value={form.is_district_hq}
              onChange={v => set('is_district_hq', v)} hint="Yes or No" />
          </div>
        </Section>

        <Section no="5" title="Personal particulars">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="State & district" value={form.state_district} onChange={v => set('state_district', v)} />
            <Field label="Religion" value={form.religion} onChange={v => set('religion', v)} />
            <Field label="Category (SC / ST / OBC)" value={form.category} onChange={v => set('category', v)} />
            <Field label="Mother tongue" value={form.mother_tongue} onChange={v => set('mother_tongue', v)} />
            <Field label="Date of birth" type="date" value={form.dob} onChange={v => set('dob', v)} />
            <Field label="Married / Single / Widower" value={form.marital_status} onChange={v => set('marital_status', v)} />
          </div>
        </Section>

        <Section no="6" title="Family">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Field label="Are your parents alive?" value={form.parents_alive} onChange={v => set('parents_alive', v)} hint="Yes or No" />
            <Field label="If not, your age at the time" value={form.age_at_parent_death} onChange={v => set('age_at_parent_death', v)} />
          </div>
          <div className="space-y-3">
            {form.family.map((row, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50/60">
                <p className="text-[12px] font-bold text-gray-700 mb-2">{row.relation}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Education" value={row.education} onChange={v => setRow('family', i, 'education', v)} />
                  <Field label="Occupation" value={row.occupation} onChange={v => setRow('family', i, 'occupation', v)} />
                  <Field label="Income per month" value={row.income} onChange={v => setRow('family', i, 'income', v)} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section no="7" title="Educational record">
          <div className="space-y-3">
            {form.education.map((row, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50/60">
                <p className="text-[12px] font-bold text-gray-700 mb-2">{row.level}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Qualification acquired" value={row.qualification} onChange={v => setRow('education', i, 'qualification', v)} />
                  <Field label="Institution" value={row.institution} onChange={v => setRow('education', i, 'institution', v)} />
                  <Field label="Board / University" value={row.board} onChange={v => setRow('education', i, 'board', v)} />
                  <Field label="Year" value={row.year} onChange={v => setRow('education', i, 'year', v)} />
                  <Field label="Division & marks %" value={row.marks} onChange={v => setRow('education', i, 'marks', v)} />
                  <Field label="Medium of instruction" value={row.medium} onChange={v => setRow('education', i, 'medium', v)} />
                  <Field label="Boarder / day scholar" value={row.boarder} onChange={v => setRow('education', i, 'boarder', v)} />
                  <Field label="Outstanding achievement" value={row.achievement} onChange={v => setRow('education', i, 'achievement', v)} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section no="8" title="Age and physique">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Age (years & months)" value={form.age} onChange={v => set('age', v)} />
            <Field label="Height (metres)" value={form.height_m} onChange={v => set('height_m', v)} />
            <Field label="Weight (kg)" value={form.weight_kg} onChange={v => set('weight_kg', v)} />
          </div>
        </Section>

        <Section no="9" title="Present occupation">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Present occupation" value={form.present_occupation} onChange={v => set('present_occupation', v)} />
            <Field label="Personal monthly income, if any" value={form.personal_income} onChange={v => set('personal_income', v)} />
          </div>
        </Section>

        <Section no="10" title="NCC training">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Have you done NCC?" value={form.ncc_trained} onChange={v => set('ncc_trained', v)} hint="Yes or No" />
            <Field label="Total training" value={form.ncc_total_training} onChange={v => set('ncc_total_training', v)} />
            <Field label="Wing" value={form.ncc_wing} onChange={v => set('ncc_wing', v)} />
            <Field label="Division" value={form.ncc_division} onChange={v => set('ncc_division', v)} />
            <Field label="Certificate obtained" value={form.ncc_certificate} onChange={v => set('ncc_certificate', v)} />
          </div>
        </Section>

        <Section no="11" title="Games, hobbies and activities">
          <p className="text-[12px] font-bold text-gray-600 mb-2">Games and sports</p>
          <RowList
            rows={form.sports}
            columns={[
              { key: 'name',        label: 'Game / sport' },
              { key: 'duration',    label: 'Period of participation' },
              { key: 'represented', label: 'Represented (school / college / university)' },
              { key: 'achievement', label: 'Outstanding achievement' },
            ]}
            onChange={(i, k, v) => setRow('sports', i, k, v)}
            onAdd={() => addRow('sports', NEW_SPORT)}
            onRemove={i => removeRow('sports', i)}
            addLabel="Add a sport"
          />

          <div className="mt-5">
            <Field label="Hobbies / interests" value={form.hobbies} onChange={v => set('hobbies', v)} />
          </div>

          <p className="text-[12px] font-bold text-gray-600 mt-5 mb-2">Extra-curricular activities</p>
          <RowList
            rows={form.extracurricular}
            columns={[
              { key: 'activity',    label: 'Activity group' },
              { key: 'duration',    label: 'Duration of participation' },
              { key: 'achievement', label: 'Outstanding achievement' },
            ]}
            onChange={(i, k, v) => setRow('extracurricular', i, k, v)}
            onAdd={() => addRow('extracurricular', NEW_ACTIVITY)}
            onRemove={i => removeRow('extracurricular', i)}
            addLabel="Add an activity"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
            <Field label="Positions held in NCC / scouting" value={form.positions_ncc} onChange={v => set('positions_ncc', v)} />
            <Field label="Positions held in sports / other fields" value={form.positions_other} onChange={v => set('positions_other', v)} />
          </div>
        </Section>

        <Section no="12–13" title="Commission and service">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nature of commission" value={form.commission_nature} onChange={v => set('commission_nature', v)} />
            <Field label="Choice of service" value={form.service_choice} onChange={v => set('service_choice', v)} />
            <Field label="Chances availed across all three services" value={form.chances_availed} onChange={v => set('chances_availed', v)} />
          </div>
        </Section>

        <Section no="14" title="Previous interviews">
          <RowList
            rows={form.previous_interviews}
            columns={[
              { key: 'entry_type',  label: 'Type of entry' },
              { key: 'ssb_place',   label: 'SSB no. & place' },
              { key: 'date',        label: 'Date' },
              { key: 'chest_batch', label: 'Chest no. / batch no.' },
            ]}
            onChange={(i, k, v) => setRow('previous_interviews', i, k, v)}
            onAdd={() => addRow('previous_interviews', NEW_INTERVIEW)}
            onRemove={i => removeRow('previous_interviews', i)}
            addLabel="Add an interview"
          />
        </Section>

        {error && (
          <p className="text-xs text-red-600 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary text-sm px-6 py-2.5">
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save PIQ'}
          </button>
          <button type="button" onClick={analyse} disabled={analysing || saving}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">
            <Sparkles className="w-4 h-4" />
            {analysing ? 'Reading your PIQ…' : analysis ? 'Analyse again' : 'Analyse my PIQ'}
          </button>
          <button type="button" onClick={remove} disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Delete my PIQ
          </button>
        </div>

        {analysing && (
          <AiWaitPanel title="Reading your PIQ like an IO would" steps={[
            { label: 'Reading your answers', at: 0 },
            { label: 'Finding the questions you are likely to get', at: 8 },
            { label: 'Spotting where the IO will press you', at: 20 },
            { label: 'Writing your practice plan', at: 35 },
          ]} />
        )}

        {aError && (
          <p className="text-xs text-red-600 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {aError}
          </p>
        )}

        {analysis && (
          <div id="piq-report" className="scroll-mt-20">
            <AnalysisReport analysis={analysis} analysedAt={analysedAt} name={form.name} />
          </div>
        )}
      </form>
    </div>
  );
}
