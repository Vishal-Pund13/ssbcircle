// Inline infographics — SSBCircle design: brand-600 navy + brand-50 light blue + gray only

function Label({ children, sub }) {
  return (
    <div className="text-center">
      <p className="text-xs font-bold text-gray-900">{children}</p>
      {sub && <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{sub}</p>}
    </div>
  );
}

function InfographicWrapper({ title, children }) {
  return (
    <div className="my-6 rounded-2xl border border-brand-100 bg-brand-50 p-5 sm:p-6">
      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-5 text-center">{title}</p>
      {children}
    </div>
  );
}

// 1 — How exchange rates work
export function Infographic1() {
  return (
    <InfographicWrapper title="How Exchange Rates Work">
      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-5">
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-2xl font-bold shadow-sm">₹</div>
          <Label>Indian Rupee</Label>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M12 5v14M5 16l7 6 7-6"/></svg>
            Falls in value
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-gray-300">
          <div className="w-px h-8 bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400">VS</span>
          <div className="w-px h-8 bg-gray-200" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-white border-2 border-brand-200 text-brand-600 flex items-center justify-center text-2xl font-bold">$</div>
          <Label>US Dollar</Label>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-600">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" d="M12 19V5M5 8l7-6 7 6"/></svg>
            Rises in demand
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-brand-100 px-4 py-3 text-center">
        <p className="text-xs text-gray-600 leading-relaxed">
          More people want <span className="font-bold text-brand-600">$</span> → dollar price rises → you need <span className="font-bold text-gray-900">more ₹</span> to buy the same dollar → <span className="font-bold text-gray-900">rupee depreciates</span>
        </p>
      </div>
    </InfographicWrapper>
  );
}

// 2 — India's currency timeline
export function Infographic2() {
  const steps = [
    { year: '1947', title: 'Fixed Rate', desc: 'Govt set the rate — ₹4.76 per dollar. No market role.' },
    { year: '1991', title: 'BOP Crisis', desc: 'India ran out of dollars. Gold pledged to IMF to survive.' },
    { year: '1992', title: 'Managed Float', desc: 'Market sets rate. RBI intervenes only to prevent panic.' },
  ];
  return (
    <InfographicWrapper title="India's Currency System — Timeline">
      <div className="relative">
        <div className="absolute top-4 left-8 right-8 h-px bg-brand-200 hidden sm:block" />
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 sm:justify-between relative z-10">
          {steps.map((s, i) => (
            <div key={i} className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 sm:flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm ${
                i === 1 ? 'bg-gray-400' : 'bg-brand-600'
              }`}>
                {i + 1}
              </div>
              <div className="sm:text-center sm:px-2">
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">{s.year}</p>
                <p className="text-xs font-bold text-gray-900 mb-1">{s.title}</p>
                <p className="text-[10px] text-gray-500 leading-snug max-w-[130px]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InfographicWrapper>
  );
}

// 3 — Trade deficit
export function Infographic3() {
  return (
    <InfographicWrapper title="India's Trade Gap — FY26">
      <div className="flex items-end gap-3 sm:gap-6 justify-center mb-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Imports</p>
          <div className="w-20 sm:w-28 bg-gray-200 rounded-t-xl flex items-end justify-center" style={{ height: '90px' }}>
            <div className="w-full bg-brand-200 rounded-t-xl flex items-center justify-center" style={{ height: '90px' }}>
              <div className="text-center">
                <p className="text-sm sm:text-base font-bold text-brand-700">$800B+</p>
                <p className="text-[9px] text-brand-500">Oil · Gold · Electronics</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Exports</p>
          <div className="w-20 sm:w-28 flex flex-col items-end">
            <div className="w-full bg-brand-600 rounded-t-xl flex items-center justify-center" style={{ height: '70px' }}>
              <div className="text-center">
                <p className="text-sm sm:text-base font-bold text-white">$778B+</p>
                <p className="text-[9px] text-brand-200">IT · Textiles · Pharma</p>
              </div>
            </div>
            <div className="w-full" style={{ height: '20px' }} />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-brand-100 px-4 py-2.5 text-center">
        <p className="text-xs font-bold text-gray-700">Gap = Trade Deficit → More dollars leaving India than entering → <span className="text-brand-600">Rupee under pressure</span></p>
      </div>
    </InfographicWrapper>
  );
}

// 4 — FPI outflow (uses the same step-flow pattern as the FAQ section)
export function Infographic4() {
  const steps = [
    'FPIs sell Indian stocks',
    'Receive rupees',
    'Convert rupees → dollars',
    'Dollars exit India',
  ];
  return (
    <InfographicWrapper title="How FPI Outflow Weakens the Rupee">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 bg-white border border-brand-100 rounded-lg px-2.5 py-1.5">
              <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-xs text-gray-700 font-medium">{step}</span>
            </div>
            {i < steps.length - 1 && (
              <svg className="w-3 h-3 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-center text-gray-400 mt-3">₹1.48 lakh crore pulled out by FPIs from Indian markets in 2025</p>
    </InfographicWrapper>
  );
}

// 5 — Winners and losers (clean two-column, no red/green)
export function Infographic5() {
  const hurt = [
    { label: 'Oil & gas importers', why: 'Same oil, more rupees to pay' },
    { label: 'Students abroad', why: 'Dollar tuition fees rise' },
    { label: 'Common household', why: 'Petrol, electronics, medicines cost more' },
  ];
  const benefit = [
    { label: 'IT & software firms', why: 'Earn $, pay salaries in ₹ = more profit' },
    { label: 'Textile exporters', why: 'Indian goods cheaper for global buyers' },
    { label: 'NRIs sending money', why: 'Their $ buys more ₹ for family' },
  ];
  return (
    <div className="my-6 rounded-2xl border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        <div className="p-4 sm:p-5 bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Hurt by weak rupee</p>
          <div className="space-y-3">
            {hurt.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-800">{l.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{l.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-5 bg-brand-50">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3 text-center">Benefit from weak rupee</p>
          <div className="space-y-3">
            {benefit.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-800">{w.label}</p>
                  <p className="text-[10px] text-gray-500 leading-tight">{w.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white border-t border-gray-100 px-4 py-2.5 text-center">
        <p className="text-[10px] text-gray-500 font-medium">A falling rupee is a double-edged sword — it depends entirely on which side of the trade you sit</p>
      </div>
    </div>
  );
}

// 6 — RBI toolkit
export function Infographic6() {
  const tools = [
    { num: '01', title: 'Sell Dollars', desc: 'Releases dollars from forex reserves → increases supply → rupee steadies' },
    { num: '02', title: 'Forward Contracts', desc: 'Agrees to buy dollars later → signals confidence → calms panic selling' },
    { num: '03', title: 'Interest Rates', desc: 'Higher rates attract foreign investment → dollar inflows → rupee firms up' },
  ];
  return (
    <InfographicWrapper title="RBI's 3 Tools to Manage the Rupee">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {tools.map((t, i) => (
          <div key={i} className="bg-white rounded-xl border border-brand-100 p-4">
            <span className="text-[10px] font-bold text-brand-600 font-mono">{t.num}</span>
            <p className="text-xs font-bold text-gray-900 mt-1 mb-1.5">{t.title}</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
      <div className="bg-brand-600 rounded-xl px-4 py-2.5 text-center">
        <p className="text-xs text-white font-semibold">Goal: prevent a blowout — not stop the tyre from deflating</p>
      </div>
    </InfographicWrapper>
  );
}

export const INFOGRAPHICS = { 1: Infographic1, 2: Infographic2, 3: Infographic3, 4: Infographic4, 5: Infographic5, 6: Infographic6 };
