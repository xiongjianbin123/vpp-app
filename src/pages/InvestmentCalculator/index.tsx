import { useState, useMemo } from 'react';
import {
  Row, Col, Card, Tabs, Form, Input, InputNumber, Select, Radio,
  Table, Button, Tag, Statistic, Checkbox, Tooltip,
} from 'antd';
import type { ColumnType } from 'antd/es/table';
import {
  CalculatorOutlined, DownloadOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

// ─── 样式常量 ─────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(0,212,255,0.12)',
  borderRadius: 12,
};
const headStyle = {
  background: 'transparent',
  borderBottom: '1px solid rgba(0,212,255,0.12)',
};
const labelStyle: React.CSSProperties = { color: '#aab4c8', fontSize: 12 };
const inputStyle: React.CSSProperties = {
  background: '#0d1526',
  border: '1px solid rgba(0,212,255,0.2)',
  color: '#e2e8f0',
};
const tooltipStyle = {
  background: '#1a2540',
  border: '1px solid #00d4ff',
  borderRadius: 6,
  fontSize: 12,
};

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface InvestmentConfig {
  // Tab1: 基本信息
  projectName: string;
  region: string;
  storageType: 'commercial' | 'grid';

  // Tab2: 商业模式
  selectedModels: string[];

  // Tab3: 财务评价参数
  benchmarkRate: number;
  calcPeriod: number;
  discountRate: number;
  inflationRate: number;
  incomeTaxRate: number;
  vatRate: number;

  // Tab4: 资金筹措
  equityRatio: number;
  loanRate: number;
  loanTerm: number;

  // Tab5: 电池参数
  batteryType: 'LFP' | 'NMC';
  ratedCapacity: number;
  ratedPower: number;
  chargeDischargeEfficiency: number;
  dailyCycles: number;
  cycleLife: number;
  annualDegradation: number;

  // Tab6: 成本
  batteryCostPerKwh: number;
  pcsCostPerKw: number;
  bmsCostPerKwh: number;
  civilCost: number;
  gridConnectionCost: number;
  annualOmRate: number;
  insuranceRate: number;
  annualRent: number;
  electricityBuyPrice: number;

  // Tab7: 收益参数
  peakValleySpread: number;
  frequencyMileage: number;
  frequencyMileagePrice: number;
  kValue: number;
  peakRegPrice: number;
  peakRegHours: number;
  peakRegUtilization: number;
  capacityLeasePerMW: number;
  spotSpread: number;
}

interface YearlyRow {
  key: number;
  year: string;
  revenue: number;
  opex: number;
  debtService: number;
  netCashFlow: number;
  discountedCF: number;
  cumulativeCF: number;
  cumulativeDiscountedCF: number;
}

interface CalcResults {
  totalInvestment: number;
  yearlyRows: YearlyRow[];
  npv: number;
  irr: number;
  staticPayback: number;
  dynamicPayback: number;
  roi: number;
  equityROI: number;
  batteryCapex: number;
  pcsCapex: number;
  bmsCapex: number;
  civilCapex: number;
  gridCapex: number;
}

interface SensitivityRow {
  key: string;
  parameter: string;
  v_neg20: number;
  v_neg10: number;
  v_0: number;
  v_pos10: number;
  v_pos20: number;
}

// ─── 商业模式定义 ─────────────────────────────────────────────────────────────

const COMMERCIAL_MODELS = [
  { value: 'peakValley', label: '峰谷套利', desc: '利用峰谷电价差进行充放电套利' },
  { value: 'demandResponse', label: '需求响应', desc: '参与电网需求响应获取补贴收益' },
  { value: 'capacityFee', label: '容量费管理', desc: '降低用户容量电费支出' },
];

const GRID_MODELS = [
  { value: 'peakReg', label: '调峰辅助服务', desc: '参与电网调峰获取辅助服务费用' },
  { value: 'frequency', label: '调频辅助服务', desc: '参与 AGC 调频获取里程收益' },
  { value: 'capacityLease', label: '容量租赁', desc: '向电网出租储能容量' },
  { value: 'spotArbitrage', label: '现货市场套利', desc: '参与电力现货市场低买高卖' },
];

// ─── 核心计算函数 ──────────────────────────────────────────────────────────────

function computeTotalInvestment(cfg: InvestmentConfig): number {
  const capacityKwh = cfg.ratedCapacity * 1000;
  const powerKw = cfg.ratedPower * 1000;
  const battery = (cfg.batteryCostPerKwh * capacityKwh) / 10000;
  const pcs = (cfg.pcsCostPerKw * powerKw) / 10000;
  const bms = (cfg.bmsCostPerKwh * capacityKwh) / 10000;
  return +(battery + pcs + bms + cfg.civilCost + cfg.gridConnectionCost).toFixed(2);
}

function computeAnnualRevenue(cfg: InvestmentConfig, year: number): number {
  const deg = Math.pow(1 - cfg.annualDegradation / 100, year - 1);
  const eff = cfg.chargeDischargeEfficiency / 100;
  const models = cfg.selectedModels;
  let rev = 0;

  if (models.includes('peakValley')) {
    // ratedCapacity(MWh) × 1000 → kWh, × spread(元/kWh) → 元, ÷ 10000 → 万
    rev += cfg.ratedCapacity * 1000 * eff * cfg.peakValleySpread * cfg.dailyCycles * 365 / 10000 * deg;
  }
  if (models.includes('spotArbitrage')) {
    rev += cfg.ratedCapacity * 1000 * eff * cfg.spotSpread * cfg.dailyCycles * 365 / 10000 * deg;
  }
  if (models.includes('frequency')) {
    // ratedPower(MW) × mileage(MWh/MW/day) × price(元/MWh) × 365 ÷ 10000 → 万
    rev += cfg.ratedPower * cfg.frequencyMileage * cfg.frequencyMileagePrice * cfg.kValue * 365 / 10000 * deg;
  }
  if (models.includes('peakReg')) {
    // ratedPower(MW) × price(元/MW·h) × hours ÷ 10000 → 万
    rev += cfg.ratedPower * cfg.peakRegPrice * cfg.peakRegHours * (cfg.peakRegUtilization / 100) / 10000 * deg;
  }
  if (models.includes('capacityLease')) {
    rev += cfg.ratedPower * cfg.capacityLeasePerMW;
  }
  if (models.includes('demandResponse')) {
    // ratedPower(MW) × 1000 → kW, × 响应电量(kWh/kW/年) × 补贴(元/kWh) ÷ 10000 → 万
    rev += cfg.ratedPower * 1000 * 20 * 0.3 / 10000 * deg; // 年均响应20次×1h×0.3元/kWh补贴
  }
  if (models.includes('capacityFee')) {
    // ratedPower(MW) × 1000 → kW, × 需量电费(元/kW/月) × 12 ÷ 10000 → 万
    rev += cfg.ratedPower * 1000 * 40 * 12 / 10000;
  }

  return +rev.toFixed(4);
}

function computeAnnualOpex(cfg: InvestmentConfig, totalInv: number): number {
  return +(totalInv * (cfg.annualOmRate / 100)
    + totalInv * (cfg.insuranceRate / 100)
    + cfg.annualRent).toFixed(4);
}

function computeDebtService(cfg: InvestmentConfig, totalInv: number, year: number): number {
  const debt = totalInv * (1 - cfg.equityRatio / 100);
  if (year > cfg.loanTerm) return 0;
  const principal = debt / cfg.loanTerm;
  const remaining = debt - principal * (year - 1);
  const interest = remaining * (cfg.loanRate / 100);
  return +(principal + interest).toFixed(4);
}

function computeIRR(totalInv: number, cashFlows: number[]): number {
  function npvAt(r: number) {
    return cashFlows.reduce((s, cf, i) => s + cf / Math.pow(1 + r, i + 1), -totalInv);
  }
  if (npvAt(2.0) < 0) return NaN;
  let lo = -0.5, hi = 2.0;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npvAt(mid) > 0) lo = mid; else hi = mid;
    if (hi - lo < 0.00001) break;
  }
  return +((lo + hi) / 2 * 100).toFixed(2);
}

function calculateAll(cfg: InvestmentConfig): CalcResults {
  const totalInv = computeTotalInvestment(cfg);
  const r = cfg.discountRate / 100;
  const rows: YearlyRow[] = [];
  let cumCF = -totalInv;
  let cumDCF = -totalInv;

  for (let year = 1; year <= cfg.calcPeriod; year++) {
    const revenue = computeAnnualRevenue(cfg, year);
    const opex = computeAnnualOpex(cfg, totalInv);
    const debt = computeDebtService(cfg, totalInv, year);
    const ncf = +(revenue - opex - debt).toFixed(4);
    const dcf = +(ncf / Math.pow(1 + r, year)).toFixed(4);
    cumCF = +(cumCF + ncf).toFixed(4);
    cumDCF = +(cumDCF + dcf).toFixed(4);
    rows.push({
      key: year,
      year: `第${year}年`,
      revenue, opex, debtService: debt,
      netCashFlow: ncf,
      discountedCF: dcf,
      cumulativeCF: cumCF,
      cumulativeDiscountedCF: cumDCF,
    });
  }

  const cashFlows = rows.map(r => r.netCashFlow);
  const npv = +rows[rows.length - 1].cumulativeDiscountedCF.toFixed(2);
  const irr = computeIRR(totalInv, cashFlows);

  const avgNCF = cashFlows.reduce((a, b) => a + b, 0) / cashFlows.length;
  const staticPayback = avgNCF > 0 ? +(totalInv / avgNCF).toFixed(2) : Infinity;

  const dynIdx = rows.findIndex(r => r.cumulativeDiscountedCF >= 0);
  const dynamicPayback = dynIdx >= 0 ? dynIdx + 1 : Infinity;

  const avgRevenue = rows.reduce((s, r) => s + r.revenue, 0) / cfg.calcPeriod;
  const roi = +(avgRevenue / totalInv * 100).toFixed(2);
  const equityAmt = totalInv * (cfg.equityRatio / 100);
  const equityROI = equityAmt > 0 ? +(avgRevenue / equityAmt * 100).toFixed(2) : 0;

  const capKwh = cfg.ratedCapacity * 1000;
  const pwrKw = cfg.ratedPower * 1000;

  return {
    totalInvestment: totalInv,
    yearlyRows: rows,
    npv, irr, staticPayback, dynamicPayback, roi, equityROI,
    batteryCapex: +(cfg.batteryCostPerKwh * capKwh / 10000).toFixed(2),
    pcsCapex: +(cfg.pcsCostPerKw * pwrKw / 10000).toFixed(2),
    bmsCapex: +(cfg.bmsCostPerKwh * capKwh / 10000).toFixed(2),
    civilCapex: cfg.civilCost,
    gridCapex: cfg.gridConnectionCost,
  };
}

function computeSensitivity(cfg: InvestmentConfig): SensitivityRow[] {
  function calcNPV(overrides: Partial<InvestmentConfig>) {
    const modified = { ...cfg, ...overrides };
    const res = calculateAll(modified);
    return res.npv;
  }

  const base = calculateAll(cfg);
  const baseNPV = base.npv;
  const v = [-20, -10, 0, 10, 20];

  const params = cfg.storageType === 'commercial'
    ? [
        { key: 'spread', label: '电价差', field: 'peakValleySpread' as keyof InvestmentConfig },
        { key: 'cost', label: '初始投资成本', field: 'batteryCostPerKwh' as keyof InvestmentConfig },
        { key: 'cycles', label: '日循环次数', field: 'dailyCycles' as keyof InvestmentConfig },
        { key: 'loan', label: '融资利率', field: 'loanRate' as keyof InvestmentConfig },
      ]
    : [
        { key: 'freq', label: '调频里程单价', field: 'frequencyMileagePrice' as keyof InvestmentConfig },
        { key: 'cost', label: '初始投资成本', field: 'batteryCostPerKwh' as keyof InvestmentConfig },
        { key: 'kval', label: 'K值', field: 'kValue' as keyof InvestmentConfig },
        { key: 'loan', label: '融资利率', field: 'loanRate' as keyof InvestmentConfig },
      ];

  return params.map(p => {
    const baseVal = cfg[p.field] as number;
    const vals = v.map(pct => {
      const newVal = baseVal * (1 + pct / 100);
      return +calcNPV({ [p.field]: newVal }).toFixed(2);
    });
    return {
      key: p.key,
      parameter: p.label,
      v_neg20: vals[0],
      v_neg10: vals[1],
      v_0: vals[2],
      v_pos10: vals[3],
      v_pos20: vals[4],
    };
  });

  void baseNPV; // used for reference
}

// ─── 默认配置 ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: InvestmentConfig = {
  projectName: '广州某储能示范项目',
  region: '广东省广州市',
  storageType: 'commercial',
  selectedModels: ['peakValley'],

  benchmarkRate: 8,
  calcPeriod: 15,
  discountRate: 8,
  inflationRate: 2,
  incomeTaxRate: 25,
  vatRate: 13,

  equityRatio: 30,
  loanRate: 5,
  loanTerm: 10,

  batteryType: 'LFP',
  ratedCapacity: 10,
  ratedPower: 5,
  chargeDischargeEfficiency: 90,
  dailyCycles: 1,
  cycleLife: 6000,
  annualDegradation: 2.5,

  batteryCostPerKwh: 900,
  pcsCostPerKw: 350,
  bmsCostPerKwh: 50,
  civilCost: 50,
  gridConnectionCost: 30,
  annualOmRate: 1.5,
  insuranceRate: 0.5,
  annualRent: 10,
  electricityBuyPrice: 0.6,

  peakValleySpread: 0.7,
  frequencyMileage: 30,
  frequencyMileagePrice: 0.018,
  kValue: 1.0,
  peakRegPrice: 120,
  peakRegHours: 1200,
  peakRegUtilization: 80,
  capacityLeasePerMW: 15,
  spotSpread: 0.5,
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function InvestmentCalculator() {
  const [cfg, setCfg] = useState<InvestmentConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState('1');

  const set = <K extends keyof InvestmentConfig>(key: K, val: InvestmentConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: val }));

  const results = useMemo(() => calculateAll(cfg), [cfg]);
  const sensitivity = useMemo(() => computeSensitivity(cfg), [cfg]);

  const autoTotalInv = results.totalInvestment;

  // 容量衰减曲线
  const degradationData = Array.from({ length: cfg.calcPeriod }, (_, i) => ({
    year: `第${i + 1}年`,
    capacity: +(cfg.ratedCapacity * Math.pow(1 - cfg.annualDegradation / 100, i)).toFixed(2),
  }));

  // 资本结构饼图
  const equityAmt = +(autoTotalInv * cfg.equityRatio / 100).toFixed(2);
  const debtAmt = +(autoTotalInv * (1 - cfg.equityRatio / 100)).toFixed(2);
  const capitalPie = [
    { name: '资本金', value: equityAmt, color: '#00d4ff' },
    { name: '银行贷款', value: debtAmt, color: '#ffb800' },
  ];

  // 还款计划
  const repayRows = Array.from({ length: cfg.loanTerm }, (_, i) => {
    const year = i + 1;
    const principal = +(debtAmt / cfg.loanTerm).toFixed(2);
    const remaining = +(debtAmt - principal * i).toFixed(2);
    const interest = +(remaining * cfg.loanRate / 100).toFixed(2);
    return { key: year, year: `第${year}年`, principal, interest, total: +(principal + interest).toFixed(2), remaining: +(remaining - principal).toFixed(2) };
  });

  // 成本构成柱状图
  const costBreakdown = [
    { name: '电池系统', value: results.batteryCapex, color: '#00d4ff' },
    { name: 'PCS', value: results.pcsCapex, color: '#00ff88' },
    { name: 'BMS/EMS', value: results.bmsCapex, color: '#ffb800' },
    { name: '土建安装', value: results.civilCapex, color: '#a78bfa' },
    { name: '并网费用', value: results.gridCapex, color: '#38bdf8' },
  ].filter(d => d.value > 0);

  // IRR 评级
  const irrRating = isNaN(results.irr)
    ? 'na'
    : results.irr >= cfg.benchmarkRate * 1.2 ? 'excellent'
    : results.irr >= cfg.benchmarkRate ? 'pass'
    : results.irr >= cfg.benchmarkRate * 0.8 ? 'marginal'
    : 'fail';

  const irrColor: Record<string, string> = {
    excellent: '#00ff88', pass: '#00d4ff', marginal: '#ffb800', fail: '#ff4d4d', na: '#4a6080',
  };
  const irrLabel: Record<string, string> = {
    excellent: '优秀', pass: '达标', marginal: '勉强', fail: '不达标', na: '无法计算',
  };

  // 导出 CSV
  const handleExport = () => {
    const rows: string[] = ['\uFEFF项目名称,' + cfg.projectName];
    rows.push('储能类型,' + (cfg.storageType === 'commercial' ? '工商业储能' : '电网侧储能'));
    rows.push('总投资(万元),' + autoTotalInv);
    rows.push('NPV(万元),' + results.npv);
    rows.push('IRR(%),' + (isNaN(results.irr) ? '-' : results.irr));
    rows.push('静态回收期(年),' + (isFinite(results.staticPayback) ? results.staticPayback : '-'));
    rows.push('动态回收期(年),' + (isFinite(results.dynamicPayback) ? results.dynamicPayback : '-'));
    rows.push('');
    rows.push('年度,年收益(万),运维费用(万),还贷支出(万),净现金流(万),折现现金流(万),累计净现金流(万)');
    results.yearlyRows.forEach(r => {
      rows.push(`${r.year},${r.revenue},${r.opex},${r.debtService},${r.netCashFlow},${r.discountedCF},${r.cumulativeCF}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `投资测算报告_${cfg.projectName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Tab 内容 ──────────────────────────────────────────────────────────────

  const Tab1 = (
    <Row gutter={[24, 0]}>
      <Col span={12}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>项目基本信息</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item label={<span style={labelStyle}>项目名称</span>}>
              <Input value={cfg.projectName} onChange={e => set('projectName', e.target.value)} style={inputStyle} />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>所在地区</span>}>
              <Input value={cfg.region} onChange={e => set('region', e.target.value)} style={inputStyle} />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>储能类型</span>}>
              <Radio.Group
                value={cfg.storageType}
                onChange={e => {
                  set('storageType', e.target.value);
                  set('selectedModels', e.target.value === 'commercial' ? ['peakValley'] : ['peakReg']);
                }}
              >
                <Radio.Button value="commercial">工商业储能</Radio.Button>
                <Radio.Button value="grid">电网侧储能</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>评价基准年</span>}>
              <InputNumber value={2026} disabled style={{ ...inputStyle, width: '100%' }} />
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col span={12}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>经济评价依据</span>}>
          <div style={{ color: '#aab4c8', fontSize: 13, lineHeight: 2 }}>
            <div>• 依据 <Tag color="blue">国家发改委 2023 年储能政策</Tag> 开展经济评价</div>
            <div>• 参照 <Tag color="blue">GB/T 51161</Tag> 储能系统工程规范</div>
            <div>• 执行 <Tag color="geekblue">建设项目经济评价方法与参数（第三版）</Tag></div>
            <div style={{ marginTop: 12, color: '#4a6080', fontSize: 12 }}>
              {cfg.storageType === 'commercial'
                ? '工商业储能以峰谷套利为主要收益来源，辅以需求响应和容量费管理，适用于用电量大、峰谷差价显著的工商业用户。'
                : '电网侧储能参与调峰、调频辅助服务及容量租赁市场，收益来源多元，适用于大规模独立储能项目。'}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const Tab2 = (
    <Row gutter={[16, 16]}>
      {(cfg.storageType === 'commercial' ? COMMERCIAL_MODELS : GRID_MODELS).map(m => (
        <Col span={8} key={m.value}>
          <Card
            style={{
              ...cardStyle,
              border: cfg.selectedModels.includes(m.value)
                ? '1px solid rgba(0,212,255,0.5)'
                : '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => {
              const next = cfg.selectedModels.includes(m.value)
                ? cfg.selectedModels.filter(x => x !== m.value)
                : [...cfg.selectedModels, m.value];
              set('selectedModels', next.length > 0 ? next : [m.value]);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Checkbox checked={cfg.selectedModels.includes(m.value)} style={{ marginTop: 2 }} />
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{m.label}</div>
                <div style={{ color: '#6b7280', fontSize: 12 }}>{m.desc}</div>
              </div>
            </div>
          </Card>
        </Col>
      ))}
      {cfg.selectedModels.length === 0 && (
        <Col span={24}>
          <div style={{ color: '#ffb800', fontSize: 12, textAlign: 'center', padding: 16 }}>请至少选择一种商业模式</div>
        </Col>
      )}
    </Row>
  );

  const Tab3 = (
    <Row gutter={[24, 0]}>
      <Col span={12}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>财务评价参数</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            {[
              { label: '基准收益率（%）', key: 'benchmarkRate' as const, tip: '项目可接受的最低收益率，通常参照行业基准' },
              { label: '计算期（年）', key: 'calcPeriod' as const, tip: '项目经济评价的总年限' },
              { label: '折现率（%）', key: 'discountRate' as const, tip: '将未来现金流折算为现值的利率' },
              { label: '通货膨胀率（%）', key: 'inflationRate' as const, tip: '年均物价上涨率' },
              { label: '所得税率（%）', key: 'incomeTaxRate' as const, tip: '企业所得税率，一般企业为25%' },
              { label: '增值税率（%）', key: 'vatRate' as const, tip: '电力销售适用增值税率' },
            ].map(({ label, key, tip }) => (
              <Form.Item key={key} label={
                <span style={labelStyle}>{label} <Tooltip title={tip}><InfoCircleOutlined style={{ color: '#4a6080', marginLeft: 4 }} /></Tooltip></span>
              }>
                <InputNumber
                  value={cfg[key] as number}
                  onChange={v => set(key, v ?? 0)}
                  min={0}
                  max={key === 'calcPeriod' ? 30 : 100}
                  step={key === 'calcPeriod' ? 1 : 0.5}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Form.Item>
            ))}
          </Form>
        </Card>
      </Col>
      <Col span={12}>
        <Card style={{ ...cardStyle, height: '100%' }} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>参数说明</span>}>
          <div style={{ color: '#4a6080', fontSize: 12, lineHeight: 2.2 }}>
            <div><span style={{ color: '#00d4ff' }}>基准收益率：</span>通常取 6%~10%，储能项目推荐 8%</div>
            <div><span style={{ color: '#00d4ff' }}>计算期：</span>储能电池寿命约 10~15 年，建议与电池寿命匹配</div>
            <div><span style={{ color: '#00d4ff' }}>折现率：</span>反映资金时间价值，通常取与基准收益率相同</div>
            <div><span style={{ color: '#00d4ff' }}>所得税率：</span>高新技术企业可享受 15% 优惠税率</div>
            <div><span style={{ color: '#00d4ff' }}>增值税：</span>储能参与电力市场按 9%~13% 执行，以实际税务筹划为准</div>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const Tab4 = (
    <Row gutter={[16, 16]}>
      <Col span={10}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>资金筹措方案</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item label={<span style={labelStyle}>总投资额（万元，自动计算）</span>}>
              <InputNumber value={autoTotalInv} disabled style={{ ...inputStyle, width: '100%' }} addonAfter="万元" />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>资本金比例（%）</span>}>
              <InputNumber value={cfg.equityRatio} onChange={v => set('equityRatio', v ?? 30)} min={20} max={100} style={{ ...inputStyle, width: '100%' }} />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>贷款利率（%/年）</span>}>
              <InputNumber value={cfg.loanRate} onChange={v => set('loanRate', v ?? 5)} min={1} max={15} step={0.1} style={{ ...inputStyle, width: '100%' }} />
            </Form.Item>
            <Form.Item label={<span style={labelStyle}>贷款期限（年）</span>}>
              <InputNumber value={cfg.loanTerm} onChange={v => set('loanTerm', v ?? 10)} min={1} max={20} style={{ ...inputStyle, width: '100%' }} />
            </Form.Item>
            <div style={{ color: '#aab4c8', fontSize: 12, marginTop: 8 }}>
              <div>资本金：<span style={{ color: '#00d4ff', fontWeight: 600 }}>¥{equityAmt} 万元</span></div>
              <div>贷款额：<span style={{ color: '#ffb800', fontWeight: 600 }}>¥{debtAmt} 万元</span></div>
            </div>
          </Form>
        </Card>
      </Col>
      <Col span={7}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>资本结构</span>}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={capitalPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {capitalPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`¥${Number(v).toFixed(1)}万`, '']} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col span={7}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>还款计划</span>}>
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            <Table
              dataSource={repayRows}
              size="small"
              pagination={false}
              columns={[
                { title: '年份', dataIndex: 'year', width: 60 },
                { title: '本金(万)', dataIndex: 'principal', render: (v: number) => v.toFixed(1) },
                { title: '利息(万)', dataIndex: 'interest', render: (v: number) => v.toFixed(1) },
                { title: '合计(万)', dataIndex: 'total', render: (v: number) => <span style={{ color: '#ffb800' }}>{v.toFixed(1)}</span> },
              ]}
            />
          </div>
        </Card>
      </Col>
    </Row>
  );

  const Tab5 = (
    <Row gutter={[16, 16]}>
      <Col span={10}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>电池技术参数</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            <Form.Item label={<span style={labelStyle}>电池类型</span>}>
              <Select value={cfg.batteryType} onChange={v => set('batteryType', v)} style={{ width: '100%' }}
                options={[{ value: 'LFP', label: '磷酸铁锂（LFP）- 推荐' }, { value: 'NMC', label: '三元锂（NMC）' }]} />
            </Form.Item>
            {[
              { label: '额定容量（MWh）', key: 'ratedCapacity' as const, min: 0.1, step: 0.5 },
              { label: '额定功率（MW）', key: 'ratedPower' as const, min: 0.1, step: 0.5 },
              { label: '充放电效率（%）', key: 'chargeDischargeEfficiency' as const, min: 70, max: 100, step: 1 },
              { label: '日循环次数（次/天）', key: 'dailyCycles' as const, min: 0.5, max: 3, step: 0.5 },
              { label: '循环寿命（次）', key: 'cycleLife' as const, min: 1000, max: 12000, step: 500 },
              { label: '年衰减率（%）', key: 'annualDegradation' as const, min: 0, max: 10, step: 0.5 },
            ].map(({ label, key, ...rest }) => (
              <Form.Item key={key} label={<span style={labelStyle}>{label}</span>}>
                <InputNumber
                  value={cfg[key] as number}
                  onChange={v => set(key, v ?? 0)}
                  style={{ ...inputStyle, width: '100%' }}
                  {...rest}
                />
              </Form.Item>
            ))}
          </Form>
        </Card>
      </Col>
      <Col span={14}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>容量衰减曲线（计算期内）</span>}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={degradationData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#4a6080" tick={{ fontSize: 11 }} interval={Math.floor(cfg.calcPeriod / 5)} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit=" MWh" />
              <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`${Number(v).toFixed(2)} MWh`, '有效容量']} />
              <Line type="monotone" dataKey="capacity" stroke="#00d4ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ color: '#4a6080', fontSize: 11, marginTop: 8, textAlign: 'center' }}>
            初始容量 {cfg.ratedCapacity} MWh → 期末容量 {degradationData[degradationData.length - 1]?.capacity ?? 0} MWh
            （年衰减 {cfg.annualDegradation}%）
          </div>
        </Card>
      </Col>
    </Row>
  );

  const Tab6 = (
    <Row gutter={[16, 16]}>
      <Col span={10}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>初始投资（元/kWh 或 元/kW）</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            {[
              { label: '电池系统（元/kWh）', key: 'batteryCostPerKwh' as const },
              { label: 'PCS 变流器（元/kW）', key: 'pcsCostPerKw' as const },
              { label: 'BMS/EMS（元/kWh）', key: 'bmsCostPerKwh' as const },
              { label: '土建安装（万元）', key: 'civilCost' as const },
              { label: '并网费用（万元）', key: 'gridConnectionCost' as const },
            ].map(({ label, key }) => (
              <Form.Item key={key} label={<span style={labelStyle}>{label}</span>}>
                <InputNumber
                  value={cfg[key] as number}
                  onChange={v => set(key, v ?? 0)}
                  min={0}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Form.Item>
            ))}
            <div style={{ color: '#00d4ff', fontWeight: 600, fontSize: 14, marginTop: 8 }}>
              总投资：¥{autoTotalInv} 万元
            </div>
          </Form>
        </Card>
      </Col>
      <Col span={7}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>年运营成本</span>}>
          <Form layout="vertical" style={{ marginTop: 8 }}>
            {[
              { label: '年运维费率（%）', key: 'annualOmRate' as const, step: 0.1 },
              { label: '年保险费率（%）', key: 'insuranceRate' as const, step: 0.1 },
              { label: '年场地租金（万元）', key: 'annualRent' as const },
              { label: '购电价格（元/kWh）', key: 'electricityBuyPrice' as const, step: 0.01 },
            ].map(({ label, key, step }) => (
              <Form.Item key={key} label={<span style={labelStyle}>{label}</span>}>
                <InputNumber
                  value={cfg[key] as number}
                  onChange={v => set(key, v ?? 0)}
                  min={0}
                  step={step ?? 1}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </Form.Item>
            ))}
            <div style={{ color: '#aab4c8', fontSize: 12, marginTop: 8 }}>
              年运营成本约：<span style={{ color: '#ffb800' }}>
                ¥{(autoTotalInv * (cfg.annualOmRate + cfg.insuranceRate) / 100 + cfg.annualRent).toFixed(2)} 万元
              </span>
            </div>
          </Form>
        </Card>
      </Col>
      <Col span={7}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>投资构成</span>}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costBreakdown} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" stroke="#4a6080" tick={{ fontSize: 11 }} unit="万" />
              <YAxis type="category" dataKey="name" stroke="#4a6080" tick={{ fontSize: 11 }} width={60} />
              <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`¥${Number(v).toFixed(1)}万`, '']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {costBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );

  const Tab7 = () => {
    const availModels = cfg.storageType === 'commercial' ? COMMERCIAL_MODELS : GRID_MODELS;
    const selectedModelLabels = availModels.filter(m => cfg.selectedModels.includes(m.value)).map(m => m.label);

    const yearlyColumns: ColumnType<YearlyRow>[] = [
      { title: '年份', dataIndex: 'year', width: 70, fixed: 'left' },
      { title: '年收益(万)', dataIndex: 'revenue', render: (v: number) => <span style={{ color: '#00ff88' }}>{v.toFixed(2)}</span> },
      { title: '运维成本(万)', dataIndex: 'opex', render: (v: number) => <span style={{ color: '#ffb800' }}>{v.toFixed(2)}</span> },
      { title: '还贷(万)', dataIndex: 'debtService', render: (v: number) => <span style={{ color: '#ff4d4d' }}>{v.toFixed(2)}</span> },
      { title: '净现金流(万)', dataIndex: 'netCashFlow', render: (v: number) => <span style={{ color: v >= 0 ? '#00d4ff' : '#ff4d4d', fontWeight: 600 }}>{v.toFixed(2)}</span> },
      { title: '累计净现金流(万)', dataIndex: 'cumulativeCF', render: (v: number) => <span style={{ color: v >= 0 ? '#00ff88' : '#ff4d4d' }}>{v.toFixed(2)}</span> },
    ];

    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={cardStyle} styles={{ header: headStyle }}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#00d4ff' }}>收益测算参数</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {selectedModelLabels.map(l => <Tag key={l} color="blue">{l}</Tag>)}
                </div>
              </div>
            }
          >
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              {cfg.selectedModels.includes('peakValley') && (
                <Col span={6}>
                  <span style={labelStyle}>峰谷价差（元/kWh）</span>
                  <InputNumber value={cfg.peakValleySpread} onChange={v => set('peakValleySpread', v ?? 0)} step={0.05} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
              )}
              {cfg.selectedModels.includes('frequency') && <>
                <Col span={6}>
                  <span style={labelStyle}>调频里程（MWh/MW/天）</span>
                  <InputNumber value={cfg.frequencyMileage} onChange={v => set('frequencyMileage', v ?? 0)} step={1} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
                <Col span={6}>
                  <span style={labelStyle}>里程单价（元/MWh）</span>
                  <InputNumber value={cfg.frequencyMileagePrice} onChange={v => set('frequencyMileagePrice', v ?? 0)} step={0.001} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
                <Col span={6}>
                  <span style={labelStyle}>K值</span>
                  <InputNumber value={cfg.kValue} onChange={v => set('kValue', v ?? 1)} step={0.05} min={0} max={2} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
              </>}
              {cfg.selectedModels.includes('peakReg') && <>
                <Col span={6}>
                  <span style={labelStyle}>调峰单价（元/MW·h）</span>
                  <InputNumber value={cfg.peakRegPrice} onChange={v => set('peakRegPrice', v ?? 0)} step={5} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
                <Col span={6}>
                  <span style={labelStyle}>年调峰小时数</span>
                  <InputNumber value={cfg.peakRegHours} onChange={v => set('peakRegHours', v ?? 0)} step={100} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
                <Col span={6}>
                  <span style={labelStyle}>容量利用率（%）</span>
                  <InputNumber value={cfg.peakRegUtilization} onChange={v => set('peakRegUtilization', v ?? 0)} step={5} min={0} max={100} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
              </>}
              {cfg.selectedModels.includes('capacityLease') && (
                <Col span={6}>
                  <span style={labelStyle}>容量租金（万/MW/年）</span>
                  <InputNumber value={cfg.capacityLeasePerMW} onChange={v => set('capacityLeasePerMW', v ?? 0)} step={1} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
              )}
              {cfg.selectedModels.includes('spotArbitrage') && (
                <Col span={6}>
                  <span style={labelStyle}>现货价差（元/kWh）</span>
                  <InputNumber value={cfg.spotSpread} onChange={v => set('spotSpread', v ?? 0)} step={0.05} min={0} style={{ ...inputStyle, width: '100%', marginTop: 4 }} />
                </Col>
              )}
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>逐年收益明细</span>}>
            <Table
              dataSource={results.yearlyRows}
              columns={yearlyColumns}
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>累计现金流曲线</span>}>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={results.yearlyRows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="#4a6080" tick={{ fontSize: 10 }} interval={Math.floor(cfg.calcPeriod / 5)} />
                <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit="万" />
                <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`¥${Number(v).toFixed(1)}万`, '']} />
                <ReferenceLine y={0} stroke="#ffb800" strokeDasharray="4 4" label={{ value: '回收期', fill: '#ffb800', fontSize: 11 }} />
                <Legend />
                <Line type="monotone" dataKey="cumulativeCF" name="累计净现金流" stroke="#00d4ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumulativeDiscountedCF" name="累计折现现金流" stroke="#00ff88" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  // ─── Tab8：投资回报汇总 ────────────────────────────────────────────────────
  const totalRevenue = results.yearlyRows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = results.yearlyRows.reduce((s, r) => s + r.opex + r.debtService, 0);
  const totalNCF = results.yearlyRows.reduce((s, r) => s + r.netCashFlow, 0);
  const avgRevenue = totalRevenue / cfg.calcPeriod;

  const summaryTableData = [
    { key: 'inv', label: '项目总投资', value: `¥${autoTotalInv.toFixed(2)} 万元`, highlight: false },
    { key: 'eq', label: '资本金（自有资金）', value: `¥${(autoTotalInv * cfg.equityRatio / 100).toFixed(2)} 万元（${cfg.equityRatio}%）`, highlight: false },
    { key: 'debt', label: '银行贷款', value: `¥${(autoTotalInv * (1 - cfg.equityRatio / 100)).toFixed(2)} 万元（${100 - cfg.equityRatio}%）`, highlight: false },
    { key: 'cap', label: '储能规模', value: `${cfg.ratedCapacity} MWh / ${cfg.ratedPower} MW`, highlight: false },
    { key: 'model', label: '盈利模式', value: (cfg.storageType === 'commercial' ? COMMERCIAL_MODELS : GRID_MODELS).filter(m => cfg.selectedModels.includes(m.value)).map(m => m.label).join('、'), highlight: false },
    { key: 'avgrev', label: '年均收益', value: `¥${avgRevenue.toFixed(2)} 万元/年`, highlight: true },
    { key: 'totalrev', label: `计算期（${cfg.calcPeriod}年）累计收益`, value: `¥${totalRevenue.toFixed(2)} 万元`, highlight: true },
    { key: 'totalcost', label: `计算期累计成本（运维+还贷）`, value: `¥${totalCost.toFixed(2)} 万元`, highlight: false },
    { key: 'totalncf', label: '计算期净现金流合计', value: `¥${totalNCF.toFixed(2)} 万元`, highlight: true },
    { key: 'npv', label: 'NPV（净现值）', value: isNaN(results.npv) ? '-' : `¥${results.npv.toFixed(2)} 万元`, highlight: true },
    { key: 'irr', label: 'IRR（内部收益率）', value: isNaN(results.irr) ? '-' : `${results.irr}%（基准 ${cfg.benchmarkRate}%）`, highlight: true },
    { key: 'sp', label: '静态投资回收期', value: isFinite(results.staticPayback) ? `${results.staticPayback.toFixed(1)} 年` : '超出计算期', highlight: false },
    { key: 'dp', label: '动态投资回收期', value: isFinite(results.dynamicPayback) ? `${results.dynamicPayback} 年` : '超出计算期', highlight: false },
    { key: 'roi', label: '总投资收益率（年均）', value: `${results.roi.toFixed(1)}%`, highlight: false },
    { key: 'eroi', label: '资本金收益率（年均）', value: `${results.equityROI.toFixed(1)}%`, highlight: false },
    { key: 'rating', label: '综合评价', value: irrLabel[irrRating], highlight: true },
  ];

  const Tab8 = (
    <Row gutter={[16, 16]}>
      {/* 顶部 KPI 卡片 */}
      <Col span={24}>
        <Row gutter={[12, 12]}>
          {[
            { label: 'NPV 净现值', value: isNaN(results.npv) ? '-' : `¥${results.npv.toFixed(1)}万`, color: results.npv >= 0 ? '#00ff88' : '#ff4d4d', tip: 'NPV > 0 表示项目在设定折现率下可盈利' },
            { label: 'IRR 内部收益率', value: isNaN(results.irr) ? '-' : `${results.irr}%`, color: irrColor[irrRating], tip: `IRR > 基准 ${cfg.benchmarkRate}% 视为项目可行` },
            { label: '静态回收期', value: isFinite(results.staticPayback) ? `${results.staticPayback.toFixed(1)}年` : '超期', color: isFinite(results.staticPayback) && results.staticPayback <= cfg.calcPeriod ? '#00d4ff' : '#ff4d4d', tip: '不考虑资金时间价值的回收期' },
            { label: '动态回收期', value: isFinite(results.dynamicPayback) ? `${results.dynamicPayback}年` : '超期', color: isFinite(results.dynamicPayback) && results.dynamicPayback <= cfg.calcPeriod ? '#00d4ff' : '#ff4d4d', tip: '折现后的投资回收期' },
            { label: '年均收益', value: `¥${avgRevenue.toFixed(1)}万`, color: '#00ff88', tip: `计算期 ${cfg.calcPeriod} 年年均收益` },
            { label: '总投资收益率', value: `${results.roi.toFixed(1)}%`, color: '#a78bfa', tip: '年均收益 / 总投资' },
          ].map(item => (
            <Col key={item.label} span={4}>
              <Card style={cardStyle} styles={{ body: { padding: '14px 16px' } }}>
                <Tooltip title={item.tip}>
                  <div style={{ color: '#4a6080', fontSize: 11, marginBottom: 4, cursor: 'help' }}>
                    {item.label} <InfoCircleOutlined style={{ fontSize: 10 }} />
                  </div>
                </Tooltip>
                <div style={{ color: item.color, fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{item.value}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>

      {/* 综合评价徽章 + 项目概况汇总表 */}
      <Col span={6}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>综合评价</span>}>
          <div style={{ textAlign: 'center', padding: '16px 0 12px' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', margin: '0 auto 12px',
              background: `${irrColor[irrRating]}20`, border: `3px solid ${irrColor[irrRating]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: irrColor[irrRating],
            }}>
              {irrLabel[irrRating]}
            </div>
            <div style={{ color: '#aab4c8', fontSize: 12 }}>
              {irrRating === 'excellent' && `IRR ${results.irr}% 远高于基准`}
              {irrRating === 'pass' && `IRR ${results.irr}% ≥ 基准 ${cfg.benchmarkRate}%`}
              {irrRating === 'marginal' && `IRR ${results.irr}% 略低于基准`}
              {irrRating === 'fail' && `IRR 低于基准，建议优化参数`}
              {irrRating === 'na' && '收益不足以覆盖投资'}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, fontSize: 12 }}>
            {[
              { label: '总投资', val: `¥${autoTotalInv}万` },
              { label: '期末累计净CF', val: `¥${totalNCF.toFixed(1)}万`, color: totalNCF >= 0 ? '#00ff88' : '#ff4d4d' },
              { label: '项目 NPV', val: `¥${isNaN(results.npv) ? '-' : results.npv.toFixed(1)}万`, color: results.npv >= 0 ? '#00ff88' : '#ff4d4d' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#4a6080' }}>{r.label}</span>
                <span style={{ color: r.color ?? '#e2e8f0', fontWeight: 600 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* 投资回报汇总表格 */}
      <Col span={18}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>投资回报汇总表</span>}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {summaryTableData.map((row, i) => (
                <tr key={row.key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '8px 16px', color: '#6b7280', width: '45%', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: row.highlight ? 600 : 400 }}>
                    <span style={{ color: row.highlight ? '#00d4ff' : '#e2e8f0' }}>{row.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Col>

      {/* 年度收益 vs 成本 柱状图 */}
      <Col span={12}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>逐年收益与成本对比</span>}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={results.yearlyRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#4a6080" tick={{ fontSize: 9 }} interval={Math.floor(cfg.calcPeriod / 6)} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit="万" />
              <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`¥${Number(v).toFixed(1)}万`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenue" name="年收益" fill="#00ff88" radius={[3, 3, 0, 0]} />
              <Bar dataKey="opex" name="运维成本" fill="#ffb800" stackId="cost" />
              <Bar dataKey="debtService" name="还贷支出" fill="#ff4d4d" stackId="cost" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>

      {/* 累计现金流折线图 */}
      <Col span={12}>
        <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>累计现金流曲线（含回收期判断）</span>}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={results.yearlyRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#4a6080" tick={{ fontSize: 9 }} interval={Math.floor(cfg.calcPeriod / 6)} />
              <YAxis stroke="#4a6080" tick={{ fontSize: 11 }} unit="万" />
              <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`¥${Number(v).toFixed(1)}万`, '']} />
              <ReferenceLine y={0} stroke="#ffb800" strokeDasharray="4 4" label={{ value: '回收', fill: '#ffb800', fontSize: 10, position: 'insideRight' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="cumulativeCF" name="累计净现金流" stroke="#00d4ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="cumulativeDiscountedCF" name="累计折现现金流" stroke="#00ff88" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );

  const Tab9 = () => {

    const sensColumns: ColumnType<SensitivityRow>[] = [
      { title: '参数', dataIndex: 'parameter', width: 130 },
      ...([-20, -10, 0, 10, 20] as const).map(pct => ({
        title: `${pct >= 0 ? '+' : ''}${pct}%`,
        dataIndex: `v_${pct < 0 ? 'neg' : 'pos'}${Math.abs(pct)}` as keyof SensitivityRow,
        render: (v: number) => {
          const base = sensitivity.find(r => r.parameter === sensitivity[0].parameter)?.v_0 ?? 0;
          void base;
          return <span style={{ color: v >= 0 ? '#00ff88' : '#ff4d4d' }}>{v.toFixed(1)}</span>;
        },
      })),
    ];

    // 龙卷风图：各参数±20%时NPV变化范围
    const tornadoData = sensitivity.map(row => ({
      parameter: row.parameter,
      low: row.v_neg20,
      high: row.v_pos20,
      range: row.v_pos20 - row.v_neg20,
    })).sort((a, b) => b.range - a.range);

    return (
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>NPV 敏感性分析（万元）</span>}>
            <Table
              dataSource={sensitivity}
              columns={sensColumns}
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={24}>
          <Card style={cardStyle} styles={{ header: headStyle }} title={<span style={{ color: '#00d4ff' }}>龙卷风图（NPV 对各参数±20%变化的响应）</span>}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tornadoData} layout="vertical" margin={{ left: 30, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" stroke="#4a6080" tick={{ fontSize: 11 }} unit="万" />
                <YAxis type="category" dataKey="parameter" stroke="#4a6080" tick={{ fontSize: 12 }} width={100} />
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <RTooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`NPV: ¥${Number(v).toFixed(1)}万`, '']} />
                <Legend />
                <Bar dataKey="low" name="-20%情景" fill="#ff4d4d" radius={[0, 2, 2, 0]} />
                <Bar dataKey="high" name="+20%情景" fill="#00ff88" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 页面头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#00d4ff', margin: 0, fontSize: 20, letterSpacing: 1 }}>储能投资测算</h2>
          <p style={{ color: '#4a6080', margin: '4px 0 0', fontSize: 12 }}>
            {cfg.storageType === 'commercial' ? '工商业储能' : '电网侧储能'} · {cfg.projectName} · 总投资 ¥{autoTotalInv} 万元
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Row gutter={12}>
            {[
              { label: 'NPV', value: isNaN(results.npv) ? '-' : `¥${results.npv.toFixed(0)}万`, color: results.npv >= 0 ? '#00ff88' : '#ff4d4d' },
              { label: 'IRR', value: isNaN(results.irr) ? '-' : `${results.irr}%`, color: irrColor[irrRating] },
              { label: '静态回收期', value: isFinite(results.staticPayback) ? `${results.staticPayback.toFixed(1)}年` : '-', color: '#00d4ff' },
            ].map(item => (
              <Col key={item.label}>
                <Statistic
                  title={<span style={{ color: '#4a6080', fontSize: 11 }}>{item.label}</span>}
                  value={item.value}
                  valueStyle={{ color: item.color, fontSize: 16, fontWeight: 700 }}
                />
              </Col>
            ))}
          </Row>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            style={{ borderColor: 'rgba(0,212,255,0.3)', color: '#aab4c8' }}
          >
            导出报告
          </Button>
        </div>
      </div>

      {/* 主内容 Tabs */}
      <Card style={cardStyle} styles={{ body: { padding: '0 24px 24px' } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ borderBottom: '1px solid rgba(0,212,255,0.12)', marginBottom: 20 }}
          items={[
            { key: '1', label: <><CalculatorOutlined /> 经济评价依据</>, children: Tab1 },
            { key: '2', label: '商业模式', children: Tab2 },
            { key: '3', label: '财务评价参数', children: Tab3 },
            { key: '4', label: '资金筹措及使用', children: Tab4 },
            { key: '5', label: '电池相关参数', children: Tab5 },
            { key: '6', label: '成本与费用', children: Tab6 },
            { key: '7', label: '收益测算', children: <Tab7 /> },
            { key: '8', label: '投资回报汇总', children: Tab8 },
            { key: '9', label: '敏感性分析', children: <Tab9 /> },
          ]}
        />
      </Card>
    </div>
  );
}
