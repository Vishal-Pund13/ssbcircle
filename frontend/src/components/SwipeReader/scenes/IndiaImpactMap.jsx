import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const GEO_URL = 'https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson';

// States that historically face drought / below-normal rainfall during El Niño
const DROUGHT = new Set([
  'Maharashtra', 'Karnataka', 'Gujarat', 'Rajasthan',
  'Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'Jharkhand',
  'Chhattisgarh', 'Telangana', 'Andhra Pradesh', 'Haryana',
  'Delhi', 'Punjab',
]);

// States that get BETTER rainfall (northeast monsoon boost) during El Niño
const RAIN = new Set([
  'Tamil Nadu', 'Odisha', 'West Bengal', 'Assam',
  'Meghalaya', 'Arunachal Pradesh', 'Sikkim', 'Manipur',
  'Mizoram', 'Nagaland', 'Tripura',
]);

const MAP_STYLE = {
  default: { outline: 'none' },
  hover:   { outline: 'none' },
  pressed: { outline: 'none' },
};

const LEGENDS = [
  { color: '#e0e7ff', border: '#a5b4fc', label: 'Drought risk (SW monsoon deficient)' },
  { color: '#1e3a5f', border: '#1e3a5f', label: 'Extra rain likely (NE monsoon boost)' },
  { color: '#f3f4f6', border: '#d1d5db', label: 'Mixed / uncertain' },
];

export default function IndiaImpactMap({ title }) {
  return (
    <div className="flex flex-col gap-2">
      {title && <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">{title}</p>}

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
        {/* Pacific arrow label */}
        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">El Niño Impact on India</p>
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [82.5, 23], scale: 480 }}
          width={340}
          height={360}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const name = geo.properties.ST_NM;
                const fill = DROUGHT.has(name) ? '#e0e7ff'
                           : RAIN.has(name)    ? '#1e3a5f'
                           : '#f3f4f6';
                const stroke = DROUGHT.has(name) ? '#a5b4fc'
                             : RAIN.has(name)    ? '#162d4a'
                             : '#d1d5db';
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={0.6}
                    style={MAP_STYLE}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1">
        {LEGENDS.map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm shrink-0 border"
              style={{ background: l.color, borderColor: l.border }} />
            <span className="text-[11px] text-gray-600 leading-tight">{l.label}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-gray-400 italic">
        Based on historical El Niño patterns. Northeast monsoon (Oct–Dec) often compensates in coastal South India.
      </p>
    </div>
  );
}
