import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Landmark, Map, Users, ArrowLeft, Calendar, Tag, ChevronRight, BookOpen, Clock, BarChart2, ArrowRight, CheckCircle } from 'lucide-react';
import { getArticles, getArticle } from '../services/api';
import ArticleRenderer from './ArticleRenderer';

const PILLARS = [
  { id: 'all',            label: 'All',                icon: null },
  { id: 'defence',        label: 'Defence & Security', icon: Shield     },
  { id: 'economic',       label: 'Economic',           icon: TrendingUp },
  { id: 'polity',         label: 'Polity',             icon: Landmark   },
  { id: 'geographic',     label: 'Geographic',         icon: Map        },
  { id: 'socio-cultural', label: 'Society',            icon: Users      },
];

const WOMEN_SLUGS = new Set([
  'women-workforce-paradox', 'women-proxy-representation', 'women-glass-ceiling',
  'women-gender-pay-gap', 'women-safety-economy', 'women-education-gap', 'women-health-india',
]);

function WomenSeriesBanner() {
  const navigate = useNavigate();
  let read = 0;
  try { read = JSON.parse(localStorage.getItem('series_women_india_read') || '[]').length; } catch {}
  return (
    <div className="col-span-full bg-brand-600 rounded-2xl overflow-hidden cursor-pointer group relative"
      onClick={() => navigate('/series/women-india')}>
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '20px 20px' }}/>

      <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Woman mini-SVG */}
        <div className="shrink-0 w-16 h-16 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center">
          <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
            {/* Head */}
            <circle cx="24" cy="12" r="7" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
            {/* Body */}
            <path d="M15 26 Q24 21 33 26 L36 42 L12 42Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinejoin="round"/>
            {/* Raised arm */}
            <path d="M33 26 Q40 20 43 14" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="43" cy="13" r="4" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
            {/* Background rings */}
            <circle cx="24" cy="24" r="22" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <circle cx="24" cy="24" r="15" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold text-brand-100 bg-white/15 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
              Society · Women
            </span>
            <span className="text-[9px] font-bold text-brand-100 bg-white/15 border border-white/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
              7-Card Series
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-1">
            Major Issues Faced by Women in India
          </h3>
          <p className="text-xs text-brand-100 leading-relaxed">
            7 swipe cards — Workforce paradox · Glass ceiling · Pay gap · Safety · Education · Health · Political power
          </p>
          {read > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-24 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${(read / 7) * 100}%` }} />
              </div>
              <span className="text-[10px] text-brand-100 font-semibold">{read}/7 read</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button className="shrink-0 flex items-center gap-1.5 bg-white text-brand-700 font-bold text-xs px-4 py-2 rounded-xl group-hover:bg-brand-50 transition-colors">
          {read === 0 ? 'Start Series' : read === 7 ? 'Review Series' : 'Continue'} <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function _SessionBannerRemoved() {
  const { user, loginWithGoogle } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [form,    setForm]    = useState({ entry_type: '', attempts: '', prev_recommendation: 'No' });
  const [status,  setStatus]  = useState('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [spots,   setSpots]   = useState(30);

  useEffect(() => {
    fetch(`${API}/api/event/spots`)
      .then(r => r.json()).then(d => setSpots(d.spotsLeft)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.entry_type) { setErrMsg('Please select your entry type.'); return; }
    if (!form.attempts)   { setErrMsg('Please enter number of attempts.'); return; }
    setStatus('loading'); setErrMsg('');
    try {
      const res  = await fetch(`${API}/api/event/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:                user.display_name,
          email:               user.email,
          entry_type:          form.entry_type,
          attempts:            form.attempts,
          prev_recommendation: form.prev_recommendation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setSpots(data.spotsLeft);
    } catch (err) {
      setStatus('error'); setErrMsg(err.message);
    }
  }

  return (
    <>
      {/* Banner */}
      <div className="col-span-full rounded-2xl overflow-hidden cursor-pointer relative bg-[#0f2340]"
        onClick={() => setOpen(true)}>
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '18px 18px' }}/>
        <div className="relative z-10 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Icon */}
          <div className="shrink-0 w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Live · 23 May
              </span>
              <span className="text-[9px] font-bold text-white/50 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full uppercase tracking-widest">🪖 Army</span>
              <span className="text-[9px] font-bold text-white/50 bg-white/10 border border-white/15 px-2 py-0.5 rounded-full uppercase tracking-widest">✈️ Air Force</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug mb-0.5">
              Session by a Recommended Candidate
            </h3>
            <p className="text-xs text-white/50">23 May 2026 · 10:00 PM IST · Interactive · Limited to {spots} spot{spots !== 1 ? 's' : ''}</p>
          </div>

          {/* CTA */}
          <button
            onClick={e => { e.stopPropagation(); setOpen(true); }}
            className="shrink-0 flex items-center gap-1.5 bg-white text-[#0f2340] font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Register Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => { if (status !== 'loading') setOpen(false); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="bg-[#0f2340] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-0.5">SSBCircle · 23 May 2026</p>
                  <p className="text-white font-bold text-base">Session by a Recommended Candidate</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white cursor-pointer transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              {status === 'success' ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="font-bold text-gray-900 mb-1">You're registered!</p>
                  <p className="text-sm text-gray-500">Confirmation email sent to <strong>{user?.email}</strong>. You'll get a reminder 30 min before the session.</p>
                  <button onClick={() => setOpen(false)} className="mt-4 text-xs text-brand-600 font-semibold cursor-pointer hover:underline">Close</button>
                </div>
              ) : !user ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-600 mb-4">Sign in with Google to register — your name and email will be auto-filled.</p>
                  <button onClick={loginWithGoogle}
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl cursor-pointer transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Sign in with Google
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Pre-filled read-only fields */}
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Your Details (from Google)</p>
                    <div className="flex items-center gap-2">
                      {user.avatar_url && <img src={user.avatar_url} className="w-7 h-7 rounded-full" alt="" />}
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{user.display_name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto shrink-0" />
                    </div>
                  </div>

                  {/* Entry type */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Which entry are you appearing for? *</label>
                    <select
                      required value={form.entry_type}
                      onChange={e => setForm(p => ({ ...p, entry_type: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white cursor-pointer"
                    >
                      <option value="">Select entry type</option>
                      {ENTRY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Attempts */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">How many SSB attempts so far? *</label>
                    <input
                      type="number" min="0" max="20" required placeholder="e.g. 2"
                      value={form.attempts}
                      onChange={e => setForm(p => ({ ...p, attempts: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>

                  {/* Previous recommendation */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Any previous recommendation?</label>
                    <select
                      value={form.prev_recommendation}
                      onChange={e => setForm(p => ({ ...p, prev_recommendation: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white cursor-pointer"
                    >
                      {RECOMMENDATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {errMsg && <p className="text-xs text-red-600 font-medium">{errMsg}</p>}

                  <button type="submit" disabled={status === 'loading'}
                    className="w-full bg-[#0f2340] hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed">
                    {status === 'loading' ? 'Registering…' : 'Confirm Registration →'}
                  </button>

                  <p className="text-[10px] text-gray-400 text-center">🔔 You'll receive a confirmation email + reminder 30 min before the session</p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getPillar(id) { return PILLARS.find(p => p.id === id) || PILLARS[1]; }
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7 shrink-0">
        <circle cx="24" cy="24" r="22" stroke="#1e3a5f" strokeWidth="3" />
        <circle cx="14" cy="20" r="3.5" fill="#1e3a5f" />
        <circle cx="24" cy="14" r="3.5" fill="#1e3a5f" />
        <circle cx="34" cy="20" r="3.5" fill="#1e3a5f" />
        <circle cx="30" cy="31" r="3.5" fill="#1e3a5f" />
        <circle cx="18" cy="31" r="3.5" fill="#1e3a5f" />
        <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z" stroke="#1e3a5f" strokeWidth="1.5" fill="none" />
      </svg>
      <span className="font-bold text-gray-900 text-[15px] tracking-tight">SSBCircle</span>
    </div>
  );
}

// Same pill badge style as existing category badges in LandingPage
function PillarBadge({ id }) {
  const p = getPillar(id);
  if (!p || !p.icon) return null;
  const Icon = p.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
      <Icon className="w-3 h-3" /> {p.label}
    </span>
  );
}

// Swipe reader slug map — matches data/articles filenames
const SWIPE_ARTICLES = {
  'rupee-depreciation':         true,
  'super-el-nino':              true,
  'women-workforce-paradox':    true,
  'women-proxy-representation': true,
  'women-glass-ceiling':        true,
  'women-gender-pay-gap':       true,
  'women-safety-economy':       true,
  'women-education-gap':        true,
  'women-health-india':         true,
};

// Article card — clicking goes to SwipeReader if available, otherwise blog detail
function ArticleCard({ article, onClick }) {
  const navigate = useNavigate();
  const swipeKey = article.slug || article.id;
  const hasSwipe = SWIPE_ARTICLES[swipeKey];
  const handleClick = hasSwipe ? () => navigate(`/read/${swipeKey}`) : onClick;
  return (
    <div onClick={handleClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-brand-600/30 hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer group">
      <div className="h-0.5 bg-brand-600" />
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Badge + date */}
        <div className="flex items-center justify-between gap-2">
          <PillarBadge id={article.category} />
          <span className="text-[11px] text-gray-400 shrink-0">{fmtDate(article.published_at)}</span>
        </div>
        {/* Title + summary */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1.5 group-hover:text-brand-600 transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{article.summary}</p>
        </div>
        {/* SSB tags — above footer */}
        {article.ssb_relevance?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.ssb_relevance.map(r => (
              <span key={r} className="text-[9px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                {r}
              </span>
            ))}
          </div>
        )}
        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {article.reading_time && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Clock className="w-3 h-3" /> {article.reading_time}
              </span>
            )}
            {article.difficulty && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <BarChart2 className="w-3 h-3" /> {article.difficulty}
              </span>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 shrink-0">
            {hasSwipe ? 'Read cards' : 'Read'} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

function ArticleDetail({ article, onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 cursor-pointer transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to articles
      </button>

      {/* Article header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <PillarBadge id={article.category} size="md" />
          {article.difficulty && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              <BarChart2 className="w-2.5 h-2.5" /> {article.difficulty}
            </span>
          )}
          {article.reading_time && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
              <Clock className="w-2.5 h-2.5" /> {article.reading_time}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-4">
          {article.title}
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-4">{article.summary}</p>

        {/* SSB relevance pills */}
        {article.ssb_relevance?.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">SSB Relevance:</span>
            {article.ssb_relevance.map(r => (
              <span key={r} className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400 pb-6 border-b border-gray-100">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(article.published_at).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </div>
      </div>

      {/* Article body */}
      <ArticleRenderer content={article.content} />

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mt-10 pt-6 border-t border-gray-100">
          <Tag className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          {article.tags.map(tag => (
            <span key={tag} className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mt-6 pt-4 border-t border-gray-100">
        SSBCircle · For SSB GD · Lecturette · PI Prep
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      <div className="h-0.5 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CurrentAffairs() {
  const [pillar,      setPillar]      = useState('all');
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [fullArticle, setFullArticle] = useState(null);
  const [loadingFull, setLoadingFull] = useState(false);

  useEffect(() => {
    setLoading(true);
    getArticles(pillar === 'all' ? null : pillar)
      .then(d => setArticles(d))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [pillar]);

  async function openArticle(article) {
    setSelected(article);
    setFullArticle(null);
    setLoadingFull(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try { setFullArticle(await getArticle(article.id)); }
    catch { setFullArticle(article); }
    finally { setLoadingFull(false); }
  }

  function closeArticle() { setSelected(null); setFullArticle(null); }

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium hidden sm:block">Home</Link>
            <Link to="/register" className="btn-primary py-1.5 px-3 text-xs sm:px-4 sm:text-sm">Get started</Link>
          </nav>
        </div>
      </header>

      {selected ? (
        loadingFull ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <ArticleDetail article={fullArticle || selected} onBack={closeArticle} />
        )
      ) : (
        <>
          {/* Page header */}
          <section className="border-b border-gray-100 px-4 sm:px-6 py-8 sm:py-10">
            <div className="max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-600 text-[11px] font-bold px-3 py-1 rounded-full mb-4 border border-brand-100 uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" /> News Cards
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">News Cards</h1>
              <p className="text-sm text-gray-500 max-w-xl">
                Bite-sized explainers across 5 SSB pillars — read a card, understand the issue, then walk into any GD or Lecturette ready to speak.
              </p>

              {/* 5 pillar overview */}
              <div className="flex flex-wrap gap-2 mt-5">
                {PILLARS.filter(p => p.id !== 'all').map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} onClick={() => setPillar(p.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 transition-all cursor-pointer">
                      <Icon className="w-3.5 h-3.5" /> {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Pillar filter tabs — same style as room category filter */}
          <section className="border-b border-gray-100 sticky top-14 z-40 bg-white px-4 sm:px-6">
            <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide py-3">
              {PILLARS.map(p => {
                const Icon = p.icon;
                const isActive = pillar === p.id;
                return (
                  <button key={p.id} onClick={() => setPillar(p.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}>
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Articles grid */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} />)}
              </div>
            ) : articles.length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl py-16 text-center px-6">
                <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-600 mb-1">No articles yet in this category</p>
                <p className="text-xs text-gray-400">Articles will appear here as they are published.</p>
              </div>
            ) : (() => {
              const showSociety = pillar === 'all' || pillar === 'socio-cultural';
              const womenArticles = articles.filter(a => WOMEN_SLUGS.has(a.slug || a.id));
              const otherArticles = articles.filter(a => !WOMEN_SLUGS.has(a.slug || a.id));
              return (
                <div className="space-y-8">
                  {/* Society → Women series banner */}
                  {showSociety && womenArticles.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-600" />
                          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Society</span>
                        </div>
                        <div className="h-px flex-1 bg-gray-100" />
                        <span className="text-[10px] text-gray-400 font-medium">Women · 7 cards</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <WomenSeriesBanner />
                      </div>
                    </div>
                  )}

                  {/* All other articles */}
                  {otherArticles.length > 0 && (
                    <div>
                      {showSociety && womenArticles.length > 0 && (
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Other Cards</span>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {otherArticles.map(a => (
                          <ArticleCard key={a.id} article={a} onClick={() => openArticle(a)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        </>
      )}
    </div>
  );
}
