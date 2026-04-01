import { Tooltip } from 'antd';
import { useTheme } from '../../context/ThemeContext';

interface ResourcePoint {
  x: number;
  y: number;
  name: string;
  capacity: string;
  type: 'storage' | 'industrial' | 'solar' | 'ev';
  city: string;
}

const TYPE_COLORS = {
  storage: '#1890ff',
  industrial: '#fa8c16',
  solar: '#52c41a',
  ev: '#722ed1',
};

const TYPE_LABELS = {
  storage: '储能',
  industrial: '工业负荷',
  solar: '光伏',
  ev: '充电桩',
};

const resources: ResourcePoint[] = [
  // 广州
  { x: 280, y: 160, name: '富山储能站', capacity: '150MW/300MWh', type: 'storage', city: '广州' },
  { x: 300, y: 145, name: '聚龙储能站', capacity: '150MW/300MWh', type: 'storage', city: '广州' },
  { x: 260, y: 170, name: '南区储能站', capacity: '50MW/100MWh', type: 'storage', city: '广州' },
  { x: 290, y: 175, name: '天河工业园', capacity: '可调 35MW', type: 'industrial', city: '广州' },
  { x: 310, y: 165, name: '黄埔制造基地', capacity: '可调 28MW', type: 'industrial', city: '广州' },
  { x: 270, y: 150, name: '番禺工业区', capacity: '可调 42MW', type: 'industrial', city: '广州' },
  { x: 295, y: 185, name: '增城智造园', capacity: '可调 18MW', type: 'industrial', city: '广州' },
  { x: 250, y: 165, name: '花都汽车城', capacity: '可调 22MW', type: 'industrial', city: '广州' },
  // 深圳
  { x: 360, y: 205, name: '前海充电集群', capacity: '聚合 12MW', type: 'ev', city: '深圳' },
  { x: 375, y: 195, name: '龙华充电网络', capacity: '聚合 8MW', type: 'ev', city: '深圳' },
  { x: 345, y: 200, name: '宝安储能站', capacity: '30MW/60MWh', type: 'storage', city: '深圳' },
  // 佛山
  { x: 230, y: 170, name: '南海光伏基地', capacity: '装机 85MW', type: 'solar', city: '佛山' },
  { x: 215, y: 185, name: '顺德光伏园', capacity: '装机 60MW', type: 'solar', city: '佛山' },
  { x: 240, y: 180, name: '佛山陶瓷园', capacity: '可调 30MW', type: 'industrial', city: '佛山' },
  // 东莞
  { x: 335, y: 170, name: '松山湖高科', capacity: '可调 25MW', type: 'industrial', city: '东莞' },
  { x: 325, y: 180, name: '虎门制造园', capacity: '可调 38MW', type: 'industrial', city: '东莞' },
  { x: 340, y: 185, name: '长安电子城', capacity: '可调 20MW', type: 'industrial', city: '东莞' },
  // 珠海
  { x: 260, y: 225, name: '金湾光伏', capacity: '装机 45MW', type: 'solar', city: '珠海' },
  { x: 245, y: 215, name: '横琴储能', capacity: '20MW/40MWh', type: 'storage', city: '珠海' },
];

const cityLabels = [
  { x: 280, y: 138, name: '广州' },
  { x: 358, y: 188, name: '深圳' },
  { x: 215, y: 160, name: '佛山' },
  { x: 332, y: 158, name: '东莞' },
  { x: 248, y: 232, name: '珠海' },
  { x: 170, y: 130, name: '肇庆' },
  { x: 310, y: 130, name: '惠州' },
  { x: 155, y: 195, name: '江门' },
  { x: 195, y: 225, name: '中山' },
];

export default function GuangdongMap({ style }: { style?: React.CSSProperties }) {
  const { colors: c, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div style={{ position: 'relative', ...style }}>
      <svg viewBox="0 0 500 300" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes mapPulse {
              0% { opacity: 1; r: 4; }
              50% { opacity: 0.4; r: 8; }
              100% { opacity: 1; r: 4; }
            }
            .map-pulse { animation: mapPulse 2s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* 广东省简化轮廓 */}
        <path
          d="M80,80 L120,50 L180,40 L240,45 L300,35 L360,50 L420,70 L440,100 L430,140 L410,170 L395,195 L380,210 L350,220 L320,235 L280,245 L250,240 L220,235 L190,240 L160,230 L130,220 L110,200 L90,170 L75,140 L70,110 Z"
          fill={isDark ? 'rgba(0,100,200,0.08)' : 'rgba(0,100,200,0.05)'}
          stroke={isDark ? 'rgba(0,180,255,0.3)' : 'rgba(0,100,200,0.2)'}
          strokeWidth={1.5}
        />

        {/* 珠三角核心区高亮 */}
        <ellipse
          cx={290} cy={185} rx={90} ry={45}
          fill={isDark ? 'rgba(0,180,255,0.06)' : 'rgba(0,100,200,0.04)'}
          stroke={isDark ? 'rgba(0,180,255,0.15)' : 'rgba(0,100,200,0.1)'}
          strokeDasharray="4 4"
        />

        {/* 城市标签 */}
        {cityLabels.map(city => (
          <text
            key={city.name}
            x={city.x}
            y={city.y}
            fill={c.textDim}
            fontSize={10}
            textAnchor="middle"
          >
            {city.name}
          </text>
        ))}

        {/* 资源分布点 */}
        {resources.map((r, i) => (
          <Tooltip
            key={i}
            title={
              <div>
                <div style={{ fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {TYPE_LABELS[r.type]} · {r.capacity}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>{r.city}</div>
              </div>
            }
          >
            <g style={{ cursor: 'pointer' }}>
              {/* 脉冲光晕 */}
              <circle
                cx={r.x}
                cy={r.y}
                r={6}
                fill={TYPE_COLORS[r.type]}
                opacity={0.2}
                className="map-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
              {/* 实心点 */}
              <circle
                cx={r.x}
                cy={r.y}
                r={3.5}
                fill={TYPE_COLORS[r.type]}
                filter={isDark ? 'url(#glow)' : undefined}
              />
            </g>
          </Tooltip>
        ))}
      </svg>

      {/* 图例 */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        display: 'flex', gap: 12, fontSize: 11, color: c.textMuted,
      }}>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: TYPE_COLORS[key as keyof typeof TYPE_COLORS],
              boxShadow: isDark ? `0 0 4px ${TYPE_COLORS[key as keyof typeof TYPE_COLORS]}` : 'none',
            }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
