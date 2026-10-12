import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPiq, savePiq, deletePiq } from '../services/api';
import { Check, AlertCircle, Trash2, Lock, Plus, X } from 'lucide-react';

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
      <span className="block text-[11px] font-bold text-gray-600 mb-1">{label}</span>
      <input type={type} className="input-base text-sm w-full" value={value || ''}
        onChange={e => onChange(e.target.value)} />
      {hint && <span className="block text-[10px] text-gray-400 mt-1">{hint}</span>}
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

export default function PiqPage() {
  const [form,    setForm]    = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPiq()
      .then(({ piq, updated_at }) => {
        if (cancelled) return;
        // Merge over a fresh blank so a form saved before a field existed still
        // opens cleanly instead of leaving undefined inputs.
        if (piq) setForm({ ...emptyForm(), ...piq });
        setUpdated(updated_at);
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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Could not save your PIQ.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3.5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="text-brand-600 font-bold">SSBCircle</Link>
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
      </header>

      <form onSubmit={save} className="max-w-3xl mx-auto px-4 sm:px-6 py-7 space-y-4">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-600">PIQ Analyzer</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Your Personal Information Questionnaire
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            This is the form you fill on day one at the SSB, and the one your Interviewing Officer
            reads before calling you in. Fill it as you would on the day — the questions you get
            asked come straight out of it.
          </p>
          {updated && (
            <p className="mt-2 text-[11px] text-gray-400">
              Last saved {new Date(updated).toLocaleString('en-IN')}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3.5">
          <Lock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800">Only you can see this.</span>{' '}
            Your PIQ is never shown to other members and never appears on your public profile.
            Delete it whenever you like and it is removed from our database, not just hidden.
          </p>
        </div>

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
                <p className="text-[11px] font-bold text-gray-700 mb-2">{row.relation}</p>
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
                <p className="text-[11px] font-bold text-gray-700 mb-2">{row.level}</p>
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
          <p className="text-[11px] font-bold text-gray-600 mb-2">Games and sports</p>
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

          <p className="text-[11px] font-bold text-gray-600 mt-5 mb-2">Extra-curricular activities</p>
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

        <div className="flex flex-wrap items-center gap-3 pt-1 pb-10">
          <button type="submit" disabled={saving} className="btn-primary text-sm px-6 py-2.5">
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save PIQ'}
          </button>
          <button type="button" onClick={remove} disabled={saving}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" /> Delete my PIQ
          </button>
        </div>
      </form>
    </div>
  );
}
