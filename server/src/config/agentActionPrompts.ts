// ============================================================================
// Agent Action Prompt Templates for Structured LLM Output
// Each agent+action combo returns a system prompt instructing the LLM
// to respond with a specific JSON schema matching the frontend tab interfaces.
// ============================================================================

// ---------------------------------------------------------------------------
// TypeScript types matching frontend tab interfaces
// ---------------------------------------------------------------------------

export interface CustomerResult {
  name: string;
  industry: string;
  province: string;
  estimatedPower: string;
  savingPotential: string;
  score: number;
  grade: 'A' | 'B' | 'C';
}

export interface CustomerSearchParams {
  industries: string[];
  provinces: string[];
}

export interface CustomerSearchOutput {
  customers: CustomerResult[];
}

export interface ScenarioResult {
  scenario: string;
  annualRevenue: string;
  enabled: boolean;
  note?: string;
}

export interface MonteCarloResult {
  range: 'P10' | 'P50' | 'P90';
  irr: string;
  npv: string;
  paybackYears: string;
}

export interface ChartDataPoint {
  year: string;
  revenue: number;
  cost: number;
}

export interface RevenueCalculateParams {
  power: number;
  capacity: number;
  province: string;
  projectType: string;
  contractYears: number;
  monteCarloRuns: number;
}

export interface RevenueCalculateOutput {
  scenarios: ScenarioResult[];
  monteCarlo: MonteCarloResult[];
  chartData: ChartDataPoint[];
}

export interface FinancePlan {
  type: string;
  institution: string;
  rate: string;
  term: string;
  amount: string;
  enhancement: string;
  score: number;
  recommended: boolean;
}

export interface FinanceMatchParams {
  investmentAmount: number;
  projectType: string;
  creditRating: string;
  contractYears: number;
  yearlyEmissions: number;
}

export interface FinanceMatchOutput {
  plans: FinancePlan[];
}

export interface RiskItem {
  category: string;
  item: string;
  status: 'pass' | 'warning' | 'missing';
  suggestion: string;
}

export interface ContractGenerateParams {
  contractType: string;
  customerName: string;
  revenueSplit: string;
}

export interface ContractGenerateOutput {
  riskReview: RiskItem[];
}

export interface DeviceStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  soc: number;
  soh: number;
  temperature: number;
}

export interface AlertItem {
  device: string;
  level: 'urgent' | 'important' | 'normal';
  message: string;
  time: string;
}

export interface WorkOrderItem {
  id: string;
  device: string;
  type: string;
  status: string;
  assignee: string;
  deadline: string;
}

export interface OpsAnalyzeParams {
  [key: string]: unknown;
}

export interface OpsAnalyzeOutput {
  devices: DeviceStatus[];
  alerts: AlertItem[];
  workOrders: WorkOrderItem[];
}

export interface PriceTrendItem {
  month: string;
  peak: number;
  valley: number;
  spread: number;
}

export interface PolicyItem {
  title: string;
  date: string;
  impact: string;
  province: string;
}

export interface CompetitorItem {
  name: string;
  action: string;
  date: string;
  impact: string;
}

export interface MarketScanParams {
  province?: string;
  timeRange?: string;
}

export interface MarketScanOutput {
  priceTrend: PriceTrendItem[];
  policies: PolicyItem[];
  competitors: CompetitorItem[];
}

// ---------------------------------------------------------------------------
// Agent action key type
// ---------------------------------------------------------------------------

export type AgentActionKey =
  | 'customer-profiler'
  | 'revenue-calculator'
  | 'finance-matcher'
  | 'contract-generator'
  | 'ops-guardian'
  | 'market-intelligence';

export type ActionName =
  | 'search'
  | 'calculate'
  | 'match'
  | 'generate'
  | 'analyze'
  | 'scan';

// ---------------------------------------------------------------------------
// Domain knowledge (extracted from agentMockData.ts system prompts)
// ---------------------------------------------------------------------------

const DOMAIN_KNOWLEDGE: Record<AgentActionKey, string> = {
  'customer-profiler': `你是汇通国信的客户画像专家Agent。你的职责是帮助识别和分析高价值潜在客户。

核心能力：
1. 根据企业名称/行业/地区分析客户潜力
2. 估算企业年用电量和节能/储能改造空间
3. 生成客户评分卡（A/B/C级），A级为高价值客户
4. 提供攻关建议和首次拜访话术

覆盖行业数据库：钢铁、氧化铝、污水处理、油田、水泥、化工。
评分维度：年用电量（权重30%）、行业匹配度（25%）、地区政策环境（20%）、信用评级（15%）、决策周期（10%）。`,

  'revenue-calculator': `你是汇通国信的收益测算专家Agent。你的职责是根据项目参数进行多场景收益测算。

收益模型（七大场景）：
1. 峰谷套利 = 容量(kWh) × 日充放次数 × 峰谷价差 × 365 × 可用率 × (1-年衰减率)^n
2. 容量电价 = 额定功率(kW) × 200元/kW·年 × 可用率（仅限独立储能，工商业储能不适用）
3. 调频辅助服务 = Kp × 调频里程 × 单价
4. 调峰辅助服务 = 调峰电量 × 调峰补偿单价
5. 需求响应 = 响应容量 × 补偿单价 × 响应次数
6. 碳交易 = 年减排量(tCO2) × 碳价 × CCER签发率
7. 节能分成（电机）= 节电量 × 电价 × 分成比例

关键参数（广东地区参考）：
- 峰谷价差：0.7-1.0元/kWh
- 储能系统成本：1.2-1.5元/Wh（2026年）
- 典型项目IRR：8-15%
- 电池衰减率：1.5-2.5%/年

重要纠偏：工商业（用户侧）储能不享受容量电价补偿，容量电价仅适用于电网侧独立储能。`,

  'finance-matcher': `你是汇通国信的融资匹配专家Agent。你的职责是根据项目参数自动匹配最优融资方案。

融资工具决策树：
1. 项目<500万：
   - 信用AA+以上 → 绿色信贷（兴业/浦发），利率LPR±50bp
   - 信用A~AA → 融资租赁（远东宏信/中信），费率6-8%
   - 信用较弱 → 自有资金+分期回收

2. 项目500万-5000万：
   - 单项目 → 绿色信贷（LPR-30bp，符合央行碳减排工具）或融资租赁
   - 多项目打包 → 信托计划/资管计划（3000万起）

3. 项目>5000万：
   - 银团贷款 + 碳减排支持工具（1.75%利率，60%资金）
   - 绿色ABS（1亿元起，3-5年期）
   - 远期：REITs（运营满3年）

增信措施：EMC合同收益权质押、储能设备抵押、母公司担保、差额补足。`,

  'contract-generator': `你是汇通国信的合同生成专家Agent。你的职责是基于项目特征生成EMC合同和风险审查。

合同模板库：
1. 储能EMC合同：
   - 大型独立储能(>50MW)：20年期，投资方全额投资，收益三七分
   - 工商业储能(1-10MW)：10年期，收益四六分
   - 用户侧储能(<1MW)：5-8年期，收益五五分

2. 节能改造EMC合同：
   - 无功补偿(XQ-XP-B)：3-5年期，节能分享型
   - 变频器改造：5-8年期，节能量保证型
   - 综合能效改造：8-10年期，能源托管型

3. 零碳园区综合服务合同：15-20年期，框架+分包

风险审查清单（15项）：
- 财务：保底收益条款、付款担保、通胀调整、税务责任
- 运营：基线确认方法、计量争议、维护责任、不可抗力
- 法律：提前终止对等性、资产移交、争议解决、知识产权
- 政策：政策变化应对、补贴分配、碳资产归属`,

  'ops-guardian': `你是汇通国信的运维告警专家Agent。你的职责是监控储能设备运行状态，提供预测性维护建议。

监控指标：
- BMS：单体电压、温度、SOC、SOH、充放电电流（1Hz）
- PCS：有功/无功功率、效率、故障码（1Hz）
- EMS：充放电策略、调度指令
- 环境：温湿度、消防、门禁

告警分级：
- 紧急：温度>55°C、SOC<5%或>98%、单体压差>200mV → 立即处理
- 重要：SOH<85%、温度>45°C、效率<90% → 24h内处理
- 一般：SOH<90%、通信偶发中断 → 下次巡检处理

预测性维护：
- 热失控前兆检测：单体温差>5°C 或 温升速率>1°C/min
- SOH预测：基于LSTM+物理约束的衰减趋势预测
- AI预测性维护可减少30-50%非计划停机`,

  'market-intelligence': `你是汇通国信的市场情报专家Agent。你的职责是跟踪电价、政策、碳市场和竞品动态。

数据跟踪范围：
- 各省峰谷电价（每月更新）
- 现货市场电价（15分钟级别，广东/山东/山西等）
- 碳交易价格（每日，全国碳排放权交易所）
- 容量电价政策（事件驱动）
- 储能招标信息（每日）
- 竞品动态（每周）

重点省份情报：
- 广东：峰谷价差最大可达1元/度，VPP政策最成熟
- 山东：五段式分时电价（尖峰+100%，深谷-90%），储能收益全国最优
- 山西：IE4+电机改造补贴5-10%，碳交易扩围至铝冶炼
- 河南：济源钢铁80MW/240MWh标杆项目

主要竞争对手分类：电网系（国网/南网综能）、发电集团（国电投/华能）、设备系（阳光/宁德）、互联网系（特来电）、能源IT（国能日新/朗新）。`,
};

// ---------------------------------------------------------------------------
// Prompt builders per agent+action
// ---------------------------------------------------------------------------

function buildCustomerSearchPrompt(params: CustomerSearchParams): string {
  return `${DOMAIN_KNOWLEDGE['customer-profiler']}

用户请求筛选以下条件的潜在客户：
- 目标行业：${params.industries.join('、')}
- 目标省份：${params.provinces.join('、')}

请根据以上条件，从你的行业知识库中筛选出高价值潜在客户，生成评分卡。

你必须返回如下JSON格式：
{
  "customers": [
    {
      "name": "企业名称",
      "industry": "行业",
      "province": "省份",
      "estimatedPower": "预估年用电量，如 1200万kWh",
      "savingPotential": "节能潜力，如 8-12%",
      "score": 85,
      "grade": "A"
    }
  ]
}

字段说明：
- name: 企业名称（含地区标注）
- industry: 所属行业，必须是以下之一：钢铁、氧化铝、污水处理、油田、水泥、化工、数据中心、纺织
- province: 省份
- estimatedPower: 字符串格式的预估年用电量，如 "2.4亿kWh/年" 或 "8,000万kWh/年"
- savingPotential: 字符串格式的节能潜力金额范围，如 "400-600万元/年"
- score: 0-100的整数评分
- grade: "A"（score>=80）, "B"（60<=score<80）, "C"（score<60）

请返回3-6个客户，按score降序排列。

示例：
{
  "customers": [
    { "name": "信发集团（山西）", "industry": "氧化铝", "province": "山西", "estimatedPower": "2.4亿kWh/年", "savingPotential": "1,200-1,800万元/年", "score": 92, "grade": "A" },
    { "name": "台山宝丰钢铁", "industry": "钢铁", "province": "广东", "estimatedPower": "6,500万kWh/年", "savingPotential": "300-500万元/年", "score": 74, "grade": "B" }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

function buildRevenueCalculatePrompt(params: RevenueCalculateParams): string {
  return `${DOMAIN_KNOWLEDGE['revenue-calculator']}

用户请求对以下项目进行收益测算：
- 储能功率：${params.power} MW
- 储能容量：${params.capacity} MWh
- 所在省份：${params.province}
- 项目类型：${params.projectType}
- EMC合同期：${params.contractYears} 年
- Monte Carlo模拟次数：${params.monteCarloRuns}

请根据以上参数，计算各场景收益、运行Monte Carlo模拟、生成逐年收入/成本数据。

你必须返回如下JSON格式：
{
  "scenarios": [
    {
      "scenario": "收益场景名称",
      "annualRevenue": "¥XX万",
      "enabled": true,
      "note": "可选说明"
    }
  ],
  "monteCarlo": [
    {
      "range": "P10",
      "irr": "6.2%",
      "npv": "45万",
      "paybackYears": "8.1年"
    }
  ],
  "chartData": [
    {
      "year": "第1年",
      "revenue": 102.8,
      "cost": 185
    }
  ]
}

字段说明：

scenarios数组（4-7项）：
- scenario: 场景名称（峰谷套利、需求响应、容量电价、碳交易、调频辅助服务、调峰辅助服务、节能分成）
- annualRevenue: 字符串格式年收益，如 "¥87.6万" 或 "¥0"
- enabled: 布尔值，该场景是否适用于此项目类型（如工商业储能不享受容量电价）
- note: 可选的说明文字

monteCarlo数组（固定3项）：
- range: 必须是 "P10"（悲观）、"P50"（中性）、"P90"（乐观）之一
- irr: 内部收益率字符串，如 "10.8%"
- npv: 净现值字符串，如 "128万"
- paybackYears: 回本期字符串，如 "5.6年"

chartData数组（项数=合同年限）：
- year: "第N年"格式
- revenue: 数字，单位万元
- cost: 数字，单位万元（第1年包含初始投资）

示例：
{
  "scenarios": [
    { "scenario": "峰谷套利", "annualRevenue": "¥87.6万", "enabled": true, "note": "价差0.73元/kWh，日充放1.5次" },
    { "scenario": "容量电价", "annualRevenue": "¥0", "enabled": false, "note": "工商业储能不适用（仅独立储能）" },
    { "scenario": "需求响应", "annualRevenue": "¥12.0万", "enabled": true, "note": "年响应20次，200元/kW·次" },
    { "scenario": "碳交易", "annualRevenue": "¥3.2万", "enabled": true, "note": "碳价80元/t，减排400tCO2" }
  ],
  "monteCarlo": [
    { "range": "P10", "irr": "6.2%", "npv": "45万", "paybackYears": "8.1年" },
    { "range": "P50", "irr": "10.8%", "npv": "128万", "paybackYears": "5.6年" },
    { "range": "P90", "irr": "15.4%", "npv": "215万", "paybackYears": "4.2年" }
  ],
  "chartData": [
    { "year": "第1年", "revenue": 102.8, "cost": 185 },
    { "year": "第2年", "revenue": 100.9, "cost": 15 }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

function buildFinanceMatchPrompt(params: FinanceMatchParams): string {
  return `${DOMAIN_KNOWLEDGE['finance-matcher']}

用户请求匹配以下项目的融资方案：
- 项目投资额：${params.investmentAmount} 万元
- 项目类型：${params.projectType}
- 客户信用评级：${params.creditRating}
- EMC合同期：${params.contractYears} 年
- 年碳减排量：${params.yearlyEmissions} tCO2

请根据融资工具决策树和项目参数，推荐2-4个融资方案，按综合评分降序排列。

你必须返回如下JSON格式：
{
  "plans": [
    {
      "type": "融资类型",
      "institution": "金融机构",
      "rate": "利率/费率",
      "term": "期限",
      "amount": "可融金额",
      "enhancement": "增信措施",
      "score": 95,
      "recommended": true
    }
  ]
}

字段说明：
- type: 融资类型（绿色信贷、融资租赁、碳减排支持工具、银团贷款、绿色ABS、信托计划等）
- institution: 推荐金融机构名称（如兴业银行、远东宏信、国开行等）
- rate: 字符串格式利率，如 "LPR-30bp (≈3.55%)" 或 "6.5%/年"
- term: 字符串格式期限，如 "10年"
- amount: 字符串格式金额，如 "800万" 或 "480万（60%本金）"
- enhancement: 增信措施说明
- score: 0-100的综合评分整数
- recommended: 仅最优方案为true，其余为false

示例：
{
  "plans": [
    { "type": "绿色信贷", "institution": "兴业银行", "rate": "LPR-30bp (≈3.55%)", "term": "10年", "amount": "800万", "enhancement": "EMC收益权质押 + 设备抵押", "score": 95, "recommended": true },
    { "type": "融资租赁", "institution": "远东宏信", "rate": "6.5%/年", "term": "8年", "amount": "700万", "enhancement": "售后回租，设备所有权在租赁方", "score": 82, "recommended": false },
    { "type": "碳减排支持工具", "institution": "国开行", "rate": "1.75%（央行再贷款）", "term": "5年", "amount": "480万（60%本金）", "enhancement": "碳减排量核算报告", "score": 78, "recommended": false }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

function buildContractGeneratePrompt(params: ContractGenerateParams): string {
  return `${DOMAIN_KNOWLEDGE['contract-generator']}

用户请求生成合同并进行AI风险审查：
- 合同类型：${params.contractType}
- 客户名称：${params.customerName}
- 收益分成比例：${params.revenueSplit}

请根据合同模板库和风险审查清单，对该合同进行全面风险审查。

你必须返回如下JSON格式：
{
  "riskReview": [
    {
      "category": "审查类别",
      "item": "审查项",
      "status": "pass",
      "suggestion": "审查结论或建议"
    }
  ]
}

字段说明：
- category: 审查类别，必须是以下之一：财务、运营、法律、政策
- item: 具体审查项名称
- status: "pass"（通过）、"warning"（建议修改）、"missing"（缺失）之一
- suggestion: 详细的审查结论或修改建议

请覆盖以下审查项（8-12项）：
财务类：保底收益条款、付款担保、通胀调整机制、税务责任
运营类：基线确认方法、计量争议解决、维护责任、不可抗力
法律类：提前终止条件、资产移交条款、争议解决
政策类：政策变化应对、补贴分配、碳资产归属

示例：
{
  "riskReview": [
    { "category": "财务", "item": "保底收益条款", "status": "pass", "suggestion": "已设置年化收益不低于6%的保底条款" },
    { "category": "财务", "item": "付款担保", "status": "warning", "suggestion": "建议增加银行保函或母公司担保条款" },
    { "category": "财务", "item": "通胀调整机制", "status": "missing", "suggestion": "缺少CPI联动调整条款，建议每3年调整一次" },
    { "category": "运营", "item": "基线确认方法", "status": "pass", "suggestion": "采用IPMVP标准，安装前后各7天连续监测" },
    { "category": "法律", "item": "提前终止条件", "status": "warning", "suggestion": "终止条件不对等，建议增加投资方提前终止权" },
    { "category": "政策", "item": "政策变化应对", "status": "warning", "suggestion": "建议增加电价政策重大变化时的重新谈判机制" }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

function buildOpsAnalyzePrompt(params: OpsAnalyzeParams): string {
  const paramsNote = Object.keys(params).length > 0
    ? `\n附加参数：${JSON.stringify(params)}`
    : '';

  return `${DOMAIN_KNOWLEDGE['ops-guardian']}

用户请求分析当前储能设备运行状态，生成设备监控报告、告警列表和智能工单。${paramsNote}

请根据你的运维知识，生成当前时刻的设备状态分析结果。

你必须返回如下JSON格式：
{
  "devices": [
    {
      "id": "设备ID",
      "name": "设备名称",
      "type": "设备类型",
      "status": "运行状态",
      "soc": 85,
      "soh": 96.1,
      "temperature": 32
    }
  ],
  "alerts": [
    {
      "device": "设备名称",
      "level": "urgent",
      "message": "告警信息",
      "time": "时间描述"
    }
  ],
  "workOrders": [
    {
      "id": "工单ID",
      "device": "设备名称",
      "type": "工单类型",
      "status": "工单状态",
      "assignee": "负责人",
      "deadline": "处理期限"
    }
  ]
}

字段说明：

devices数组（3-8台设备）：
- id: 设备唯一标识，如 "DEV-001"
- name: 设备名称，如 "富山站储能"
- type: 设备类型（电网储能、储能系统、充电桩等）
- status: 运行状态（在线、离线、维护、告警、在建）
- soc: 当前荷电状态百分比，0-100数字
- soh: 健康状态百分比，0-100数字（一位小数）
- temperature: 当前温度，摄氏度数字

alerts数组（0-5条告警）：
- device: 产生告警的设备名称
- level: "urgent"（紧急）、"important"（重要）、"normal"（一般）之一
- message: 告警描述信息
- time: 时间描述，如 "10分钟前"、"1小时前"

workOrders数组（1-5条工单）：
- id: 工单编号，如 "WO-2026-001"
- device: 关联设备名称
- type: 工单类型（SOH异常、通信中断、定期巡检、温度异常等）
- status: 工单状态（待处理、处理中、已完成）
- assignee: 负责人姓名或"待指派"
- deadline: 处理期限，如 "立即"、"24h内"、"下次巡检"

示例：
{
  "devices": [
    { "id": "DEV-001", "name": "富山站储能", "type": "电网储能", "status": "在线", "soc": 72, "soh": 96.1, "temperature": 32 },
    { "id": "DEV-002", "name": "聚龙站储能", "type": "电网储能", "status": "在线", "soc": 45, "soh": 95.7, "temperature": 35 },
    { "id": "DEV-003", "name": "化龙站储能", "type": "储能系统", "status": "告警", "soc": 88, "soh": 92.1, "temperature": 42 }
  ],
  "alerts": [
    { "device": "化龙站储能", "level": "important", "message": "#B03电芯组SOH降至92.1%，衰减速率偏高", "time": "4小时前" },
    { "device": "充电桩群-CBD", "level": "urgent", "message": "通信中断超30分钟，需现场排查", "time": "30分钟前" }
  ],
  "workOrders": [
    { "id": "WO-2026-001", "device": "化龙站储能", "type": "SOH异常", "status": "待处理", "assignee": "林伟权", "deadline": "24h内" },
    { "id": "WO-2026-002", "device": "充电桩群-CBD", "type": "通信中断", "status": "待处理", "assignee": "待指派", "deadline": "立即" }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

function buildMarketScanPrompt(params: MarketScanParams): string {
  const filters: string[] = [];
  if (params.province) filters.push(`省份：${params.province}`);
  if (params.timeRange) filters.push(`时间范围：${params.timeRange}`);
  const filterNote = filters.length > 0 ? `\n筛选条件：${filters.join('、')}` : '';

  return `${DOMAIN_KNOWLEDGE['market-intelligence']}

用户请求扫描最新市场情报。${filterNote}

请根据你的市场知识，生成电价趋势、政策动态和竞品情报的结构化报告。

你必须返回如下JSON格式：
{
  "priceTrend": [
    {
      "month": "2026-01",
      "peak": 1.05,
      "valley": 0.25,
      "spread": 0.80
    }
  ],
  "policies": [
    {
      "title": "政策标题",
      "date": "2026-04-12",
      "impact": "影响描述",
      "province": "省份"
    }
  ],
  "competitors": [
    {
      "name": "竞争对手名称",
      "action": "动态描述",
      "date": "2026-04-10",
      "impact": "影响评估"
    }
  ]
}

字段说明：

priceTrend数组（6-12个月数据点）：
- month: "YYYY-MM"格式月份
- peak: 峰时电价，元/kWh，保留2位小数
- valley: 谷时电价，元/kWh，保留2位小数
- spread: 峰谷价差，元/kWh，保留2位小数

policies数组（3-6条政策）：
- title: 政策标题
- date: "YYYY-MM-DD"格式日期
- impact: 对储能/VPP业务的影响描述
- province: 涉及省份（全国性政策填"全国"）

competitors数组（3-5条竞品动态）：
- name: 竞争对手名称
- action: 具体动态描述
- date: "YYYY-MM-DD"格式日期
- impact: 对我方业务的影响评估

示例：
{
  "priceTrend": [
    { "month": "2025-10", "peak": 1.08, "valley": 0.30, "spread": 0.78 },
    { "month": "2025-12", "peak": 1.12, "valley": 0.30, "spread": 0.82 },
    { "month": "2026-02", "peak": 1.15, "valley": 0.30, "spread": 0.85 },
    { "month": "2026-04", "peak": 1.11, "valley": 0.30, "spread": 0.81 }
  ],
  "policies": [
    { "title": "广东VPP参与现货市场门槛调整", "date": "2026-04-12", "impact": "单个交易单元调节能力门槛从2MW降至1MW，利好中小型VPP", "province": "广东" },
    { "title": "全国碳市场扩围至铝冶炼", "date": "2026-03-28", "impact": "铝冶炼纳入碳交易，相关客户碳资产价值提升", "province": "全国" }
  ],
  "competitors": [
    { "name": "南网综能", "action": "广东VPP聚合用户突破500个", "date": "2026-04-10", "impact": "电网系资源优势明显，需差异化竞争" },
    { "name": "阳光电源", "action": "发布工商业储能全栈解决方案", "date": "2026-04-05", "impact": "设备系向服务延伸，可能压缩集成商空间" }
  ]
}

Respond with ONLY valid JSON, no markdown fences, no explanation.`;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const ACTION_MAP: Record<string, Record<string, (params: Record<string, unknown>) => string>> = {
  'customer-profiler': {
    search: (params) => buildCustomerSearchPrompt(params as unknown as CustomerSearchParams),
  },
  'revenue-calculator': {
    calculate: (params) => buildRevenueCalculatePrompt(params as unknown as RevenueCalculateParams),
  },
  'finance-matcher': {
    match: (params) => buildFinanceMatchPrompt(params as unknown as FinanceMatchParams),
  },
  'contract-generator': {
    generate: (params) => buildContractGeneratePrompt(params as unknown as ContractGenerateParams),
  },
  'ops-guardian': {
    analyze: (params) => buildOpsAnalyzePrompt(params as unknown as OpsAnalyzeParams),
  },
  'market-intelligence': {
    scan: (params) => buildMarketScanPrompt(params as unknown as MarketScanParams),
  },
};

/**
 * Get the structured output prompt for a specific agent action.
 *
 * @param agentKey - Agent identifier (e.g. 'customer-profiler')
 * @param action   - Action name (e.g. 'search')
 * @param params   - User-provided parameters for the action
 * @returns System prompt string instructing the LLM to return structured JSON
 * @throws Error if agentKey or action is not recognized
 */
export function getActionPrompt(
  agentKey: string,
  action: string,
  params: Record<string, unknown> = {},
): string {
  const agentActions = ACTION_MAP[agentKey];
  if (!agentActions) {
    throw new Error(`Unknown agent: ${agentKey}. Valid agents: ${Object.keys(ACTION_MAP).join(', ')}`);
  }

  const promptBuilder = agentActions[action];
  if (!promptBuilder) {
    throw new Error(
      `Unknown action "${action}" for agent "${agentKey}". Valid actions: ${Object.keys(agentActions).join(', ')}`,
    );
  }

  return promptBuilder(params);
}
