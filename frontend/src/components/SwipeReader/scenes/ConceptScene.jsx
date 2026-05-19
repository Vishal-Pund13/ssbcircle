import { useState } from 'react';
import '../SwipeReader.css';

const SENTIMENT_STYLES = {
  positive: 'text-brand-600 bg-brand-50 border-brand-100',
  neutral:  'text-gray-600  bg-gray-50  border-gray-200',
  caution:  'text-gray-500  bg-gray-100 border-gray-200',
  negative: 'text-gray-700  bg-gray-100 border-gray-300',
};

function SliderVisual({ data }) {
  const [value, setValue] = useState(data.default);

  const zone = data.zones.find(z => value >= z.range[0] && value <= z.range[1]) || data.zones[0];
  const pct  = ((value - data.min) / (data.max - data.min)) * 100;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{data.label}</p>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{data.unit}{value}</span>
      </div>

      <input
        type="range"
        min={data.min}
        max={data.max}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="swipe-slider"
        style={{ background: `linear-gradient(to right, #1e3a5f ${pct}%, #e0e7ff ${pct}%)` }}
      />

      <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
        <span>{data.unit}{data.min}</span>
        <span>{data.unit}{data.max}</span>
      </div>

      <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 ${SENTIMENT_STYLES[zone.sentiment]}`}>
        <span className="text-xs font-bold mt-0.5">◆</span>
        <p className="text-xs leading-relaxed font-medium">{zone.label}</p>
      </div>
    </div>
  );
}

export default function ConceptScene({ scene }) {
  const { title, body, analogy, visual } = scene;

  return (
    <div className="px-5 py-5 flex flex-col gap-5">
      <h2 className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>

      {analogy && (
        <div className="border-l-2 border-brand-600 bg-brand-50 pl-4 py-3 rounded-r-xl">
          <p className="text-[10px] text-brand-600 font-bold uppercase tracking-widest mb-1">Analogy</p>
          <p className="text-sm text-brand-700 italic leading-relaxed">{analogy}</p>
        </div>
      )}

      {visual?.type === 'slider' && <SliderVisual data={visual.data} />}
    </div>
  );
}
