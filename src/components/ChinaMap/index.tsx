import { Tooltip } from 'antd';
import { useTheme } from '../../context/ThemeContext';

interface AssetPoint {
  x: number;
  y: number;
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

// 全国地图上的资产分布点（简化坐标系 0-600 x 0-500）
const assets: AssetPoint[] = [
  // 广州 电网储能（珠三角区域 x:420-460, y:380-410）
  { x: 430, y: 388, name: '富山站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { x: 438, y: 382, name: '聚龙站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { x: 425, y: 395, name: '厚德站储能', capacity: '100MW/200MWh', type: 'grid_storage', city: '广州海珠', status: '在线' },
  { x: 433, y: 400, name: '化龙站储能', capacity: '100MW/200MWh', type: 'grid_storage', city: '广州番禺', status: '在线' },
  { x: 445, y: 385, name: '科城站储能', capacity: '200MW/400MWh', type: 'grid_storage', city: '广州黄埔', status: '在线' },
  { x: 420, y: 405, name: '鱼飞站储能', capacity: '150MW/300MWh', type: 'grid_storage', city: '广州南沙', status: '在线' },
  // 深圳
  { x: 455, y: 398, name: '象山站储能', capacity: '200MW/400MWh', type: 'grid_storage', city: '深圳宝安', status: '在线' },
  // 分布式资源
  { x: 365, y: 155, name: '光伏电站-北区', capacity: '50MW', type: 'solar', city: '北京朝阳', status: '在线' },
  { x: 358, y: 160, name: '储能系统-A', capacity: '20MW/40MWh', type: 'storage', city: '北京海淀', status: '在线' },
  { x: 310, y: 130, name: '风电场-东区', capacity: '30MW', type: 'wind', city: '内蒙古呼和浩特', status: '在线' },
  { x: 362, y: 158, name: '充电桩群-CBD', capacity: '5MW', type: 'ev', city: '北京西城', status: '告警' },
  { x: 340, y: 170, name: '工业负荷-钢厂', capacity: '可调 40MW', type: 'industrial', city: '河北唐山', status: '在线' },
  { x: 370, y: 152, name: '光伏电站-南区', capacity: '25MW', type: 'solar', city: '北京大兴', status: '维护' },
  { x: 375, y: 185, name: '储能系统-B', capacity: '15MW/30MWh', type: 'storage', city: '天津滨海', status: '在线' },
  { x: 285, y: 138, name: '风电场-西区', capacity: '20MW', type: 'wind', city: '张家口', status: '离线' },
  { x: 360, y: 165, name: '充电桩群-园区', capacity: '3MW', type: 'ev', city: '北京昌平', status: '在线' },
  { x: 378, y: 190, name: '工业负荷-化工', capacity: '可调 35MW', type: 'industrial', city: '天津东丽', status: '在线' },
];

// 中国简化省界轮廓路径
const chinaOutline = `M140,120 L160,95 L200,80 L240,75 L280,70 L310,65 L340,55 L370,50 L400,55 L430,70 L460,80 L490,95 L510,110 L520,135 L525,160 L530,185 L525,210 L520,235 L510,260 L495,280 L480,300 L465,320 L450,340 L440,360 L435,380 L440,400 L450,415 L455,430 L445,440 L430,445 L410,440 L390,430 L375,420 L360,425 L345,435 L330,440 L315,435 L300,425 L280,420 L260,425 L240,430 L220,425 L200,415 L180,400 L165,385 L150,365 L140,340 L130,315 L120,290 L110,265 L105,240 L100,215 L105,190 L110,165 L120,145 Z`;

// 城市标签
const cityLabels = [
  { x: 362, y: 148, name: '北京' },
  { x: 378, y: 180, name: '天津' },
  { x: 335, y: 172, name: '唐山' },
  { x: 290, y: 132, name: '张家口' },
  { x: 305, y: 120, name: '呼和浩特' },
  { x: 435, y: 375, name: '广州' },
  { x: 455, y: 392, name: '深圳' },
];

// 珠三角放大区域指示
const prdRegion = { x: 435, y: 395, rx: 25, ry: 18 };

export default function ChinaMap({ style }: { style?: React.CSSProperties }) {
  const { colors: c, mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div style={{ position: 'relative', ...style }}>
      <svg viewBox="50 30 530 440" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="chinaGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="prdGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
          </radialGradient>
          <style>{`
            @keyframes chinaPulse {
              0% { opacity: 1; r: 5; }
              50% { opacity: 0.3; r: 10; }
              100% { opacity: 1; r: 5; }
            }
            .china-pulse { animation: chinaPulse 2.5s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* 中国轮廓 */}
        <path
          d={chinaOutline}
          fill={isDark ? 'rgba(0,100,200,0.06)' : 'rgba(0,100,200,0.04)'}
          stroke={isDark ? 'rgba(0,180,255,0.25)' : 'rgba(0,100,200,0.15)'}
          strokeWidth={1.5}
        />

        {/* 珠三角高亮区域 */}
        <ellipse
          cx={prdRegion.x} cy={prdRegion.y} rx={prdRegion.rx} ry={prdRegion.ry}
          fill="url(#prdGlow)"
          stroke={isDark ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.25)'}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <text x={prdRegion.x} y={prdRegion.y + prdRegion.ry + 12} fill="#38bdf8" fontSize={8} textAnchor="middle" opacity={0.7}>
          珠三角储能集群
        </text>

        {/* 京津冀区域高亮 */}
        <ellipse
          cx={360} cy={165} rx={35} ry={25}
          fill={isDark ? 'rgba(0,180,255,0.04)' : 'rgba(0,100,200,0.03)'}
          stroke={isDark ? 'rgba(0,180,255,0.15)' : 'rgba(0,100,200,0.1)'}
          strokeDasharray="3 3"
          strokeWidth={0.8}
        />
        <text x={360} y={200} fill={c.textDim} fontSize={8} textAnchor="middle" opacity={0.6}>
          京津冀分布式资源
        </text>

        {/* 城市标签 */}
        {cityLabels.map(city => (
          <text key={city.name} x={city.x} y={city.y} fill={c.textDim} fontSize={9} textAnchor="middle">
            {city.name}
          </text>
        ))}

        {/* 资产分布点 */}
        {assets.map((a, i) => (
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
              {/* 脉冲光晕 */}
              <circle
                cx={a.x} cy={a.y} r={a.type === 'grid_storage' ? 8 : 6}
                fill={TYPE_COLORS[a.type]}
                opacity={0.15}
                className="china-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
              {/* 状态环 */}
              <circle
                cx={a.x} cy={a.y}
                r={a.type === 'grid_storage' ? 5 : 3.5}
                fill="none"
                stroke={STATUS_COLORS[a.status]}
                strokeWidth={0.8}
                opacity={0.6}
              />
              {/* 实心点 */}
              <circle
                cx={a.x} cy={a.y}
                r={a.type === 'grid_storage' ? 4 : 3}
                fill={TYPE_COLORS[a.type]}
                filter={isDark ? 'url(#chinaGlow)' : undefined}
              />
            </g>
          </Tooltip>
        ))}

        {/* 连线：珠三角集群内部连接 */}
        {assets.filter(a => a.type === 'grid_storage').map((a, i, arr) => {
          if (i === 0) return null;
          const prev = arr[i - 1];
          return (
            <line
              key={`line-${i}`}
              x1={prev.x} y1={prev.y} x2={a.x} y2={a.y}
              stroke="#38bdf8"
              strokeWidth={0.5}
              strokeDasharray="2 2"
              opacity={0.3}
            />
          );
        })}

        {/* 总容量标注 */}
        <text x={85} y={55} fill={c.primary} fontSize={10} fontWeight={600}>
          全国储能资产分布
        </text>
        <text x={85} y={68} fill={c.textDim} fontSize={8}>
          电网储能 7座 · 总容量 1,050MW/2,100MWh
        </text>
        <text x={85} y={80} fill={c.textDim} fontSize={8}>
          分布式资源 10个 · 覆盖京津冀+珠三角
        </text>
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
