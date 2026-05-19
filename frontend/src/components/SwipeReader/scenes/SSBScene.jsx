import { useState } from 'react';

const TABS = ['GD', 'Lecturette', 'PI'];

export default function SSBScene({ scene }) {
  const { gd_line, lecturette_structure, pi_question, pi_answer, one_liner } = scene;
  const [tab, setTab] = useState('GD');

  return (
    <div className="px-5 py-4 flex flex-col gap-4 h-full overflow-y-auto">
      <div>
        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest bg-brand-50 border border-brand-100 px-2.5 py-0.5 rounded-full">
          Use this in SSB
        </span>
        <h2 className="text-lg font-semibold text-gray-900 mt-2">Apply this knowledge</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === t
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* GD */}
      {tab === 'GD' && (
        <div className="flex flex-col gap-3">
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide mb-2">Say this in GD</p>
            <p className="text-sm text-brand-700 leading-relaxed">"{gd_line}"</p>
          </div>
          <p className="text-[10px] text-gray-400 text-center">This shows analytical balance — a key Officer-Like Quality</p>
        </div>
      )}

      {/* Lecturette */}
      {tab === 'Lecturette' && (
        <div className="flex flex-col gap-2">
          {lecturette_structure.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      )}

      {/* PI */}
      {tab === 'PI' && (
        <div className="flex flex-col gap-3">
          {pi_question && (
            <p className="text-xs text-gray-400 italic border border-gray-200 bg-gray-50 rounded-lg px-3 py-2">
              Q: "{pi_question}"
            </p>
          )}
          <div className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your answer</p>
            <p className="text-sm text-gray-700 leading-relaxed">{pi_answer}</p>
          </div>
        </div>
      )}

      {/* One-liner */}
      {one_liner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 mt-auto">
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Key takeaway</p>
          <p className="text-sm text-amber-800 italic font-medium leading-relaxed">"{one_liner}"</p>
        </div>
      )}
    </div>
  );
}
