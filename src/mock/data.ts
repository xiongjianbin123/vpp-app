// Mock data for VPP App

export interface Device {
  id: string;
  name: string;
  type: '光伏电站' | '储能系统' | '风电' | '充电桩' | '工业负荷' | '电网储能';
  status: '在线' | '离线' | '维护' | '告警';
  capacity: number; // MW
  energyCapacity?: number; // MWh（储能额定容量）
  currentPower: number; // MW，正值放电，负值充电
  location: string;
  lastUpdate: string;
  soc?: number; // 荷电状态 State of Charge %
  // 设备详细参数
  connectionType?: string;   // 接入方式
  batteryType?: string;      // 电池类型
  batterySpec?: string;      // 电池规格型号
  bmsModel?: string;         // BMS品牌型号
  pcsModel?: string;         // PCS品牌型号
  emsModel?: string;         // EMS品牌
  investmentCost?: number;   // 投资成本（万元）
  commissionDate?: string;   // 投运日期
  warrantyYears?: number;    // 质保年限
  // 运行健康数据
  soh?: number;              // 电池健康度 State of Health %
  cycleCount?: number;       // 累计循环次数
  maxCellVoltage?: number;   // 单体最高电压 mV
  minCellVoltage?: number;   // 单体最低电压 mV
  cellMaxTemp?: number;      // 电芯最高温度 °C
  cellMinTemp?: number;      // 电芯最低温度 °C
  temperature?: number;      // 环境温度 °C
  humidity?: number;         // 环境湿度 %
  bmsAlarms?: string[];      // BMS告警信息
  // 电网侧储能专属字段
  station?: string;          // 站点名称
  projectName?: string;      // 项目全称
  buildLocation?: string;    // 建设地点
  company?: string;          // 申报公司
}

export interface DemandResponseTask {
  id: string;
  name: string;
  type: '调峰' | '调频' | '备用';
  status: '待响应' | '执行中' | '已完成' | '已取消';
  targetPower: number; // MW
  currentPower: number; // MW
  startTime: string;
  endTime: string;
  progress: number; // 0-100
  reward: number; // 元
}

export const mockDevices: Device[] = [
  // 电网侧独立储能项目（优先展示）
  {
    id: 'E001', name: '富山站储能', type: '电网储能', status: '在线',
    capacity: 150, energyCapacity: 300, currentPower: 86.4, soc: 65,
    location: '广州市番禺区石壁街道',
    lastUpdate: '2026-03-16 10:30:00',
    station: '富山站',
    projectName: '广州市番禺区富山220kV变电站150MW/300MWh新型独立储能项目',
    buildLocation: '广州市番禺区石壁街道东新高速禺山互通起点位置（禺山高架桥79号至禺山桥6号墩范围）',
    company: '广州颐海能源科技有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '314Ah / 3.2V',
    bmsModel: '科陆电子 BMS-3000',
    pcsModel: '阳光电源 SG3125HV',
    emsModel: '汇图EMS V2.1',
    investmentCost: 43500,
    commissionDate: '2025-06-15',
    warrantyYears: 10,
    soh: 97,
    cycleCount: 312,
    maxCellVoltage: 3284,
    minCellVoltage: 3271,
    cellMaxTemp: 31.2,
    cellMinTemp: 28.5,
    temperature: 26.3,
    humidity: 58,
    bmsAlarms: [],
  },
  {
    id: 'E002', name: '聚龙站储能', type: '电网储能', status: '在线',
    capacity: 150, energyCapacity: 300, currentPower: 72.0, soc: 71,
    location: '广州市番禺区石壁街道钟韦路63号',
    lastUpdate: '2026-03-16 10:30:00',
    station: '聚龙站',
    projectName: '广州市番禺区聚龙220kV变电站150MW/300MWh新型独立储能项目',
    buildLocation: '广州市番禺区石壁街道钟韦路63号',
    company: '广州颐投能源科技有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '314Ah / 3.2V',
    bmsModel: '科陆电子 BMS-3000',
    pcsModel: '阳光电源 SG3125HV',
    emsModel: '汇图EMS V2.1',
    investmentCost: 43500,
    commissionDate: '2025-07-20',
    warrantyYears: 10,
    soh: 96,
    cycleCount: 287,
    maxCellVoltage: 3291,
    minCellVoltage: 3268,
    cellMaxTemp: 30.8,
    cellMinTemp: 28.1,
    temperature: 25.8,
    humidity: 61,
    bmsAlarms: [],
  },
  {
    id: 'E003', name: '厚德站储能', type: '电网储能', status: '在线',
    capacity: 100, energyCapacity: 200, currentPower: 48.5, soc: 58,
    location: '广州市海珠区华洲街道土华村',
    lastUpdate: '2026-03-16 10:30:00',
    station: '厚德站',
    projectName: '广州市海珠区100MW/200MWh新型独立储能项目',
    buildLocation: '广州市海珠区华洲街道土华村"东丫围"（土名）、华南路东侧',
    company: '广州颐滨能源科技有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '280Ah / 3.2V',
    bmsModel: '比亚迪 BMS Pro',
    pcsModel: '华为 SmartPCS2000KL-H',
    emsModel: '汇图EMS V2.0',
    investmentCost: 29000,
    commissionDate: '2025-04-10',
    warrantyYears: 10,
    soh: 95,
    cycleCount: 423,
    maxCellVoltage: 3301,
    minCellVoltage: 3262,
    cellMaxTemp: 32.5,
    cellMinTemp: 29.3,
    temperature: 27.1,
    humidity: 65,
    bmsAlarms: ['单体温差偏大（3.2°C），建议检查散热风道'],
  },
  {
    id: 'E004', name: '化龙站储能', type: '电网储能', status: '在线',
    capacity: 100, energyCapacity: 200, currentPower: 61.2, soc: 82,
    location: '广州市番禺区化龙镇明经村',
    lastUpdate: '2026-03-16 10:30:00',
    station: '化龙站',
    projectName: '广州市番禺区化龙镇100MW/200MWh新型独立储能项目',
    buildLocation: '广州市番禺区化龙镇明经村295县道以南',
    company: '广州颐滨能源科技有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '280Ah / 3.2V',
    bmsModel: '比亚迪 BMS Pro',
    pcsModel: '华为 SmartPCS2000KL-H',
    emsModel: '汇图EMS V2.0',
    investmentCost: 29000,
    commissionDate: '2025-05-18',
    warrantyYears: 10,
    soh: 98,
    cycleCount: 378,
    maxCellVoltage: 3278,
    minCellVoltage: 3265,
    cellMaxTemp: 30.1,
    cellMinTemp: 27.8,
    temperature: 24.6,
    humidity: 55,
    bmsAlarms: [],
  },
  {
    id: 'E005', name: '科城站储能', type: '电网储能', status: '在线',
    capacity: 200, energyCapacity: 400, currentPower: 118.6, soc: 44,
    location: '广州市黄埔区联和街道',
    lastUpdate: '2026-03-16 10:30:00',
    station: '科城站',
    projectName: '广州市黄埔区新型独立储能（200MW/400MWh）项目',
    buildLocation: '广州市黄埔区联和街道科珠路与南翔一路交叉东南侧',
    company: '广东颐禾能源投资有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '314Ah / 3.2V',
    bmsModel: '宁德时代 BESS-BMS',
    pcsModel: '阳光电源 SG5000HV',
    emsModel: '汇图EMS V2.1',
    investmentCost: 58000,
    commissionDate: '2025-09-01',
    warrantyYears: 10,
    soh: 99,
    cycleCount: 198,
    maxCellVoltage: 3296,
    minCellVoltage: 3281,
    cellMaxTemp: 29.8,
    cellMinTemp: 27.2,
    temperature: 25.2,
    humidity: 52,
    bmsAlarms: [],
  },
  {
    id: 'E006', name: '鱼飞站储能', type: '电网储能', status: '在线',
    capacity: 150, energyCapacity: 300, currentPower: 94.3, soc: 76,
    location: '广州市南沙区东涌镇',
    lastUpdate: '2026-03-16 10:30:00',
    station: '鱼飞站',
    projectName: '广州市南沙区新型独立储能（150MW/300MWh）项目',
    buildLocation: '广州市南沙区东涌镇马克南街六巷和马发街交叉处',
    company: '广东颐禾能源投资有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '314Ah / 3.2V',
    bmsModel: '宁德时代 BESS-BMS',
    pcsModel: '阳光电源 SG3125HV',
    emsModel: '汇图EMS V2.1',
    investmentCost: 43500,
    commissionDate: '2025-08-12',
    warrantyYears: 10,
    soh: 98,
    cycleCount: 241,
    maxCellVoltage: 3288,
    minCellVoltage: 3274,
    cellMaxTemp: 33.1,
    cellMinTemp: 30.2,
    temperature: 28.4,
    humidity: 69,
    bmsAlarms: ['环境湿度偏高（69%），建议加强除湿处理'],
  },
  {
    id: 'E007', name: '象山站储能', type: '电网储能', status: '在线',
    capacity: 200, energyCapacity: 400, currentPower: 112.0, soc: 53,
    location: '深圳市宝安区新桥街道',
    lastUpdate: '2026-03-16 10:30:00',
    station: '深圳象山站',
    projectName: '深圳市宝安象山200MW/400MWh新型储能项目',
    buildLocation: '深圳市宝安区新桥街道长流陂水库北侧新玉路北侧',
    company: '深圳市颐发能源科技有限公司',
    connectionType: 'IEC61850协议',
    batteryType: 'LFP磷酸铁锂',
    batterySpec: '314Ah / 3.2V',
    bmsModel: '比亚迪 BMS Pro',
    pcsModel: '华为 SmartPCS2000KL-H',
    emsModel: '汇图EMS V2.1',
    investmentCost: 58000,
    commissionDate: '2025-10-05',
    warrantyYears: 10,
    soh: 99,
    cycleCount: 163,
    maxCellVoltage: 3293,
    minCellVoltage: 3279,
    cellMaxTemp: 30.4,
    cellMinTemp: 27.6,
    temperature: 24.9,
    humidity: 57,
    bmsAlarms: [],
  },

  // 其他分布式资源
  { id: 'D001', name: '光伏电站-北区', type: '光伏电站', status: '在线', capacity: 50, currentPower: 38.5, location: '北京市朝阳区', lastUpdate: '2026-03-14 10:30:00', connectionType: 'MODBUS TCP', commissionDate: '2022-05-01', investmentCost: 15000 },
  {
    id: 'D002', name: '储能系统-A', type: '储能系统', status: '在线',
    capacity: 20, energyCapacity: 40, currentPower: 15.2, location: '北京市海淀区', lastUpdate: '2026-03-14 10:30:00',
    soc: 72, soh: 88, connectionType: 'MODBUS TCP',
    batteryType: 'LFP磷酸铁锂', batterySpec: '100Ah / 3.2V',
    bmsModel: '科陆电子 BMS-2000', pcsModel: '科士达 PCS-200KW', emsModel: '本地EMS',
    investmentCost: 4800, commissionDate: '2023-11-15', warrantyYears: 5,
    cycleCount: 892, maxCellVoltage: 3311, minCellVoltage: 3248,
    cellMaxTemp: 28.6, cellMinTemp: 25.3, temperature: 23.5, humidity: 48,
    bmsAlarms: ['SOH低于90%，建议安排电池健康诊断'],
  },
  { id: 'D003', name: '风电场-东区', type: '风电', status: '在线', capacity: 30, currentPower: 22.1, location: '内蒙古呼和浩特', lastUpdate: '2026-03-14 10:30:00', connectionType: '风机通讯协议', commissionDate: '2021-08-20', investmentCost: 18000 },
  { id: 'D004', name: '充电桩群-CBD', type: '充电桩', status: '告警', capacity: 5, currentPower: 0, location: '北京市西城区', lastUpdate: '2026-03-14 10:28:00', connectionType: 'OCPP 1.6', commissionDate: '2024-01-10', investmentCost: 800 },
  { id: 'D005', name: '工业负荷-钢厂', type: '工业负荷', status: '在线', capacity: 40, currentPower: 32.0, location: '河北省唐山市', lastUpdate: '2026-03-14 10:30:00', connectionType: '电表直采', commissionDate: '2023-06-01', investmentCost: 200 },
  { id: 'D006', name: '光伏电站-南区', type: '光伏电站', status: '维护', capacity: 25, currentPower: 0, location: '北京市大兴区', lastUpdate: '2026-03-14 09:00:00', connectionType: 'MODBUS TCP', commissionDate: '2022-09-15', investmentCost: 7500 },
  {
    id: 'D007', name: '储能系统-B', type: '储能系统', status: '在线',
    capacity: 15, energyCapacity: 30, currentPower: 8.5, location: '天津市滨海新区', lastUpdate: '2026-03-14 10:30:00',
    soc: 58, soh: 92, connectionType: 'MODBUS TCP',
    batteryType: 'LFP磷酸铁锂', batterySpec: '100Ah / 3.2V',
    bmsModel: '科陆电子 BMS-2000', pcsModel: '科士达 PCS-150KW', emsModel: '本地EMS',
    investmentCost: 3600, commissionDate: '2024-03-20', warrantyYears: 5,
    cycleCount: 645, maxCellVoltage: 3298, minCellVoltage: 3259,
    cellMaxTemp: 29.2, cellMinTemp: 26.8, temperature: 24.1, humidity: 51,
    bmsAlarms: [],
  },
  { id: 'D008', name: '风电场-西区', type: '风电', status: '离线', capacity: 20, currentPower: 0, location: '张家口市', lastUpdate: '2026-03-14 08:15:00', connectionType: '风机通讯协议', commissionDate: '2020-12-01', investmentCost: 12000 },
  { id: 'D009', name: '充电桩群-园区', type: '充电桩', status: '在线', capacity: 3, currentPower: 1.8, location: '北京市昌平区', lastUpdate: '2026-03-14 10:30:00', connectionType: 'OCPP 1.6', commissionDate: '2024-06-01', investmentCost: 480 },
  { id: 'D010', name: '工业负荷-化工', type: '工业负荷', status: '在线', capacity: 35, currentPower: 28.5, location: '天津市东丽区', lastUpdate: '2026-03-14 10:30:00', connectionType: '电表直采', commissionDate: '2023-09-01', investmentCost: 150 },
];

export const mockTasks: DemandResponseTask[] = [
  { id: 'T001', name: '高峰调峰任务-01', type: '调峰', status: '执行中', targetPower: 50, currentPower: 42.3, startTime: '2026-03-14 09:00', endTime: '2026-03-14 12:00', progress: 65, reward: 125000 },
  { id: 'T002', name: '频率调节任务-A', type: '调频', status: '待响应', targetPower: 30, currentPower: 0, startTime: '2026-03-14 14:00', endTime: '2026-03-14 16:00', progress: 0, reward: 80000 },
  { id: 'T003', name: '备用容量响应-03', type: '备用', status: '已完成', targetPower: 20, currentPower: 20, startTime: '2026-03-13 20:00', endTime: '2026-03-14 08:00', progress: 100, reward: 56000 },
  { id: 'T004', name: '夜间调峰任务-02', type: '调峰', status: '已完成', targetPower: 40, currentPower: 40, startTime: '2026-03-13 22:00', endTime: '2026-03-14 06:00', progress: 100, reward: 98000 },
  { id: 'T005', name: '应急调频任务-B', type: '调频', status: '待响应', targetPower: 25, currentPower: 0, startTime: '2026-03-14 16:00', endTime: '2026-03-14 18:00', progress: 0, reward: 62000 },
];

// Generate 24h power data
export function generate24hData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
    // simulate typical power curve
    const base = 80;
    const peak = hour >= 9 && hour <= 21 ? 40 : 10;
    const solar = hour >= 6 && hour <= 18 ? Math.sin(((hour - 6) / 12) * Math.PI) * 35 : 0;
    data.push({
      time: `${time.getHours().toString().padStart(2, '0')}:00`,
      总功率: Math.round((base + peak + solar + Math.random() * 10) * 10) / 10,
      光伏: Math.round(solar * 10) / 10,
      储能: Math.round((5 + Math.random() * 10) * 10) / 10,
      风电: Math.round((15 + Math.random() * 10) * 10) / 10,
    });
  }
  return data;
}

// ─── 知识库相关类型与数据 ──────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: '现货市场' | '政策法规' | '储能动态' | '需求响应' | '价格行情';
  tags: string[];
}

export const mockNews: NewsItem[] = [
  // 现货市场
  {
    id: 'N001', category: '现货市场', source: '广东电力交易中心',
    date: '2026-03-16',
    title: '广东现货市场3月第三周日前均价环比下降8.3%',
    summary: '受近期水电来水偏丰及新能源出力增加影响，广东现货市场3月第三周日前均价降至约0.412元/kWh，较上周环比下降8.3%。尖峰时段（19:00-21:00）最高申报价格达1.248元/kWh，谷时低点约0.081元/kWh，峰谷价差仍维持高位，套利空间显著。储能电站可通过深谷充电、尖峰放电实现最大化收益。',
    tags: ['现货价格', '峰谷套利', '广东电力'],
  },
  {
    id: 'N002', category: '现货市场', source: '中电联',
    date: '2026-03-16',
    title: '南方区域现货市场联合结算机制正式启动，跨省套利空间受限',
    summary: '南方区域电力市场管理委员会宣布，跨省现货联合结算机制已于本周正式启动，广东、广西、云南、贵州、海南五省统一电价节点覆盖率提升至83%。该机制将压缩跨省价格套利空间，但有助于提升整体市场效率。业内人士指出，广东本地峰谷价差套利仍是储能盈利主要来源。',
    tags: ['区域市场', '跨省结算', '南方电网'],
  },
  {
    id: 'N003', category: '现货市场', source: '国家电力调度中心',
    date: '2026-03-15',
    title: '全国电力现货市场扩容：新增6省进入模拟运行阶段',
    summary: '国家能源局最新公告显示，湖南、湖北、江西、四川、重庆、浙江六省已进入电力现货市场扩大规模模拟运行阶段，预计2026年Q3正式上线交易。目前全国已有广东、山西、甘肃等9个地区进入正式运行。此举将显著扩大可参与现货市场的储能规模，对VPP聚合商是重大利好。',
    tags: ['现货扩容', '政策利好', '全国市场'],
  },
  {
    id: 'N004', category: '现货市场', source: '广东电力交易中心',
    date: '2026-03-15',
    title: '广东2026年Q2容量市场结果公布：独立储能容量申报价均值1820元/MW·月',
    summary: '广东电力交易中心发布2026年第二季度容量市场出清结果，独立储能申报容量价格均值为1820元/MW·月，较Q1的1650元上涨10.3%，反映出市场对调节容量的旺盛需求。本次出清总容量达2.1GW，其中新型储能占比58%，抽水蓄能占比42%。汇图能源旗下7个电网侧储能项目全部通过容量市场审核。',
    tags: ['容量市场', '独立储能', '广东Q2'],
  },
  {
    id: 'N005', category: '现货市场', source: '电力头条',
    date: '2026-03-14',
    title: '极端天气预警：本周南方电网用电负荷预计创季节性新高',
    summary: '气象部门发布高温预警，广东地区本周最高气温将达33°C，南方电网预测最大负荷将达1.42亿千瓦，创3月季节性历史新高。预计周三至周五尖峰时段现货价格将大幅走高，相关储能及需求响应资源可抓住短期套利窗口。建议提前将SOC充至80%以上，做好尖峰放电准备。',
    tags: ['高温预警', '负荷高峰', '套利机会'],
  },
  // 政策法规
  {
    id: 'N006', category: '政策法规', source: '国家发展改革委',
    date: '2026-03-16',
    title: '发改委发布《新型储能参与电力市场指导意见》征求意见稿',
    summary: '国家发展改革委正式发布《关于新型储能参与电力市场及价格政策的指导意见（征求意见稿）》，明确新型储能可同时申报调频辅助服务与现货市场，取消"一储一市场"的限制。同时提出建立储能容量电价机制，按照实际可调容量给予每月固定容量费用补偿。意见稿征求意见截止时间为2026年4月15日。',
    tags: ['储能政策', '容量补偿', '多市场参与'],
  },
  {
    id: 'N007', category: '政策法规', source: '广东省发改委',
    date: '2026-03-15',
    title: '广东发布VPP聚合商备案管理办法，明确等保三级合规要求',
    summary: '广东省发展和改革委员会正式印发《广东省虚拟电厂聚合商备案管理暂行办法》，要求在粤运营的VPP聚合商须取得信息安全等级保护三级认证，数据传输须采用TLS1.3以上加密协议，系统可用率须达到99.9%以上。新规定自2026年7月1日起施行，现有聚合商须在12个月内完成整改备案。',
    tags: ['VPP监管', '等保合规', '广东政策'],
  },
  {
    id: 'N008', category: '政策法规', source: '国家能源局',
    date: '2026-03-14',
    title: '能源局明确AGC直控响应时间标准：毫秒级要求写入行业规范',
    summary: '国家能源局发布《电力系统调频辅助服务市场运营规范》修订版，首次在国家层面明确AGC直控指令的响应时间要求：一次调频响应时间≤200ms，AGC二次调频响应时间≤500ms。K值（综合评分指标）将作为调频服务结算的关键参数，K值低于0.85的资源将被暂停调频资格。',
    tags: ['AGC标准', 'K值规范', '调频市场'],
  },
  {
    id: 'N009', category: '政策法规', source: '南方监管局',
    date: '2026-03-13',
    title: '南方能源监管局开展2026年电力交易合规专项检查',
    summary: '南方能源监管局宣布启动2026年电力交易市场合规专项检查工作，重点核查虚拟电厂聚合商的申报数据真实性、资源实际可调容量与申报容量的匹配度，以及调度指令执行情况。检查范围覆盖广东、广西、云南、贵州、海南五省，预计5月底完成。违规行为最高罚款为违规交易金额的3倍。',
    tags: ['合规检查', '监管执法', '申报合规'],
  },
  // 储能动态
  {
    id: 'N010', category: '储能动态', source: '储能头条',
    date: '2026-03-16',
    title: '比亚迪发布第五代液冷储能系统，系统效率突破93%',
    summary: '比亚迪储能发布全新MC-Cube 5.0液冷储能系统，单柜能量密度达480kWh，循环寿命突破1.2万次，系统效率达93.2%（较上一代提升2.1%）。新系统支持0.5C快充，适配广东电力现货市场15分钟响应需求。预计2026年Q3进入量产阶段，届时储能系统度电成本将降至0.55元/kWh以下。',
    tags: ['比亚迪', '液冷储能', '技术突破'],
  },
  {
    id: 'N011', category: '储能动态', source: '中国储能网',
    date: '2026-03-15',
    title: '广东电网侧储能装机容量突破5GW，在运项目达156个',
    summary: '据南方电网发布的最新数据，截至2026年3月，广东省电网侧储能累计装机容量已突破5GW/10GWh，在运项目156个，在建项目52个，合计规模达7.8GW。广州、深圳、东莞是主要集聚区域，三地合计占比超过60%。预计到2027年底，全省电网侧储能将突破10GW，成为南方电网调节能力的核心支撑。',
    tags: ['电网储能', '广东装机', '市场规模'],
  },
  {
    id: 'N012', category: '储能动态', source: '科城电力研究院',
    date: '2026-03-14',
    title: 'SOH衰减速率研究：不同调度策略对电池寿命影响差异达40%',
    summary: '科城电力研究院发布储能电站全生命周期管理研究报告，分析了不同调度策略对电池SOH衰减的影响。研究发现，同等循环次数下，深度充放电（SOC 10%-90%区间）策略比浅度充放电（SOC 30%-70%区间）加速SOH衰减约40%。建议VPP聚合商在容量申报时预留10%-15%的SOH折减量，避免因实际可调容量不足导致K值降低和罚款。',
    tags: ['SOH管理', '电池衰减', '运维策略'],
  },
  {
    id: 'N013', category: '储能动态', source: '能源界',
    date: '2026-03-13',
    title: '全钒液流电池迎来规模化应用窗口，长时储能补贴政策有望出台',
    summary: '业内消息显示，国家能源局正在研究针对4小时以上长时储能的专项补贴政策，全钒液流电池、铁铬液流电池等技术路线有望获得政策支持。相较于锂电储能，液流电池循环寿命超过2万次，15-20年全生命周期内度电成本具备竞争力。广东已有2个液流电池电网侧储能项目处于核准阶段，总规模达300MW/1.2GWh。',
    tags: ['长时储能', '液流电池', '补贴政策'],
  },
  // 需求响应
  {
    id: 'N014', category: '需求响应', source: '广东电力需求响应中心',
    date: '2026-03-16',
    title: '广东启动2026年首次市场化需求响应，邀约规模500万千瓦',
    summary: '广东省需求侧管理中心发布公告，定于本周四（3月19日）14:00-17:00开展2026年首次市场化需求响应活动，邀约规模为500万千瓦，分时段补贴标准为：响应量×响应时长×1.2元/kWh。符合条件的工业用户、充电桩聚合商、储能资源均可参与申报。报名截止时间为3月18日18:00，VPP聚合商须提前确认资源可调容量。',
    tags: ['需求响应', '市场化', '广东2026'],
  },
  {
    id: 'N015', category: '需求响应', source: '电网头条',
    date: '2026-03-15',
    title: '南方电网启动迎峰度夏需求响应提前准备工作',
    summary: '南方电网启动2026年迎峰度夏（5月-9月）电力保供准备工作，需求响应资源规模目标为1500万千瓦，较去年增加200万千瓦。今年新增"快速响应"品类，要求5分钟内完成响应，补贴标准上浮50%至1.8元/kWh。储能系统凭借快速响应特性有望成为今年迎峰度夏的主力响应资源。',
    tags: ['迎峰度夏', '快速响应', '补贴提升'],
  },
  {
    id: 'N016', category: '需求响应', source: '中国能源报',
    date: '2026-03-14',
    title: '工业负荷柔性聚合技术突破：单一VPP聚合商最大响应容量记录刷新',
    summary: '汇通能源在广东省需求响应演练中创下单一VPP聚合商最大响应容量记录：通过聚合83家工业用户、12个储能电站、5个充电桩群，在接收调度指令后210秒内完成234MW响应，刷新行业纪录。该案例证明了VPP技术在大规模负荷聚合方面的可行性，为未来千万千瓦级需求响应奠定技术基础。',
    tags: ['VPP聚合', '响应记录', '工业负荷'],
  },
  {
    id: 'N017', category: '需求响应', source: '广东省电力局',
    date: '2026-03-13',
    title: '广东需求响应辅助服务市场月度结算：3月总支付金额达1.82亿元',
    summary: '广东省电力局公布2026年3月第一批需求响应辅助服务市场结算结果，本批次共有127家聚合商参与，总支付金额1.82亿元，较去年同期增长67%。其中储能资源获得的补贴占比从去年的18%提升至34%，反映出储能参与需求响应的规模快速扩大。平均结算价格为0.98元/kWh，高于市场预期。',
    tags: ['结算公告', '需求响应市场', '储能补贴'],
  },
  // 价格行情
  {
    id: 'N018', category: '价格行情', source: '上海钢联',
    date: '2026-03-16',
    title: '碳酸锂价格本周环比下跌3.2%，储能系统EPC成本再创新低',
    summary: '受海外锂矿新增产能释放及国内需求增速放缓影响，电池级碳酸锂本周现货价格降至7.8万元/吨，环比下跌3.2%，较2024年高峰期跌幅超过80%。原材料价格下行带动储能系统EPC价格持续走低，目前主流磷酸铁锂储能系统含安装价格约0.82元/Wh，较年初下降9%，储能投资回收期已缩短至8年以内。',
    tags: ['碳酸锂', '储能成本', '原材料价格'],
  },
  {
    id: 'N019', category: '价格行情', source: '电力现货价格监测中心',
    date: '2026-03-15',
    title: '广东电力现货日前市场价格预测：明日峰谷价差预计扩大至1.15元/kWh',
    summary: '根据气象预报和系统预测，明日（3月16日）广东电力现货日前市场峰谷价差预计达1.15元/kWh，高于近30天均值的0.92元/kWh。分时段预测：深谷时段（00:00-08:00）约0.12元/kWh，平段约0.52元/kWh，峰段约0.98元/kWh，尖峰段（19:00-21:00）预计达1.27元/kWh。建议储能运营商据此调整次日充放电计划。',
    tags: ['价格预测', '峰谷价差', '明日行情'],
  },
  {
    id: 'N020', category: '价格行情', source: '新华财经',
    date: '2026-03-14',
    title: '2026年Q1全国省级现货市场价格回顾：南方区域均价最高',
    summary: '新华财经发布2026年一季度电力现货市场价格报告，全国已启动现货交易的9个省份中，广东省日前市场均价最高，达0.487元/kWh，广西以0.431元/kWh位居第二，山西0.398元/kWh排名第三。南方区域整体价格高于北方，主要受制于水电来水偏枯及工业负荷增速较快等因素。价格分析师预计Q2南方均价将进一步上行。',
    tags: ['季度报告', '区域价格', '市场对比'],
  },
];

export function generateMockExcerpt(filename: string): string {
  const name = filename.toLowerCase();
  if (name.includes('策略') || name.includes('strategy')) {
    return '本文档详细阐述了广东电力现货市场套利策略框架，包括峰谷价差套利模型、96点申报优化算法及多市场协同收益寻优方法。通过对历史价格数据的分析，建立了基于机器学习的价格预测模型，预测精度在±8%以内。文档还包含了AGC调频与现货套利的最优切换策略，以及典型场景下的仿真回测结果，为储能电站运营提供量化决策依据。';
  }
  if (name.includes('合规') || name.includes('compliance')) {
    return '本合规手册覆盖广东省VPP聚合商参与电力市场的全流程合规要求，包括：交易中心API接入标准（OAuth2.0认证、TLS1.3加密）、申报数据真实性核查规范、AGC直控指令响应时延要求（≤500ms）、等保三级认证流程及定期审计机制。文档还包含历次合规检查的整改案例，以及2026年最新监管要求对照清单，帮助运营团队规避合规风险。';
  }
  if (name.includes('运维') || name.includes('operation')) {
    return '本运维规程针对电网侧独立储能电站的日常运维管理，涵盖PCS（功率变换系统）日检、BMS电池管理系统周检、消防系统月检等周期性维护内容。特别说明了SOH（电池健康度）下降预警机制：当SOH低于85%时触发黄色预警，低于75%时触发红色预警并限制最大充放电深度。文档包含富山站、聚龙站等7个项目的设备台账和故障处理流程。';
  }
  if (name.includes('收益') || name.includes('revenue')) {
    return '本收益分析报告对汇图能源旗下7个电网侧储能项目2025年全年收益进行了详细复盘，总收益达4.28亿元。其中现货市场峰谷套利贡献48%，容量市场贡献22%，调频辅助服务贡献19%，需求响应贡献11%。报告还对2026年收益预测进行了情景分析，在基准情景下预计全年收益可达5.1亿元，较2025年增长19%。';
  }
  return `本文档是"${filename}"，包含与虚拟电厂运营、电力交易及储能管理相关的专业内容。文档已成功导入知识库，可通过自然语言问答功能查询文档中的具体信息。如需了解文档的详细内容，请直接提问，系统将引用文档中的相关段落为您解答。`;
}

export function generateMockTags(filename: string): string[] {
  const name = filename.toLowerCase();
  const tags: string[] = [];
  if (name.includes('策略') || name.includes('strategy')) tags.push('交易策略', '套利模型', '96点申报');
  if (name.includes('合规') || name.includes('compliance')) tags.push('合规管理', 'AGC', '等保三级');
  if (name.includes('运维') || name.includes('operation')) tags.push('运维规程', 'SOH管理', '设备台账');
  if (name.includes('收益') || name.includes('revenue')) tags.push('收益分析', '财务报告', '市场复盘');
  if (name.includes('申报') || name.includes('bid')) tags.push('申报流程', '容量申报', '市场准入');
  if (tags.length === 0) tags.push('内部文档', '电力市场', 'VPP运营');
  return tags;
}

export function generateMonthlyRevenue() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map((month, _i) => ({
    month,
    调峰收益: Math.round((80 + Math.random() * 60) * 1000),
    调频收益: Math.round((40 + Math.random() * 30) * 1000),
    辅助服务: Math.round((20 + Math.random() * 20) * 1000),
    总收益: 0,
  })).map(item => ({ ...item, 总收益: item.调峰收益 + item.调频收益 + item.辅助服务 }));
}
