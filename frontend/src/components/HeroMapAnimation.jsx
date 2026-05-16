import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Logo placed over Madhya Pradesh
const CENTER = [78.5, 23.5];

const CITIES = [
  // North
  { name: 'Srinagar',      coords: [74.8, 34.1] },
  { name: 'Chandigarh',    coords: [76.8, 30.7] },
  { name: 'Delhi',         coords: [77.2, 28.6],  label: 'Delhi',     dx: 5,   dy: -5  },
  { name: 'Jaipur',        coords: [75.8, 26.9] },
  { name: 'Lucknow',       coords: [80.9, 26.8] },
  // East
  { name: 'Patna',         coords: [85.1, 25.6] },
  { name: 'Kolkata',       coords: [88.4, 22.6],  label: 'Kolkata',   dx: 5,   dy: -4  },
  { name: 'Guwahati',      coords: [91.7, 26.2],  label: 'Guwahati',  dx: 5,   dy: -4  },
  { name: 'Bhubaneswar',   coords: [85.8, 20.3] },
  // West
  { name: 'Ahmedabad',     coords: [72.6, 23.0] },
  { name: 'Mumbai',        coords: [72.9, 19.1],  label: 'Mumbai',    dx: -5,  dy: -5, anchor: 'end' },
  { name: 'Pune',          coords: [73.9, 18.5] },
  // Central
  { name: 'Bhopal',        coords: [77.4, 23.3] },
  { name: 'Nagpur',        coords: [79.1, 21.2] },
  // South
  { name: 'Hyderabad',     coords: [78.5, 17.4],  label: 'Hyderabad', dx: -5,  dy: -5, anchor: 'end' },
  { name: 'Visakhapatnam', coords: [83.3, 17.7] },
  { name: 'Bangalore',     coords: [77.6, 13.0],  label: 'Bangalore', dx: -5,  dy: -5, anchor: 'end' },
  { name: 'Chennai',       coords: [80.3, 13.1],  label: 'Chennai',   dx: 5,   dy: -5  },
  { name: 'Kochi',         coords: [76.3, 10.0],  label: 'Kochi',     dx: -5,  dy: -5, anchor: 'end' },
];

const MAP_STYLE = {
  default: { outline: 'none' },
  hover:   { outline: 'none' },
  pressed: { outline: 'none' },
};

export default function HeroMapAnimation() {
  return (
    <div className="w-full max-w-[200px] sm:max-w-[280px] select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82, 22], scale: 900 }}
        width={340}
        height={420}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          <style>{`
            @keyframes hma-flow {
              from { stroke-dashoffset: 18; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes hma-ring {
              from { transform: scale(1); opacity: 0.7; }
              to   { transform: scale(4); opacity: 0; }
            }
            @keyframes hma-glow {
              0%, 100% { opacity: 0.12; }
              50%       { opacity: 0.28; }
            }
          `}</style>
        </defs>

        {/* India fill */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies
              .filter(geo => geo.id === '356')
              .map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#dbeafe"
                  stroke="#93c5fd"
                  strokeWidth={0.6}
                  style={MAP_STYLE}
                />
              ))
          }
        </Geographies>

        {/* Animated dashed lines: city → logo */}
        {CITIES.map((city, i) => (
          <Line
            key={city.name}
            from={city.coords}
            to={CENTER}
            stroke="#3b82f6"
            strokeWidth={0.75}
            strokeDasharray="4 5"
            strokeLinecap="round"
            style={{
              opacity: 0.45,
              animation: `hma-flow 1.6s linear ${(i * 0.19).toFixed(2)}s infinite`,
            }}
          />
        ))}

        {/* City dots + pulse rings + labels */}
        {CITIES.map((city, i) => (
          <Marker key={city.name} coordinates={city.coords}>
            <circle
              r={3}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={0.8}
              style={{
                transformOrigin: 'center',
                animation: `hma-ring 2.4s ease-out ${(i * 0.14).toFixed(2)}s infinite`,
              }}
            />
            <circle r={2} fill="#2563eb" />
            {city.label && (
              <text
                x={city.dx}
                y={city.dy}
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                fill="#1e3a5f"
                textAnchor={city.anchor || 'start'}
                style={{ pointerEvents: 'none' }}
              >
                {city.label}
              </text>
            )}
          </Marker>
        ))}

        {/* SSBCircle logo at center */}
        <Marker coordinates={CENTER}>
          <circle
            r={24}
            fill="#2563eb"
            style={{ animation: 'hma-glow 3s ease-in-out infinite' }}
          />
          <circle r={19} fill="white" stroke="#bfdbfe" strokeWidth={1.5} />
          <g transform="scale(0.62) translate(-24,-24)">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#1e3a5f" strokeWidth="2.5"/>
            <circle cx="14" cy="20" r="3"  fill="#1e3a5f"/>
            <circle cx="24" cy="14" r="3"  fill="#1e3a5f"/>
            <circle cx="34" cy="20" r="3"  fill="#1e3a5f"/>
            <circle cx="30" cy="31" r="3"  fill="#1e3a5f"/>
            <circle cx="18" cy="31" r="3"  fill="#1e3a5f"/>
            <path d="M14 20 L24 14 L34 20 L30 31 L18 31 Z"
              stroke="#1e3a5f" strokeWidth="1.5" fill="none"/>
          </g>
        </Marker>

      </ComposableMap>
    </div>
  );
}
