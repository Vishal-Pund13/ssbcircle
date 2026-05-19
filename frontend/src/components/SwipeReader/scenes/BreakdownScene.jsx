import { useState } from 'react';

export default function BreakdownScene({ scene }) {
  const { title, intro, items } = scene;
  const [open, setOpen] = useState(null);

  return (
    <div className="px-5 py-5 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{intro}</p>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <button
              key={i}
              onClick={() => setOpen(isOpen ? null : i)}
              className={`w-full text-left rounded-xl border transition-all duration-200 ${
                isOpen ? 'border-brand-600/30 bg-brand-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm shrink-0">
                  {item.icon}
                </span>
                <span className={`text-sm font-medium flex-1 text-left ${isOpen ? 'text-brand-700' : 'text-gray-900'}`}>
                  {item.title}
                </span>
                {item.stat && !isOpen && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 shrink-0 hidden sm:block font-medium">
                    {item.stat}
                  </span>
                )}
                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {isOpen && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.detail}</p>
                  {item.stat && (
                    <span className="inline-block mt-2 text-[11px] bg-brand-100 text-brand-600 rounded-full px-3 py-0.5 font-semibold">
                      {item.stat}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
