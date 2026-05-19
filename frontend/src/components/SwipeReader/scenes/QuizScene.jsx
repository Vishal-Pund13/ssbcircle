import { useState, useEffect } from 'react';
import { voteArticle } from '../../../services/api';

function StarRating({ articleId }) {
  const storageKey  = `nc_vote_${articleId}`;
  const [hover,     setHover]     = useState(0);
  const [selected,  setSelected]  = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [voteCount, setVoteCount] = useState(null);
  const [avgRating, setAvgRating] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { value, count, avg } = JSON.parse(saved);
      setSelected(value);
      setSubmitted(true);
      setVoteCount(count);
      setAvgRating(avg);
    }
  }, [storageKey]);

  async function submit(value) {
    if (submitted) return;
    setSelected(value);
    setSubmitted(true);
    try {
      const res = await voteArticle(articleId, value);
      setVoteCount(res.vote_count);
      setAvgRating(res.avg_rating);
      localStorage.setItem(storageKey, JSON.stringify({
        value, count: res.vote_count, avg: res.avg_rating,
      }));
    } catch {
      // Offline / anonymous — just save locally
      localStorage.setItem(storageKey, JSON.stringify({ value, count: null, avg: null }));
    }
  }

  const active = submitted ? selected : hover;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-xs font-semibold text-gray-500">
        {submitted ? 'Your rating' : 'Rate this card'}
      </p>

      {/* Stars */}
      <div className="flex items-center gap-1"
        onMouseLeave={() => !submitted && setHover(0)}>
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            disabled={submitted}
            onClick={() => submit(s)}
            onMouseEnter={() => !submitted && setHover(s)}
            className={`transition-all duration-100 ${submitted ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          >
            <svg className={`w-7 h-7 transition-colors ${s <= active ? 'text-brand-600' : 'text-gray-200'}`}
              viewBox="0 0 24 24" fill={s <= active ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>

      {/* Feedback */}
      {submitted && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-bold text-brand-600">
            {selected >= 4 ? 'Thanks! Glad it helped.' : selected === 3 ? 'Thanks for the feedback.' : 'Thanks — we\'ll improve it.'}
          </p>
          {voteCount && voteCount > 1 && (
            <p className="text-[10px] text-gray-400">
              {avgRating}★ average · {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuizScene({ scene, article, onClose }) {
  const { title, questions } = scene;
  const [answers, setAnswers] = useState({});
  const [done,    setDone]    = useState(false);

  function pick(qi, oi) {
    if (answers[qi] !== undefined) return;
    const next = { ...answers, [qi]: oi };
    setAnswers(next);
    if (Object.keys(next).length === questions.length) {
      setTimeout(() => setDone(true), 800);
    }
  }

  if (done) {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-8 text-center gap-6">
        {/* Score */}
        <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">You got</p>
          <p className="text-4xl font-extrabold text-gray-900">{correct}/{questions.length}</p>
          <p className="text-sm font-semibold text-brand-600 mt-2">
            {correct === questions.length ? 'Perfect! SSB-ready on this topic.' : 'Good effort — review and retry.'}
          </p>
        </div>

        {/* Vote */}
        <div className="w-full max-w-xs bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
          <StarRating articleId={article.id} />
        </div>

        {/* CTA */}
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 w-full max-w-xs">
          <p className="text-xs text-gray-500 leading-relaxed">
            Now practice using this in a live GD room on SSBCircle to build fluency under pressure.
          </p>
        </div>

        {/* Exit button — prominent, easy to find */}
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to News Cards
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 py-5 flex flex-col gap-5">
      {/* Gentle suggestion — not forced */}
      <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <div>
          <p className="text-xs font-bold text-brand-700 mb-0.5">Quick self-check</p>
          <p className="text-[11px] text-brand-600 leading-relaxed">We suggest trying these 2 questions — takes 30 seconds and helps things stick. No pressure though.</p>
        </div>
      </div>

      <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full w-fit">
        {title}
      </span>

      {questions.map((q, qi) => {
        const answered = answers[qi] !== undefined;
        return (
          <div key={qi} className="flex flex-col gap-2.5">
            <p className="text-sm font-semibold text-gray-900 leading-snug">{q.q}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                let cls = 'border-gray-200 bg-white text-gray-700 hover:border-brand-600/30 hover:bg-brand-50';
                if (answered) {
                  if (oi === q.correct)        cls = 'border-brand-600 bg-brand-50 text-brand-700';
                  else if (oi === answers[qi]) cls = 'border-gray-400 bg-gray-100 text-gray-500 line-through';
                  else                         cls = 'border-gray-100 bg-gray-50 text-gray-400';
                }
                return (
                  <button key={oi} onClick={() => pick(qi, oi)}
                    className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
