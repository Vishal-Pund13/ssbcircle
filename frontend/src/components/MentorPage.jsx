import { useState } from 'react';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Shield, Award, GraduationCap, ArrowLeft, ExternalLink, Calendar, ChevronRight, ChevronLeft, Star, Users, MessageCircle, Quote, X } from 'lucide-react';
import { MENTORS } from '../data/mentors';
import MentorConnectModal from './MentorConnectModal';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
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

export default function MentorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const mentor = MENTORS.find(m => m.slug === slug);
  const [showConnect, setShowConnect] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!mentor) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/"><Logo /></Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium hidden sm:block">Home</Link>
            <Link to="/current-affairs" className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2 font-medium hidden sm:block">News Cards</Link>
            <Link to="/register" className="btn-primary py-1.5 px-3 text-xs sm:px-4 sm:text-sm">Get started</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Back link ── */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 cursor-pointer transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* ── Hero photo banner ── */}
        <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-sm mb-8">
          <div className="relative w-full h-[320px] sm:h-[420px] bg-gray-100">
            {mentor.photo ? (
              <img src={mentor.photo} alt={mentor.name}
                className="absolute inset-0 w-full h-full object-cover object-top" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-600 text-white text-6xl font-bold select-none">
                {mentor.avatarInitials}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            {mentor.isActive && (
              <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[11px] font-semibold text-white bg-emerald-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Active Mentor
              </span>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight drop-shadow-sm">{mentor.name}</h1>
              <p className="text-sm sm:text-base text-white/80 mt-1">{mentor.tagline}</p>
            </div>
          </div>

          {/* Info strip */}
          <div className="bg-white p-5 sm:p-8">
            <div className="flex items-start justify-end gap-3 mb-4">
              <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-full">
                <Shield className="w-3.5 h-3.5" /> Verified Officer
              </div>
            </div>

            {/* Service stats row */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                <Award className="w-3.5 h-3.5 text-sky-400" /> {mentor.yearsOfService} of service
              </span>
              {mentor.roleTags?.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> {tag}
                </span>
              ))}
            </div>

            {/* Specialty chips */}
            <div className="flex flex-wrap gap-1.5">
              {mentor.specialties.map(tag => (
                <span key={tag} className="text-[11px] font-semibold text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
          <div className="space-y-4">
            {mentor.fullBio.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>
            ))}
          </div>
        </section>

        {/* ── Pull quote ── */}
        {mentor.quote && (
          <section className="mb-8">
            <div className="relative rounded-2xl bg-brand-50 border border-brand-100 px-6 py-7 sm:px-10 sm:py-9 overflow-hidden">
              <Quote className="absolute -top-2 left-4 w-14 h-14 text-brand-100 rotate-180" fill="currentColor" strokeWidth={0} />
              <p className="relative text-base sm:text-lg font-semibold text-brand-800 leading-snug text-center max-w-xl mx-auto">
                "{mentor.quote}"
              </p>
              <p className="relative text-xs font-semibold text-brand-400 text-center mt-3">— {mentor.name}</p>
            </div>
          </section>
        )}

        {/* ── Testimonials ── */}
        {mentor.testimonialScreenshots?.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">What Aspirants Say</h2>
              <span className="text-[11px] text-gray-300">Scroll for more →</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {mentor.testimonialScreenshots.map((src, i) => (
                <button key={src} type="button" onClick={() => setLightboxIndex(i)}
                  className="shrink-0 w-32 sm:w-36 rounded-xl overflow-hidden border border-gray-100 hover:border-brand-200 transition-colors cursor-pointer">
                  <img src={src} alt={`Feedback screenshot ${i + 1}`} className="w-full h-44 sm:h-48 object-cover" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Videos ── */}
        {mentor.videos?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Watch a past interaction</h2>
            <div className={`grid grid-cols-1 ${mentor.videos.length > 1 ? 'sm:grid-cols-2' : ''} gap-4`}>
              {mentor.videos.map(video => (
                <div key={video.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">{video.label}</span>
                    <a href={video.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand-600 transition-colors">
                      YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  {/* Responsive 16:9 embed */}
                  <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ paddingTop: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.id}`}
                      title={`${mentor.name} — ${video.label}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── WhatsApp connect / booking ── */}
        {mentor.whatsapp && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Connect with {mentor.name.split(' ').slice(0, -1).join(' ') || mentor.name}</h2>
            <div className="bg-brand-600 rounded-2xl overflow-hidden">
              {/* Subtle dot pattern */}
              <div className="relative px-6 py-6 sm:px-8 sm:py-7"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-amber-300" />
                      <span className="text-[11px] font-bold text-brand-100 uppercase tracking-widest">WhatsApp · 1:1 Mentoring</span>
                    </div>
                    <p className="text-white font-bold text-base sm:text-lg leading-snug mb-1">
                      Message {mentor.name} directly
                    </p>
                    <p className="text-brand-100 text-xs leading-relaxed">
                      {mentor.availableFrom
                        ? `Appointments open from ${formatDate(mentor.availableFrom)} — reach out on WhatsApp to book a slot.`
                        : 'Reach out on WhatsApp to book a slot.'}
                    </p>
                  </div>
                  <button onClick={() => setShowConnect(true)}
                    className="shrink-0 flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors whitespace-nowrap cursor-pointer">
                    Message on WhatsApp <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Sessions on SSBCircle ── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Sessions on SSBCircle</h2>
          <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {mentor.name} hosts live group sessions on SSBCircle
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Group GD practice, Lecturette rounds, and feedback sessions — open to all aspirants
              </p>
            </div>
            <Link to="/?tab=upcoming"
              className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-brand-600 bg-brand-50 border border-brand-100 hover:bg-brand-100 px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap">
              View Upcoming <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ── Footer note ── */}
        <p className="text-[11px] text-gray-300 text-center pb-4">
          SSBCircle · Mentors Programme · Verified serving &amp; retired officers
        </p>
      </div>

      {showConnect && <MentorConnectModal mentor={mentor} onClose={() => setShowConnect(false)} />}

      {lightboxIndex !== null && mentor.testimonialScreenshots && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer">
            <X className="w-7 h-7" />
          </button>

          {mentor.testimonialScreenshots.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + mentor.testimonialScreenshots.length) % mentor.testimonialScreenshots.length); }}
              className="absolute left-2 sm:left-6 text-white/70 hover:text-white transition-colors cursor-pointer p-2">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <img src={mentor.testimonialScreenshots[lightboxIndex]} alt={`Feedback screenshot ${lightboxIndex + 1}`}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[85vh] rounded-xl object-contain" />

          {mentor.testimonialScreenshots.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % mentor.testimonialScreenshots.length); }}
              className="absolute right-2 sm:right-6 text-white/70 hover:text-white transition-colors cursor-pointer p-2">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <span className="absolute bottom-4 text-white/50 text-xs">
            {lightboxIndex + 1} / {mentor.testimonialScreenshots.length}
          </span>
        </div>
      )}
    </div>
  );
}
