import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, TrendingUp, Landmark, Map, Users, ArrowLeft, Calendar, Tag, ChevronRight, BookOpen, Clock, BarChart2 } from 'lucide-react';
import { getArticles, getArticle } from '../services/api';
import ArticleRenderer from './ArticleRenderer';

const PILLARS = [
  { id: 'all',            label: 'All',                icon: null },
  { id: 'defence',        label: 'Defence & Security', icon: Shield     },
  { id: 'economic',       label: 'Economic',           icon: TrendingUp },
  { id: 'polity',         label: 'Polity',             icon: Landmark   },
  { id: 'geographic',     label: 'Geographic',         icon: Map        },
  { id: 'socio-cultural', label: 'Socio-Cultural',     icon: Users      },
];

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
const SWIPE_ARTICLES = { 'rupee-depreciation': true };

// Article card — same pattern as RoomCard in LandingPage
function ArticleCard({ article, onClick }) {
  const navigate = useNavigate();
  const swipeKey = article.slug || article.id;
  const hasSwipe = SWIPE_ARTICLES[swipeKey];
  return (
    <div onClick={onClick}
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
          <div className="flex items-center gap-2 shrink-0">
            {hasSwipe && (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/read/${swipeKey}`); }}
                className="flex items-center gap-1 text-[11px] font-bold text-white bg-brand-600 hover:bg-brand-700 px-2.5 py-1 rounded-full transition-all animate-bounce-slow">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                </svg>
                Cards
              </button>
            )}
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 shrink-0">
              Read <ChevronRight className="w-3 h-3" />
            </span>
          </div>
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
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map(a => (
                  <ArticleCard key={a.id} article={a} onClick={() => openArticle(a)} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
