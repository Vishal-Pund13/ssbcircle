import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, BadgeCheck, ChevronRight } from 'lucide-react';
import { MENTORS } from '../data/mentors';
import MentorConnectModal from './MentorConnectModal';
import { trackEvent } from '../analytics';

// "Talk to a real officer" — shown where an aspirant most wants a human to
// look at their work: after a PIQ report, after TAT feedback, on the Prep
// Sheet, in SSB tips articles. Opens the WhatsApp introduction directly.
//
// source names the spot, so the admin's mentor referrals show which
// placements actually send aspirants to a mentor.

export default function MentorNudge({ source, title, text, className = '' }) {
  const mentor = MENTORS.find(m => m.isActive && m.whatsapp);
  const [open, setOpen] = useState(false);
  if (!mentor) return null;
  const firstName = mentor.name.split(' ').slice(0, -1).join(' ') || mentor.name;

  return (
    <section className={`rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 sm:p-5 ${className}`}>
      <div className="flex items-start gap-3.5">
        {mentor.photoAvatar
          ? <img src={mentor.photoAvatar} alt="" className="w-12 h-12 rounded-full object-cover object-top ring-2 ring-white shadow-sm shrink-0" />
          : <span className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">{mentor.avatarInitials}</span>}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-gray-900 leading-snug">{title}</p>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{text}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <BadgeCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate"><span className="font-semibold text-gray-700">{mentor.name}</span> · {mentor.yearsOfService} in the {mentor.branch}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" onClick={() => { setOpen(true); trackEvent('mentor_nudge_open', { source }); }}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl cursor-pointer">
              <MessageCircle className="w-4 h-4" /> Talk to {firstName}
            </button>
            <Link to={`/mentor/${mentor.slug}`} className="inline-flex items-center gap-0.5 text-sm font-semibold text-emerald-800 hover:underline">
              View profile <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
      {open && <MentorConnectModal mentor={mentor} source={source} onClose={() => setOpen(false)} />}
    </section>
  );
}
