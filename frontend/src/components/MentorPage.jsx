import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';
import { Shield, Award, GraduationCap, ArrowLeft, ExternalLink, Calendar, ChevronRight, Star, Users } from 'lucide-react';
import { MENTORS } from '../data/mentors';

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

        {/* ── Hero card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
          <div className="h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-brand-600" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-md select-none">
                  {mentor.avatarInitials}
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white bg-sky-600 tracking-wide">
                  {mentor.serviceTag}
                </span>
                {mentor.isActive && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Mentor
                  </span>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{mentor.name}</h1>
                    <p className="text-sm text-gray-500 mt-1">{mentor.rank} · {mentor.branch} · {mentor.dept}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-full">
                    <Shield className="w-3.5 h-3.5" /> Verified Officer
                  </div>
                </div>

                {/* Service stats row */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                    <Award className="w-3.5 h-3.5 text-sky-400" /> {mentor.yearsOfService} of service
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                    <Shield className="w-3.5 h-3.5 text-brand-400" /> Commissioned Officer
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" /> SSB Specialist
                  </span>
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

        {/* ── Video ── */}
        {mentor.videoId && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Watch a past interaction</h2>
              <a href={mentor.videoUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors">
                Open on YouTube <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            {/* Responsive 16:9 embed */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${mentor.videoId}`}
                title={`${mentor.name} — past interaction`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* ── TopMate booking ── */}
        {mentor.topMateUrl && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Book a 1:1 session</h2>
            <div className="bg-brand-600 rounded-2xl overflow-hidden">
              {/* Subtle dot pattern */}
              <div className="relative px-6 py-6 sm:px-8 sm:py-7"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-300" />
                      <span className="text-[11px] font-bold text-brand-100 uppercase tracking-widest">TopMate · 1:1 Mentoring</span>
                    </div>
                    <p className="text-white font-bold text-base sm:text-lg leading-snug mb-1">
                      Personal mentoring with {mentor.name}
                    </p>
                    <p className="text-brand-100 text-xs leading-relaxed">
                      Get focused guidance on GD, Lecturette, Personal Interview, or Psychology Test — directly from a serving IAF officer.
                    </p>
                  </div>
                  <a href={mentor.topMateUrl} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-2 bg-white text-brand-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors whitespace-nowrap">
                    Book on TopMate <ExternalLink className="w-3.5 h-3.5" />
                  </a>
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
    </div>
  );
}
