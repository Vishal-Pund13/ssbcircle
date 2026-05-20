// Inline SVG data visualizations for the Women in India series cards.
// Each component is self-contained — no external library needed.

export function FlfprChart() {
  const bars = [
    { year: '2017-18', pct: 23.3, note: 'Crisis low', type: 'bad' },
    { year: '2019-20', pct: 30.0, note: 'Recovery start', type: 'neutral' },
    { year: '2021-22', pct: 37.0, note: 'Post-COVID rise', type: 'neutral' },
    { year: '2023-24', pct: 41.7, note: 'Mostly unpaid work', type: 'caution' },
    { year: 'Target',  pct: 55.0, note: '2050 goal', type: 'good' },
  ];
  const max = 60;
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Female Labour Force Participation — India
      </p>
      <div className="space-y-2">
        {bars.map((b) => {
          const w = `${(b.pct / max) * 100}%`;
          const color = b.type === 'bad' ? '#ef4444' : b.type === 'good' ? '#1e3a5f' : b.type === 'caution' ? '#f59e0b' : '#6b7280';
          return (
            <div key={b.year}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold text-gray-600 w-16 shrink-0">{b.year}</span>
                <span className="text-[9px] text-gray-400 hidden sm:block">{b.note}</span>
                <span className="text-xs font-bold shrink-0" style={{ color }}>{b.pct}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: w, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-amber-600 font-semibold mt-3">
        ⚠ 2023-24 rise is largely unpaid agricultural work — not formal employment
      </p>
    </div>
  );
}

export function CorporatePipelineChart() {
  const levels = [
    { label: 'Entry Level',   women: 33, men: 67 },
    { label: 'Manager',       women: 26, men: 74 },
    { label: 'Senior Manager',women: 20, men: 80 },
    { label: 'VP / Director', women: 16, men: 84 },
    { label: 'C-Suite',       women: 17, men: 83 },
  ];
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Corporate Pipeline — Women vs Men
      </p>
      <div className="space-y-2.5">
        {levels.map((l) => (
          <div key={l.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-gray-600">{l.label}</span>
              <span className="text-[10px] font-bold text-brand-600">{l.women}% women</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
              <div className="h-full bg-brand-600 rounded-l-full" style={{ width: `${l.women}%` }} />
              <div className="h-full bg-gray-300 flex-1" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="flex items-center gap-1 text-[9px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shrink-0"/> Women
        </span>
        <span className="flex items-center gap-1 text-[9px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0"/> Men
        </span>
        <span className="text-[9px] text-red-500 font-semibold ml-auto">↓ Broken rung at first promotion</span>
      </div>
    </div>
  );
}

export function PayGapChart() {
  const data = [
    { label: 'Urban Men',   amount: 26105, bar: 100, color: '#6b7280' },
    { label: 'Urban Women', amount: 19879, bar: 76,  color: '#1e3a5f' },
  ];
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Monthly Earnings — Urban India (PLFS 2024)
      </p>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-gray-600">{d.label}</span>
              <span className="text-sm font-bold" style={{ color: d.color }}>₹{d.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${d.bar}%`, background: d.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg px-3 py-2">
        <span className="text-[10px] text-red-700 font-semibold">Monthly gap</span>
        <span className="text-sm font-extrabold text-red-600">−₹6,226</span>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        IIT Kharagpur 2025: 30.51% unexplained gap even in same role, same firm
      </p>
    </div>
  );
}

export function SafetyBarriersChart() {
  const bars = [
    { label: 'Commuting fear',   pct: 31, color: '#dc2626' },
    { label: 'Domestic duties',  pct: 19, color: '#f59e0b' },
    { label: 'Childcare',        pct: 13, color: '#f59e0b' },
    { label: 'Other barriers',   pct: 37, color: '#6b7280' },
  ];
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Why Women Don't Work — Barriers Cited (World Bank 2021)
      </p>
      <div className="space-y-2">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-semibold text-gray-600">{b.label}</span>
              <span className="text-xs font-bold" style={{ color: b.color }}>{b.pct}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-red-600 font-semibold mt-3">
        Safety infrastructure = economic infrastructure
      </p>
    </div>
  );
}

export function EducationFunnelChart() {
  const stages = [
    { label: 'Primary enrolment', pct: 97, color: '#1e3a5f' },
    { label: 'Secondary enrolment', pct: 79, color: '#1e3a5f' },
    { label: 'Higher secondary', pct: 57, color: '#f59e0b' },
    { label: 'Graduation', pct: 48, color: '#f59e0b' },
    { label: 'STEM graduation', pct: 43, color: '#dc2626' },
    { label: 'STEM employment', pct: 27, color: '#dc2626' },
  ];
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Women's Education–Employment Pipeline
      </p>
      <div className="space-y-1.5">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-gray-500 w-28 shrink-0 text-right">{s.label}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
            </div>
            <span className="text-[10px] font-bold shrink-0" style={{ color: s.color }}>{s.pct}%</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-red-600 font-semibold mt-2.5">
        16-point loss: 43% STEM grads → only 27% in STEM workforce
      </p>
    </div>
  );
}

export function HealthDashboard() {
  const metrics = [
    { value: '97',  unit: '/lakh births', label: 'Maternal Mortality Rate', sub: 'Down from 254 in 2004', color: '#1e3a5f', good: true },
    { value: '57%', unit: '',             label: 'Women are anaemic',        sub: 'Up from 53% — worsening', color: '#dc2626', good: false },
    { value: '919', unit: '/1000 boys',   label: 'Child sex ratio (0-6 yrs)', sub: 'Census 2011 — still skewed', color: '#f59e0b', good: false },
    { value: '63M', unit: '',             label: 'Missing women',            sub: 'Amartya Sen — gender bias', color: '#dc2626', good: false },
  ];
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        Women's Health — India At a Glance
      </p>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white border rounded-xl p-2.5"
            style={{ borderColor: m.good ? '#bfdbfe' : '#fecaca' }}>
            <div className="flex items-start justify-between mb-0.5">
              <span className="text-lg font-extrabold leading-none" style={{ color: m.color }}>{m.value}</span>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${m.good ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'}`}>
                {m.good ? '↑ Better' : '⚠ Crisis'}
              </span>
            </div>
            {m.unit && <p className="text-[8px] text-gray-400">{m.unit}</p>}
            <p className="text-[9px] font-semibold text-gray-700 mt-1 leading-tight">{m.label}</p>
            <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">{m.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProxyGapChart() {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        The Panchayat Gap — Election vs Reality
      </p>
      <div className="flex items-end gap-4 justify-center mb-3">
        {/* Elected bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-extrabold text-brand-600">46.6%</span>
          <div className="w-14 bg-brand-600 rounded-t-lg" style={{ height: '80px' }} />
          <span className="text-[10px] font-semibold text-gray-600 text-center w-16">Elected to panchayats</span>
        </div>
        {/* Effective power bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-extrabold text-red-500">~20%</span>
          <div className="w-14 bg-red-300 rounded-t-lg" style={{ height: '35px' }} />
          <span className="text-[10px] font-semibold text-gray-600 text-center w-16">With real governing power</span>
        </div>
      </div>
      <p className="text-[10px] text-center text-gray-500">
        The gap = Sarpanch Pati phenomenon. Title without power.
      </p>
    </div>
  );
}
