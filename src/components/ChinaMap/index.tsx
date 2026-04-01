import { useState } from 'react';
import { Tooltip } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import { PROVINCES } from './provinces';

interface AssetPoint {
  lon: number;
  lat: number;
  name: string;
  capacity: string;
  type: 'grid_storage' | 'storage' | 'solar' | 'wind' | 'ev' | 'industrial';
  city: string;
  status: '在线' | '离线' | '维护' | '告警';
}

const TYPE_COLORS: Record<string, string> = {
  grid_storage: '#38bdf8',
  storage: '#00d4ff',
  solar: '#ffb800',
  wind: '#00ff88',
  ev: '#a78bfa',
  industrial: '#fb923c',
};

const TYPE_LABELS: Record<string, string> = {
  grid_storage: '电网储能',
  storage: '工商业储能',
  solar: '光伏电站',
  wind: '风电',
  ev: '充电桩',
  industrial: '工业负荷',
};

const STATUS_COLORS: Record<string, string> = {
  '在线': '#00ff88',
  '离线': '#4a5568',
  '维护': '#ffb800',
  '告警': '#ff4d4d',
};

// 经纬度坐标 → SVG坐标投影
const MIN_LON = 73, MAX_LON = 136, MIN_LAT = 15, MAX_LAT = 54;
const SVG_W = 600, SVG_H = 500;
function projX(lon: number) { return ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * SVG_W; }
function projY(lat: number) { return SVG_H - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * SVG_H; }

// 资产点使用真实经纬度
const assets: AssetPoint[] = [
  // 广州 电网储能（珠三角区域）
  { lon: 113.36, lat: 23.05, name: '富山站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { lon: 113.40, lat: 23.08, name: '聚龙站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { lon: 113.28, lat: 23.01, name: '厚德站储能', capacity: '100MW/200MWh', type: 'grid_storage', city: '广州海珠', status: '在线' },
  { lon: 113.44, lat: 22.98, name: '化龙站储能', capacity: '100MW/200MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { lon: 113.52, lat: 23.10, name: '科城站储能', capacity: '200MW/400MWh', type: 'grid_storage', city: '广州黄埔', status: '在线' },
  { lon: 113.20, lat: 22.78, name: '鱼飞站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州南沙', status: '在线' },
  // 深圳
  { lon: 113.90, lat: 22.60, name: '象山站储能', capacity: '200MW/400MWh', type: 'grid_storage', city: '深圳宝安', status: '在线' },
  // 分布式资源 - 京津冀+内蒙+张家口
  { lon: 116.50, lat: 39.95, name: '光伏电站-北区', capacity: '50MW', type: 'solar', city: '北京朝阳', status: '在线' },
  { lon: 116.30, lat: 39.98, name: '储能系统-A', capacity: '20MW/40MWh', type: 'storage', city: '北京海淀', status: '在线' },
  { lon: 111.75, lat: 40.85, name: '风电场-东区', capacity: '30MW', type: 'wind', city: '内蒙古呼和浩特', status: '在线' },
  { lon: 116.38, lat: 39.92, name: '充电桩群-CBD', capacity: '5MW', type: 'ev', city: '北京西城', status: '告警' },
  { lon: 118.18, lat: 39.63, name: '工业负荷-钢厂', capacity: '可调 40MW', type: 'industrial', city: '河北唐山', status: '在线' },
  { lon: 116.35, lat: 39.73, name: '光伏电站-南区', capacity: '25MW', type: 'solar', city: '北京大兴', status: '维护' },
  { lon: 117.70, lat: 39.03, name: '储能系统-B', capacity: '15MW/30MWh', type: 'storage', city: '天津滨海', status: '在线' },
  { lon: 114.88, lat: 40.82, name: '风电场-西区', capacity: '20MW', type: 'wind', city: '张家口', status: '离线' },
  { lon: 116.22, lat: 40.22, name: '充电桩群-园区', capacity: '3MW', type: 'ev', city: '北京昌平', status: '在线' },
  { lon: 117.40, lat: 39.08, name: '工业负荷-化工', capacity: '可调 35MW', type: 'industrial', city: '天津东丽', status: '在线' },
];

// 重点城市标签
const cityLabels = [
  { lon: 116.40, lat: 39.90, name: '北京' },
  { lon: 117.20, lat: 39.12, name: '天津' },
  { lon: 118.18, lat: 39.63, name: '唐山' },
  { lon: 114.88, lat: 40.82, name: '张家口' },
  { lon: 111.75, lat: 40.85, name: '呼和浩特' },
  { lon: 113.26, lat: 23.13, name: '广州' },
  { lon: 114.07, lat: 22.55, name: '深圳' },
];

export default function ChinaMap({ style }: { style?: React.CSSProperties }) {
  const { colors: c, mode } = useTheme();
  const isDark = mode === 'dark';
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // 珠三角集群椭圆中心
  const prdCx = projX(113.4), prdCy = projY(23.0);
  const jjjCx = projX(116.3), jjjCy = projY(39.9);

  return (
    <div style={{ position: 'relative', ...style }}>
      <svg viewBox="0 0 600 500" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="chinaGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="prdGlow2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </radialGradient>
          <style>{`
            @keyframes chinaPulse2 {
              0% { opacity: 1; r: 5; }
              50% { opacity: 0.3; r: 10; }
              100% { opacity: 1; r: 5; }
            }
            .china-pulse2 { animation: chinaPulse2 2.5s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* 省份 */}
        {PROVINCES.map(prov => (
          <path
            key={prov.adcode}
            d={prov.d}
            fill={
              hoveredProvince === prov.name
                ? (isDark ? 'rgba(0,140,255,0.18)' : 'rgba(0,100,200,0.12)')
                : (isDark ? 'rgba(0,80,180,0.08)' : 'rgba(0,80,180,0.04)')
            }
            stroke={isDark ? 'rgba(0,160,255,0.3)' : 'rgba(0,100,200,0.2)'}
            strokeWidth={0.6}
            style={{ transition: 'fill 0.2s' }}
            onMouseEnter={() => setHoveredProvince(prov.name)}
            onMouseLeave={() => setHoveredProvince(null)}
          />
        ))}

        {/* 珠三角高亮区域 */}
        <ellipse
          cx={prdCx} cy={prdCy} rx={22} ry={16}
          fill="url(#prdGlow2)"
          stroke={isDark ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.25)'}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <text x={prdCx} y={prdCy + 22} fill="#38bdf8" fontSize={8} textAnchor="middle" opacity={0.7}>
          珠三角储能集群
        </text>

        {/* 京津冀区域高亮 */}
        <ellipse
          cx={jjjCx} cy={jjjCy} rx={30} ry={22}
          fill={isDark ? 'rgba(0,180,255,0.04)' : 'rgba(0,100,200,0.03)'}
          stroke={isDark ? 'rgba(0,180,255,0.15)' : 'rgba(0,100,200,0.1)'}
          strokeDasharray="3 3"
          strokeWidth={0.8}
        />
        <text x={jjjCx} y={jjjCy + 28} fill={c.textDim} fontSize={8} textAnchor="middle" opacity={0.6}>
          京津冀分布式资源
        </text>

        {/* 城市标签 */}
        {cityLabels.map(city => (
          <text
            key={city.name}
            x={projX(city.lon)} y={projY(city.lat) - 8}
            fill={c.textDim} fontSize={9} textAnchor="middle"
          >
            {city.name}
          </text>
        ))}

        {/* 连线：珠三角集群内部连接 */}
        {assets.filter(a => a.type === 'grid_storage').map((a, i, arr) => {
          if (i === 0) return null;
          const prev = arr[i - 1];
          return (
            <line
              key={`line-${i}`}
              x1={projX(prev.lon)} y1={projY(prev.lat)}
              x2={projX(a.lon)} y2={projY(a.lat)}
              stroke="#38bdf8"
              strokeWidth={0.5}
              strokeDasharray="2 2"
              opacity={0.3}
            />
          );
        })}

        {/* 资产分布点 */}
        {assets.map((a, i) => {
          const ax = projX(a.lon);
          const ay = projY(a.lat);
          return (
            <Tooltip
              key={i}
              title={
                <div>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{TYPE_LABELS[a.type]} · {a.capacity}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{a.city}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    <span style={{ color: STATUS_COLORS[a.status] }}>● {a.status}</span>
                  </div>
                </div>
              }
            >
              <g style={{ cursor: 'pointer' }}>
                <circle
                  cx={ax} cy={ay} r={a.type === 'grid_storage' ? 8 : 6}
                  fill={TYPE_COLORS[a.type]}
                  opacity={0.15}
                  className="china-pulse2"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
                <circle
                  cx={ax} cy={ay}
                  r={a.type === 'grid_storage' ? 5 : 3.5}
                  fill="none"
                  stroke={STATUS_COLORS[a.status]}
                  strokeWidth={0.8}
                  opacity={0.6}
                />
                <circle
                  cx={ax} cy={ay}
                  r={a.type === 'grid_storage' ? 4 : 3}
                  fill={TYPE_COLORS[a.type]}
                  filter={isDark ? 'url(#chinaGlow)' : undefined}
                />
              </g>
            </Tooltip>
          );
        })}

        {/* 总容量标注 */}
        <text x={12} y={22} fill={c.primary} fontSize={10} fontWeight={600}>
          全国储能资产分布
        </text>
        <text x={12} y={35} fill={c.textDim} fontSize={8}>
          电网储能 7座 · 总容量 1,050MW/2,100MWh
        </text>
        <text x={12} y={47} fill={c.textDim} fontSize={8}>
          分布式资源 10个 · 覆盖京津冀+珠三角
        </text>

        {/* 悬停省份名称 */}
        {hoveredProvince && (
          <text x={580} y={22} fill={c.textDim} fontSize={10} textAnchor="end" opacity={0.7}>
            {hoveredProvince}
          </text>
        )}
      </svg>

      {/* 图例 */}
      <div style={{
        position: 'absolute', bottom: 4, left: 8, right: 8,
        display: 'flex', gap: 10, fontSize: 10, color: c.textMuted, flexWrap: 'wrap',
      }}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: TYPE_COLORS[key],
              boxShadow: isDark ? `0 0 4px ${TYPE_COLORS[key]}` : 'none',
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
