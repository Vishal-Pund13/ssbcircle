import { useState } from 'react';
import '../SwipeReader.css';

function SliderVisual({ data }) {
  const [value, setValue] = useState(data.default);

  function getZone() {
    return data.zones.find(z => value >= z.range[0] && value <= z.range[1]) || data.zones[0];
  }

  const zone = getZone();
  const pct  = ((value - data.min) / (data.max - data.min)) * 100;

  const sentimentColor = {
    positive: 'text-emerald-600',
    neutral:  'text-gray-500',
    caution:  'text-amber-600',
    negative: 'text-red-500',
  };

  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{data.label}</p>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{data.unit}{value}</span>
      </div>

      <input
        type="range"
        min={data.min}
        max={data.max}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        className="swipe-slider"
        style={{
          background: `linear-gradient(to right, #1e3a5f ${pct}%, #e0e7ff ${pct}%)`
        }}
      />

      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{data.unit}{data.min}</span>
        <span>{data.unit}{data.max}</span>
      </div>

      {/* Zone indicator */}
      <div className="mt-3 flex items-start gap-2 bg-white rounded-lg border border-brand-100 px-3 py-2">
        <span className={`text-xs font-bold mt-0.5 ${sentimentColor[zone.sentiment]}`}>◆</span>
        <p className={`text-xs leading-relaxed font-medium ${sentimentColor[zone.sentiment]}`}>{zone.label}</p>
      </div>
    </div>
  );
}

export default function ConceptScene({ scene }) {
  const { title, body, analogy, visual } = scene;

  return (
    <div className="px-5 py-4 flex flex-col gap-4 h-full overflow-y-auto">
      <h2 className="text-lg font-semibold text-gray-900 leading-snug">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{body}</p>

      {/* Analogy */}
      {analogy && (
        <div className="border-l-2 border-brand-600 bg-brand-50 pl-3 py-2 rounded-r-lg">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Analogy</p>
          <p className="text-sm text-brand-700 italic leading-relaxed">{analogy}</p>
        </div>
      )}

      {/* Visual */}
      {visual?.type === 'slider' && <SliderVisual data={visual.data} />}
    </div>
  );
}
