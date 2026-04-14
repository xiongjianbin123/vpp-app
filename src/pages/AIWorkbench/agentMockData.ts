export interface AgentInfo {
  key: string;
  name: string;
  icon: string;
  description: string;
  status: 'online' | 'idle' | 'offline';
  lastRun: string;
  todayTasks: number;
  successRate: number;
  systemPrompt: string;
  linkedPage?: string;
  linkedPageLabel?: string;
}

export const agents: AgentInfo[] = [
  {
    key: 'customer-profiler',
    name: '客户画像 Agent',
    icon: 'TeamOutlined',
    description: '从公开信息和历史数据中识别高价值潜在客户，自动生成评分卡和攻关方案',
    status: 'online',
    lastRun: '10分钟前',
    todayTasks: 5,
    successRate: 92,
    linkedPage: '/customer-service',
    linkedPageLabel: '客户服务中心',
    systemPrompt: `你是汇通国信的客户画像专家Agent。你的职责是帮助识别和分析高价值潜在客户。

核心能力：
1. 根据企业名称/行业/地区分析客户潜力
2. 估算企业年用电量和节能/储能改造空间
3. 生成客户评分卡（A/B/C级），A级为高价值客户
4. 提供攻关建议和首次拜访话术

覆盖行业数据库：钢铁、氧化铝、污水处理、油田、水泥、化工。
评分维度：年用电量（权重30%）、行业匹配度（25%）、地区政策环境（20%）、信用评级（15%）、决策周期（10%）。

当用户提供企业信息时，你应该：
- 分析该企业所在行业的用能特征
- 估算节能/储能改造潜力
- 给出优先级评分和攻关建议`,
  },
  {
    key: 'revenue-calculator',
    name: '收益测算 Agent',
    icon: 'CalculatorOutlined',
    description: '多场景收益测算，Monte Carlo模拟输出IRR/NPV/回本期的置信区间',
    status: 'online',
    lastRun: '25分钟前',
    todayTasks: 3,
    successRate: 98,
    linkedPage: '/investment',
    linkedPageLabel: '投资测算',
    systemPrompt: `你是汇通国信的收益测算专家Agent。你的职责是根据项目参数进行多场景收益测算。

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

重要纠偏：工商业（用户侧）储能不享受容量电价补偿，容量电价仅适用于电网侧独立储能。

当用户提供项目参数时，你应该：
- 逐项计算各场景收益
- 给出保守/中性/乐观三种情景的IRR/NPV
- 提示关键风险因素`,
  },
  {
    key: 'finance-matcher',
    name: '融资匹配 Agent',
    icon: 'BankOutlined',
    description: '根据项目特征自动匹配最优融资方案，生成融资申请材料初稿',
    status: 'idle',
    lastRun: '2小时前',
    todayTasks: 1,
    successRate: 95,
    systemPrompt: `你是汇通国信的融资匹配专家Agent。你的职责是根据项目参数自动匹配最优融资方案。

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

增信措施：EMC合同收益权质押、储能设备抵押、母公司担保、差额补足。

当用户描述项目时，你应该推荐最优融资组合，并说明选择理由。`,
  },
  {
    key: 'contract-generator',
    name: '合同生成 Agent',
    icon: 'FileProtectOutlined',
    description: '基于项目特征自动生成EMC合同，内置AI风险审查机制',
    status: 'online',
    lastRun: '1小时前',
    todayTasks: 2,
    successRate: 96,
    linkedPage: '/contract',
    linkedPageLabel: '合同签署',
    systemPrompt: `你是汇通国信的合同生成专家Agent。你的职责是基于项目特征生成EMC合同和风险审查。

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
- 政策：政策变化应对、补贴分配、碳资产归属

当用户描述项目时，你应该推荐合适的合同模板和关键条款。`,
  },
  {
    key: 'ops-guardian',
    name: '运维告警 Agent',
    icon: 'AlertOutlined',
    description: '设备全生命周期监控，异常检测到工单生成的全链路自动化',
    status: 'online',
    lastRun: '实时运行中',
    todayTasks: 12,
    successRate: 99,
    linkedPage: '/devices',
    linkedPageLabel: '设备资产',
    systemPrompt: `你是汇通国信的运维告警专家Agent。你的职责是监控储能设备运行状态，提供预测性维护建议。

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
- AI预测性维护可减少30-50%非计划停机

当用户询问设备状态时，你应该分析当前指标并给出运维建议。`,
  },
  {
    key: 'market-intelligence',
    name: '市场情报 Agent',
    icon: 'GlobalOutlined',
    description: '持续跟踪电价、政策、碳市场、竞品动态，提供结构化市场情报',
    status: 'online',
    lastRun: '5分钟前',
    todayTasks: 8,
    successRate: 97,
    linkedPage: '/spot-market',
    linkedPageLabel: '现货交易',
    systemPrompt: `你是汇通国信的市场情报专家Agent。你的职责是跟踪电价、政策、碳市场和竞品动态。

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

主要竞争对手分类：电网系（国网/南网综能）、发电集团（国电投/华能）、设备系（阳光/宁德）、互联网系（特来电）、能源IT（国能日新/朗新）。

当用户询问市场信息时，你应该提供最新数据和分析。`,
  },
];

export interface WorkflowStep {
  title: string;
  agent: string;
  description: string;
}

export const workflows = {
  newProject: {
    name: '新项目全流程',
    description: '从线索到签约',
    steps: [
      { title: '客户画像', agent: 'customer-profiler', description: '企业筛选 → 评分卡 → 节能潜力估算' },
      { title: '收益测算', agent: 'revenue-calculator', description: '多场景收益测算 → Monte Carlo模拟' },
      { title: '融资匹配', agent: 'finance-matcher', description: '最优融资方案 → 融资成本估算' },
      { title: '合同生成', agent: 'contract-generator', description: '合同初稿 → AI风险审查' },
      { title: '人工审核', agent: '', description: '法务/财务/业务负责人审核' },
    ],
  },
  operations: {
    name: '运营期全流程',
    description: '签约后到合同期满',
    steps: [
      { title: '运维监控', agent: 'ops-guardian', description: '实时设备监控 → 预测性维护' },
      { title: '市场跟踪', agent: 'market-intelligence', description: '电价/政策/碳市场动态更新' },
      { title: '收益校准', agent: 'revenue-calculator', description: '实际vs预测对比 → 模型校准' },
      { title: '季度报告', agent: '', description: '自动生成运营报告 → 发送客户+内部' },
    ],
  },
  learning: {
    name: '经验沉淀',
    description: '每个项目完成后',
    steps: [
      { title: '收益校准', agent: 'revenue-calculator', description: '预测vs实际 → Monte Carlo参数校准' },
      { title: '合同复盘', agent: 'contract-generator', description: '归纳条款教训 → 更新模板库' },
      { title: '客户更新', agent: 'customer-profiler', description: '更新行业数据库 → 优化筛选算法' },
      { title: '运维优化', agent: 'ops-guardian', description: '更新故障模式库 → 优化预测模型' },
    ],
  },
};

export interface RecentActivity {
  id: string;
  agent: string;
  action: string;
  target: string;
  time: string;
  status: 'success' | 'running' | 'warning';
}

export const recentActivities: RecentActivity[] = [
  { id: '1', agent: '市场情报', action: '更新广东现货电价数据', target: '广东电力交易中心', time: '5分钟前', status: 'success' },
  { id: '2', agent: '运维告警', action: '设备巡检报告生成', target: '富山站储能 / 聚龙站储能', time: '10分钟前', status: 'success' },
  { id: '3', agent: '客户画像', action: '新线索分析', target: '某氧化铝企业（山西）', time: '25分钟前', status: 'success' },
  { id: '4', agent: '收益测算', action: 'Monte Carlo模拟', target: '2MW/4MWh工商业储能方案', time: '1小时前', status: 'success' },
  { id: '5', agent: '合同生成', action: 'EMC合同风险审查', target: '工商业储能标准合同 v3.2', time: '1小时前', status: 'warning' },
  { id: '6', agent: '融资匹配', action: '融资方案推荐', target: '某钢铁企业节能改造项目', time: '2小时前', status: 'success' },
  { id: '7', agent: '市场情报', action: '政策解读', target: '发改价格〔2026〕114号', time: '3小时前', status: 'success' },
  { id: '8', agent: '运维告警', action: 'SOH异常预警', target: '化龙站储能 #B03电芯组', time: '4小时前', status: 'warning' },
];
