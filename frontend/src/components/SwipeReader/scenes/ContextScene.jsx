import { lazy, Suspense } from 'react';
import {
  FlfprChart, CorporatePipelineChart, PayGapChart,
  SafetyBarriersChart, EducationFunnelChart, HealthDashboard, ProxyGapChart,
} from './WomenDataVisuals';

const IndiaImpactMap = lazy(() => import('./IndiaImpactMap'));

const GEO_VISUALS = { india_el_nino: IndiaImpactMap };

const DATA_VISUALS = {
  women_flfpr:       FlfprChart,
  women_pipeline:    CorporatePipelineChart,
  women_pay_gap:     PayGapChart,
  women_safety:      SafetyBarriersChart,
  women_education:   EducationFunnelChart,
  women_health:      HealthDashboard,
  women_proxy:       ProxyGapChart,
};

export default function ContextScene({ scene }) {
  const { title, body, key_numbers, timeline, geo_visual, data_visual } = scene;
  const GeoComponent  = geo_visual  ? GEO_VISUALS[geo_visual]   : null;
  const DataComponent = data_visual ? DATA_VISUALS[data_visual] : null;

  const dotColor = {
    positive: 'bg-brand-600',
    negative: 'bg-gray-500',
    neutral:  'bg-gray-300',
  };

  return (
    <div className="px-5 py-5 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-snug">{title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">{body}</p>
      </div>

      {/* Key numbers — 2-col grid */}
      {key_numbers?.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {key_numbers.map((n, i) => (
            <div key={i} className="bg-brand-50 border border-brand-100 rounded-xl p-3.5">
              <p className="text-xl font-bold text-brand-600 leading-tight">{n.value}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{n.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Geographic impact map */}
      {GeoComponent && (
        <Suspense fallback={<div className="h-48 bg-gray-50 rounded-xl animate-pulse" />}>
          <GeoComponent title="State-level impact" />
        </Suspense>
      )}

      {/* Inline data visualisation */}
      {DataComponent && <DataComponent />}

      {/* Timeline */}
      {timeline?.length > 0 && (
        <div className="relative pl-7">
          <div className="absolute left-2.5 top-2 bottom-2 w-px bg-gray-200" />
          <div className="flex flex-col gap-5">
            {timeline.map((t, i) => (
              <div key={i} className="relative flex items-start gap-3">
                <span className={`absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${dotColor[t.type] || 'bg-gray-300'}`} />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.year}</p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
