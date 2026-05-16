import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createRoom } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, ArrowRight, AlertCircle, Info, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORIES = ['GD', 'PPDT', 'Lecturette', 'IO Practice'];
const GD_SUBCATEGORIES = ['Defence', 'International Relations', 'Society', 'Economy', 'Science & Tech', 'Environment', 'Sports & Awards'];

const CATEGORY_TIPS = {
  'GD': [
    'Host from a laptop — share your screen so all participants see the 3 leads the assessor gives',
    'Let the group pick one lead, then highlight the selected lead on your shared screen',
    'Set the timer to 15–20 min — mirrors actual SSB GD duration',
    'Listen actively and build on what others say — group flow is what GTO assesses, not who talks most',
    'End the room when done — it frees up server resources for other aspirants',
  ],
  'PPDT': [
    'Host from a laptop — share your screen to show the picture to all participants',
    'Give 1 min for individual story writing, then let each person narrate their version (1 min each)',
    'Discuss as a group to arrive at a common story with a common hero',
    'Use the timer for each phase to keep it structured and realistic',
  ],
  'Lecturette': [
    'Host from a laptop — share your screen with the topic visible throughout the session',
    'Each participant gets 3 min strictly on the timer — no interruptions during the lecture',
    'Others use the Notes tab to jot feedback, share it after the speaker finishes',
    'Rotate speakers so everyone gets equal practice — log who spoke in the chat',
  ],
  'IO Practice': [
    'Best for 1-on-1 sessions — one person plays the IO, the other is the candidate',
    'Share the room code with just one other person to keep it private',
    'The IO can use the chat to send written questions if mic is not available',
    'Recommended: ex-servicemen, recommended students, or experienced aspirants take the IO role',
    'Use the transcript to review how answers were framed after the session',
  ],
};

const CATEGORY_META = {
  'GD':          { label: 'Group Discussion',                  desc: 'Topic-based group discussion' },
  'PPDT':        { label: 'PPDT',                              desc: 'Picture Perception & Discussion' },
  'Lecturette':  { label: 'Lecturette',                        desc: 'Individual talk on a topic' },
  'IO Practice': { label: 'IO Practice',                       desc: 'Interview Officer mock interview' },
};

export default function CreateRoom() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('GD');
  const [subcategory, setSubcategory] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [room,        setRoom]        = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [errors,      setErrors]      = useState({});

  const shareUrl = room ? `${window.location.origin}/join/${room.room_code}` : '';

  function validate() {
    const e = {};
    if (title.trim().length < 5)          e.title = 'Title must be at least 5 characters';
    if (title.trim().length > 100)         e.title = 'Title must be under 100 characters';
    if (description.trim().length < 10)    e.description = 'Description must be at least 10 characters';
    if (description.trim().length > 500)   e.description = 'Description must be under 500 characters';
    if (!CATEGORIES.includes(category))    e.category = 'Please select a category';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) { navigate('/login', { state: { from: location } }); return; }

    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setLoading(true);
    setErrors({});
    try {
      const created = await createRoom(title.trim(), description.trim(), category, subcategory || null);
      setRoom(created);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Room Created!</h2>
          <p className="text-gray-400 text-sm mb-1 font-medium">{room.topic}</p>
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-600/10 text-brand-600 border border-brand-600/20">
              {room.category}
            </span>
            {room.subcategory && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {room.subcategory}
              </span>
            )}
          </div>
          {room.description && (
            <p className="text-gray-400 text-xs mb-5 max-w-xs mx-auto line-clamp-2">{room.description}</p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Room Code</p>
            <p className="text-4xl font-mono font-bold text-brand-600 tracking-[0.2em] mb-3">{room.room_code}</p>
            <button onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors cursor-pointer font-medium">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy invite link</>}
            </button>
          </div>

          <button onClick={() => navigate(`/room/${room.room_code}`)}
            className="btn-primary w-full py-2.5 mb-3 flex items-center justify-center gap-2">
            Enter Room <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setRoom(null); setTitle(''); setDescription(''); setCategory('GD'); setSubcategory(''); }}
            className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
            Create another room
          </button>
        </div>
      </div>
    );
  }

  const isValid = title.trim().length >= 5 && description.trim().length >= 10;

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
          ← Back
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Create a Room</h1>
          <p className="text-sm text-gray-400 mb-6">Give your room a clear title, purpose, and type.</p>

          {errors.general && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Room Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); setSubcategory(''); setErrors(p => ({ ...p, category: '' })); }}
                    className={`text-left px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      category === cat
                        ? 'border-brand-600 bg-brand-600/5 text-brand-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold">{cat}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{CATEGORY_META[cat].desc}</span>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.category}
                </p>
              )}
            </div>

            {/* Session tips — updates live with category */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-brand-700 mb-2.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                How to run a great {CATEGORY_META[category].label} session
              </p>
              <ul className="space-y-1.5">
                {CATEGORY_TIPS[category].map(tip => (
                  <li key={tip} className="text-xs text-brand-700/75 flex items-start gap-2 leading-relaxed">
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-brand-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* GD Subcategory */}
            {category === 'GD' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  GD Topic Area <span className="text-gray-300 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GD_SUBCATEGORIES.map(sub => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubcategory(p => p === sub ? '' : sub)}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all cursor-pointer ${
                        subcategory === sub
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">
                  Room Title <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-medium ${
                  title.length < 5 ? 'text-gray-300' :
                  title.length > 90 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                className={`input-base ${errors.title ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                placeholder="e.g. AI in Indian Defence"
                value={title}
                maxLength={100}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: '' })); }}
                disabled={loading}
              />
              {errors.title ? (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.title}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" /> Minimum 5 characters · shown on room card
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">
                  Description <span className="text-red-400">*</span>
                </label>
                <span className={`text-[10px] font-medium ${
                  description.length < 10 ? 'text-gray-300' :
                  description.length > 450 ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                className={`input-base resize-none ${errors.description ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                placeholder={`e.g. "We'll discuss whether India should accelerate AI adoption in military systems — pros, cons, ethical concerns, and strategic implications."`}
                value={description}
                maxLength={500}
                onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })); }}
                disabled={loading}
              />
              {errors.description ? (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {errors.description}
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" /> Minimum 10 characters · helps others understand the room's purpose
                </p>
              )}
            </div>

            {/* Progress hints */}
            <div className="flex gap-2">
              <div className={`flex-1 h-1 rounded-full transition-all ${category ? 'bg-brand-600' : 'bg-gray-100'}`} />
              <div className={`flex-1 h-1 rounded-full transition-all ${title.trim().length >= 5 ? 'bg-brand-600' : 'bg-gray-100'}`} />
              <div className={`flex-1 h-1 rounded-full transition-all ${description.trim().length >= 10 ? 'bg-brand-600' : 'bg-gray-100'}`} />
            </div>

            <button type="submit"
              className="btn-primary w-full py-2.5"
              disabled={loading || !isValid}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Creating…
                </span>
              ) : 'Create Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
