import { useState } from 'react';

export default function QuizScene({ scene, article }) {
  const { title, questions } = scene;
  const [answers,   setAnswers]   = useState({});
  const [done,      setDone]      = useState(false);

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
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-5">
        <div className="w-14 h-14 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">You got</p>
          <p className="text-3xl font-extrabold text-gray-900">{correct}/{questions.length}</p>
          <p className="text-sm font-semibold text-brand-600 mt-1">
            {correct === questions.length ? 'Perfect! SSB-ready on this topic.' : 'Good effort — review the article and retry.'}
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 w-full">
          <p className="text-xs text-gray-500 leading-relaxed">
            Now practice using this in a live GD room on SSBCircle to build fluency under pressure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4 h-full overflow-y-auto">
      <div>
        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full">
          {title}
        </span>
      </div>

      {questions.map((q, qi) => {
        const answered = answers[qi] !== undefined;
        return (
          <div key={qi} className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-900 leading-snug">{q.q}</p>
            <div className="flex flex-col gap-1.5">
              {q.options.map((opt, oi) => {
                let cls = 'border-gray-200 bg-white text-gray-700 hover:border-brand-600/30';
                if (answered) {
                  if (oi === q.correct)  cls = 'border-emerald-500 bg-emerald-50 text-emerald-700';
                  else if (oi === answers[qi]) cls = 'border-red-400 bg-red-50 text-red-600';
                  else cls = 'border-gray-100 bg-gray-50 text-gray-400';
                }
                return (
                  <button key={oi} onClick={() => pick(qi, oi)}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg border transition-all ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <p className="text-[10px] text-gray-600 leading-relaxed">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
