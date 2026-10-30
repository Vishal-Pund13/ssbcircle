import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, FileText, PenLine } from 'lucide-react';
import SiteNav from './SiteNav';
import { CoverBand, PageHead } from './PageCover';
import { TOOL_INTROS } from '../data/toolIntros';

// The public face of a sign-in-only tool. Signed-out visitors used to be sent
// straight to the login page, so Google only ever saw a login form at /piq and
// /tat. Now they get what the tool does and how, with one way in.

const LOOK = {
  piq: { icon: FileText },
  tat: { icon: PenLine },
};

export default function ToolIntro({ tool }) {
  const location = useLocation();
  const t = TOOL_INTROS[tool];
  const { icon } = LOOK[tool];

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav />
      <CoverBand scene={tool} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 space-y-6">
        <PageHead icon={icon} eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle}>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to="/login" state={{ from: location }} className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2">
              {t.cta} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/register" className="text-sm font-semibold text-brand-700 hover:underline">New here? Create an account</Link>
          </div>
        </PageHead>

        <section aria-labelledby="how" className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6">
          <h2 id="how" className="text-base font-bold text-gray-900">How it works</h2>
          <ol className="mt-4 grid sm:grid-cols-3 gap-4">
            {t.steps.map((s, i) => (
              <li key={s.title}>
                <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <p className="mt-2 text-sm font-bold text-gray-900">{s.title}</p>
                <p className="mt-0.5 text-sm text-gray-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            {t.points.map(p => (
              <li key={p} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {p}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="text-base font-bold text-gray-900">Questions people ask</h2>
          <div className="mt-3 space-y-3">
            {t.faq.map(f => (
              <div key={f.q} className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
                <h3 className="text-sm font-bold text-gray-900">{f.q}</h3>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
