import bcrypt from 'bcryptjs';
import { pool } from '../config/database';

// ─── Users ────────────────────────────────────────────────────────────────────
const seedUsers = [
  { username: 'admin',   password: 'admin123',  name: '李少雄', email: 'li.shaoxiong@huitone.com',   roleKey: 'sales_gm' },
  { username: 'sales',   password: 'sales123',  name: '梁梓柔', email: 'liang.zirou@huitone.com',    roleKey: 'sales_manager' },
  { username: 'trading', password: 'trade123',  name: '刘海',   email: 'liu.hai@huitone.com',        roleKey: 'trading_director' },
  { username: 'trader',  password: 'trader123', name: '杜陈傲', email: 'du.chenao@huitone.com',      roleKey: 'trading_manager' },
  { username: 'ops',     password: 'ops123',    name: '林伟权', email: 'lin.weiquan@huitone.com',    roleKey: 'ops_manager' },
];

// ─── Devices ──────────────────────────────────────────────────────────────────
const seedDevices = [
  {
    id: 'E001', name: '富山站储能', type: '电网储能', status: '在线',
    capacity: 150, energy_capacity: 300, current_power: 86.4, soc: 65,
    location: '广州市番禺区石壁街道', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '富山站',
      projectName: '广州市番禺区富山220kV变电站150MW/300MWh新型独立储能项目',
      buildLocation: '广州市番禺区石壁街道东新高速禺山互通起点位置（禺山高架桥79号至禺山桥6号墩范围）',
      company: '广州颐海能源科技有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '314Ah / 3.2V',
      bmsModel: '科陆电子 BMS-3000', pcsModel: '阳光电源 SG3125HV', emsModel: '汇图EMS V2.1',
      investmentCost: 43500, commissionDate: '2025-06-15', warrantyYears: 10,
      soh: 97, cycleCount: 312, maxCellVoltage: 3284, minCellVoltage: 3271,
      cellMaxTemp: 31.2, cellMinTemp: 28.5, temperature: 26.3, humidity: 58, bmsAlarms: [],
    },
  },
  {
    id: 'E002', name: '聚龙站储能', type: '电网储能', status: '在线',
    capacity: 150, energy_capacity: 300, current_power: 72.0, soc: 71,
    location: '广州市番禺区石壁街道钟韦路63号', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '聚龙站',
      projectName: '广州市番禺区聚龙220kV变电站150MW/300MWh新型独立储能项目',
      buildLocation: '广州市番禺区石壁街道钟韦路63号',
      company: '广州颐投能源科技有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '314Ah / 3.2V',
      bmsModel: '科陆电子 BMS-3000', pcsModel: '阳光电源 SG3125HV', emsModel: '汇图EMS V2.1',
      investmentCost: 43500, commissionDate: '2025-07-20', warrantyYears: 10,
      soh: 96, cycleCount: 287, maxCellVoltage: 3291, minCellVoltage: 3268,
      cellMaxTemp: 30.8, cellMinTemp: 28.1, temperature: 25.8, humidity: 61, bmsAlarms: [],
    },
  },
  {
    id: 'E003', name: '厚德站储能', type: '电网储能', status: '在线',
    capacity: 100, energy_capacity: 200, current_power: 48.5, soc: 58,
    location: '广州市海珠区华洲街道土华村', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '厚德站',
      projectName: '广州市海珠区100MW/200MWh新型独立储能项目',
      buildLocation: '广州市海珠区华洲街道土华村"东丫围"（土名）、华南路东侧',
      company: '广州颐滨能源科技有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '280Ah / 3.2V',
      bmsModel: '比亚迪 BMS Pro', pcsModel: '华为 SmartPCS2000KL-H', emsModel: '汇图EMS V2.0',
      investmentCost: 29000, commissionDate: '2025-04-10', warrantyYears: 10,
      soh: 95, cycleCount: 423, maxCellVoltage: 3301, minCellVoltage: 3262,
      cellMaxTemp: 32.5, cellMinTemp: 29.3, temperature: 27.1, humidity: 65,
      bmsAlarms: ['单体温差偏大（3.2°C），建议检查散热风道'],
    },
  },
  {
    id: 'E004', name: '化龙站储能', type: '电网储能', status: '在线',
    capacity: 100, energy_capacity: 200, current_power: 61.2, soc: 82,
    location: '广州市番禺区化龙镇明经村', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '化龙站', projectName: '广州市番禺区化龙镇100MW/200MWh新型独立储能项目',
      buildLocation: '广州市番禺区化龙镇明经村295县道以南', company: '广州颐滨能源科技有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '280Ah / 3.2V',
      bmsModel: '比亚迪 BMS Pro', pcsModel: '华为 SmartPCS2000KL-H', emsModel: '汇图EMS V2.0',
      investmentCost: 29000, commissionDate: '2025-05-18', warrantyYears: 10,
      soh: 98, cycleCount: 378, maxCellVoltage: 3278, minCellVoltage: 3265,
      cellMaxTemp: 30.1, cellMinTemp: 27.8, temperature: 24.6, humidity: 55, bmsAlarms: [],
    },
  },
  {
    id: 'E005', name: '科城站储能', type: '电网储能', status: '在线',
    capacity: 200, energy_capacity: 400, current_power: 118.6, soc: 44,
    location: '广州市黄埔区联和街道', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '科城站', projectName: '广州市黄埔区新型独立储能（200MW/400MWh）项目',
      buildLocation: '广州市黄埔区联和街道科珠路与南翔一路交叉东南侧', company: '广东颐禾能源投资有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '314Ah / 3.2V',
      bmsModel: '宁德时代 BESS-BMS', pcsModel: '阳光电源 SG5000HV', emsModel: '汇图EMS V2.1',
      investmentCost: 58000, commissionDate: '2025-09-01', warrantyYears: 10,
      soh: 99, cycleCount: 198, maxCellVoltage: 3296, minCellVoltage: 3281,
      cellMaxTemp: 29.8, cellMinTemp: 27.2, temperature: 25.2, humidity: 52, bmsAlarms: [],
    },
  },
  {
    id: 'E006', name: '鱼飞站储能', type: '电网储能', status: '在线',
    capacity: 150, energy_capacity: 300, current_power: 94.3, soc: 76,
    location: '广州市南沙区东涌镇', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '鱼飞站', projectName: '广州市南沙区新型独立储能（150MW/300MWh）项目',
      buildLocation: '广州市南沙区东涌镇马克南街六巷和马发街交叉处', company: '广东颐禾能源投资有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '314Ah / 3.2V',
      bmsModel: '宁德时代 BESS-BMS', pcsModel: '阳光电源 SG3125HV', emsModel: '汇图EMS V2.1',
      investmentCost: 43500, commissionDate: '2025-08-12', warrantyYears: 10,
      soh: 98, cycleCount: 241, maxCellVoltage: 3288, minCellVoltage: 3274,
      cellMaxTemp: 33.1, cellMinTemp: 30.2, temperature: 28.4, humidity: 69,
      bmsAlarms: ['环境湿度偏高（69%），建议加强除湿处理'],
    },
  },
  {
    id: 'E007', name: '象山站储能', type: '电网储能', status: '在线',
    capacity: 200, energy_capacity: 400, current_power: 112.0, soc: 53,
    location: '深圳市宝安区新桥街道', last_update: '2026-03-16 10:30:00',
    extra_data: {
      station: '深圳象山站', projectName: '深圳市宝安象山200MW/400MWh新型储能项目',
      buildLocation: '深圳市宝安区新桥街道长流陂水库北侧新玉路北侧', company: '深圳市颐发能源科技有限公司',
      connectionType: 'IEC61850协议', batteryType: 'LFP磷酸铁锂', batterySpec: '314Ah / 3.2V',
      bmsModel: '比亚迪 BMS Pro', pcsModel: '华为 SmartPCS2000KL-H', emsModel: '汇图EMS V2.1',
      investmentCost: 58000, commissionDate: '2025-10-05', warrantyYears: 10,
      soh: 99, cycleCount: 163, maxCellVoltage: 3293, minCellVoltage: 3279,
      cellMaxTemp: 30.4, cellMinTemp: 27.6, temperature: 24.9, humidity: 57, bmsAlarms: [],
    },
  },
  { id: 'D001', name: '光伏电站-北区', type: '光伏电站', status: '在线', capacity: 50, energy_capacity: null, current_power: 38.5, soc: null, location: '北京市朝阳区', last_update: '2026-03-14 10:30:00', extra_data: { connectionType: 'MODBUS TCP', commissionDate: '2022-05-01', investmentCost: 15000 } },
  {
    id: 'D002', name: '顶盛物业储能', type: '储能系统', status: '在建', capacity: 0.65, energy_capacity: 1.3, current_power: 0, soc: 0, location: '广东省中山市', last_update: '2026-04-14 10:00:00',
    extra_data: { soh: 100, connectionType: 'MODBUS TCP', batteryType: 'LFP磷酸铁锂', batterySpec: '100Ah / 3.2V', bmsModel: '待安装', pcsModel: '待安装', emsModel: '待安装', investmentCost: 390, commissionDate: '', warrantyYears: 10, cycleCount: 0, maxCellVoltage: 0, minCellVoltage: 0, cellMaxTemp: 0, cellMinTemp: 0, temperature: 0, humidity: 0, bmsAlarms: [] },
  },
  { id: 'D003', name: '风电场-东区', type: '风电', status: '在线', capacity: 30, energy_capacity: null, current_power: 22.1, soc: null, location: '内蒙古呼和浩特', last_update: '2026-03-14 10:30:00', extra_data: { connectionType: '风机通讯协议', commissionDate: '2021-08-20', investmentCost: 18000 } },
  { id: 'D004', name: '充电桩群-CBD', type: '充电桩', status: '告警', capacity: 5, energy_capacity: null, current_power: 0, soc: null, location: '北京市西城区', last_update: '2026-03-14 10:28:00', extra_data: { connectionType: 'OCPP 1.6', commissionDate: '2024-01-10', investmentCost: 800 } },
  { id: 'D005', name: '工业负荷-钢厂', type: '工业负荷', status: '在线', capacity: 40, energy_capacity: null, current_power: 32.0, soc: null, location: '河北省唐山市', last_update: '2026-03-14 10:30:00', extra_data: { connectionType: '电表直采', commissionDate: '2023-06-01', investmentCost: 200 } },
  { id: 'D006', name: '光伏电站-南区', type: '光伏电站', status: '维护', capacity: 25, energy_capacity: null, current_power: 0, soc: null, location: '北京市大兴区', last_update: '2026-03-14 09:00:00', extra_data: { connectionType: 'MODBUS TCP', commissionDate: '2022-09-15', investmentCost: 7500 } },
  {
    id: 'D007', name: '蔚蓝服饰储能', type: '储能系统', status: '在建', capacity: 0.783, energy_capacity: 1.566, current_power: 0, soc: 0, location: '广东省湛江市', last_update: '2026-04-14 10:00:00',
    extra_data: { soh: 100, connectionType: 'MODBUS TCP', batteryType: 'LFP磷酸铁锂', batterySpec: '100Ah / 3.2V', bmsModel: '待安装', pcsModel: '待安装', emsModel: '待安装', investmentCost: 470, commissionDate: '', warrantyYears: 10, cycleCount: 0, maxCellVoltage: 0, minCellVoltage: 0, cellMaxTemp: 0, cellMinTemp: 0, temperature: 0, humidity: 0, bmsAlarms: [] },
  },
  {
    id: 'D011', name: '弘国五金储能', type: '储能系统', status: '在建', capacity: 2.61, energy_capacity: 5.22, current_power: 0, soc: 0, location: '广东省惠州市', last_update: '2026-04-14 10:00:00',
    extra_data: { soh: 100, connectionType: 'MODBUS TCP', batteryType: 'LFP磷酸铁锂', batterySpec: '100Ah / 3.2V', bmsModel: '待安装', pcsModel: '待安装', emsModel: '待安装', investmentCost: 1566, commissionDate: '', warrantyYears: 10, cycleCount: 0, maxCellVoltage: 0, minCellVoltage: 0, cellMaxTemp: 0, cellMinTemp: 0, temperature: 0, humidity: 0, bmsAlarms: [] },
  },
  { id: 'D008', name: '风电场-西区', type: '风电', status: '离线', capacity: 20, energy_capacity: null, current_power: 0, soc: null, location: '张家口市', last_update: '2026-03-14 08:15:00', extra_data: { connectionType: '风机通讯协议', commissionDate: '2020-12-01', investmentCost: 12000 } },
  { id: 'D009', name: '充电桩群-园区', type: '充电桩', status: '在线', capacity: 3, energy_capacity: null, current_power: 1.8, soc: null, location: '北京市昌平区', last_update: '2026-03-14 10:30:00', extra_data: { connectionType: 'OCPP 1.6', commissionDate: '2024-06-01', investmentCost: 480 } },
  { id: 'D010', name: '工业负荷-化工', type: '工业负荷', status: '在线', capacity: 35, energy_capacity: null, current_power: 28.5, soc: null, location: '天津市东丽区', last_update: '2026-03-14 10:30:00', extra_data: { connectionType: '电表直采', commissionDate: '2023-09-01', investmentCost: 150 } },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
const seedTasks = [
  { id: 'T001', name: '高峰调峰任务-01', type: '调峰', status: '执行中', target_power: 50, current_power: 42.3, start_time: '2026-03-14 09:00', end_time: '2026-03-14 12:00', progress: 65, reward: 125000 },
  { id: 'T002', name: '频率调节任务-A', type: '调频', status: '待响应', target_power: 30, current_power: 0, start_time: '2026-03-14 14:00', end_time: '2026-03-14 16:00', progress: 0, reward: 80000 },
  { id: 'T003', name: '备用容量响应-03', type: '备用', status: '已完成', target_power: 20, current_power: 20, start_time: '2026-03-13 20:00', end_time: '2026-03-14 08:00', progress: 100, reward: 56000 },
  { id: 'T004', name: '夜间调峰任务-02', type: '调峰', status: '已完成', target_power: 40, current_power: 40, start_time: '2026-03-13 22:00', end_time: '2026-03-14 06:00', progress: 100, reward: 98000 },
  { id: 'T005', name: '应急调频任务-B', type: '调频', status: '待响应', target_power: 25, current_power: 0, start_time: '2026-03-14 16:00', end_time: '2026-03-14 18:00', progress: 0, reward: 62000 },
];

// ─── Revenue ──────────────────────────────────────────────────────────────────
function generateRevenue() {
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const rng = (base: number, range: number) => Math.round((base + Math.random() * range) * 1000);
  return months.map(month => {
    const peak = rng(80, 60);
    const freq = rng(40, 30);
    const aux  = rng(20, 20);
    return { year: 2025, month, peak_revenue: peak, freq_revenue: freq, aux_revenue: aux, total_revenue: peak + freq + aux };
  });
}

// ─── News ─────────────────────────────────────────────────────────────────────
const seedNews = [
  { id: 'N001', category: '现货市场', source: '广东电力交易中心', date: '2026-03-16', title: '广东现货市场3月第三周日前均价环比下降8.3%', summary: '受近期水电来水偏丰及新能源出力增加影响，广东现货市场3月第三周日前均价降至约0.412元/kWh，较上周环比下降8.3%。尖峰时段（19:00-21:00）最高申报价格达1.248元/kWh，谷时低点约0.081元/kWh，峰谷价差仍维持高位，套利空间显著。储能电站可通过深谷充电、尖峰放电实现最大化收益。', tags: ['现货价格', '峰谷套利', '广东电力'] },
  { id: 'N002', category: '现货市场', source: '中电联', date: '2026-03-16', title: '南方区域现货市场联合结算机制正式启动，跨省套利空间受限', summary: '南方区域电力市场管理委员会宣布，跨省现货联合结算机制已于本周正式启动。', tags: ['区域市场', '跨省结算', '南方电网'] },
  { id: 'N003', category: '现货市场', source: '国家电力调度中心', date: '2026-03-15', title: '全国电力现货市场扩容：新增6省进入模拟运行阶段', summary: '国家能源局最新公告显示，湖南、湖北、江西、四川、重庆、浙江六省已进入电力现货市场扩大规模模拟运行阶段。', tags: ['现货扩容', '政策利好', '全国市场'] },
  { id: 'N004', category: '现货市场', source: '广东电力交易中心', date: '2026-03-15', title: '广东2026年Q2容量市场结果公布：独立储能容量申报价均值1820元/MW·月', summary: '广东电力交易中心发布2026年第二季度容量市场出清结果，独立储能申报容量价格均值为1820元/MW·月。', tags: ['容量市场', '独立储能', '广东Q2'] },
  { id: 'N005', category: '现货市场', source: '电力头条', date: '2026-03-14', title: '极端天气预警：本周南方电网用电负荷预计创季节性新高', summary: '气象部门发布高温预警，广东地区本周最高气温将达33°C，南方电网预测最大负荷将达1.42亿千瓦。', tags: ['高温预警', '负荷高峰', '套利机会'] },
  { id: 'N006', category: '政策法规', source: '国家发展改革委', date: '2026-03-16', title: '发改委发布《新型储能参与电力市场指导意见》征求意见稿', summary: '国家发展改革委正式发布《关于新型储能参与电力市场及价格政策的指导意见（征求意见稿）》，明确新型储能可同时申报调频辅助服务与现货市场。', tags: ['储能政策', '容量补偿', '多市场参与'] },
  { id: 'N007', category: '政策法规', source: '广东省发改委', date: '2026-03-15', title: '广东发布VPP聚合商备案管理办法，明确等保三级合规要求', summary: '广东省发展和改革委员会正式印发《广东省虚拟电厂聚合商备案管理暂行办法》。', tags: ['VPP监管', '等保合规', '广东政策'] },
  { id: 'N008', category: '政策法规', source: '国家能源局', date: '2026-03-14', title: '能源局明确AGC直控响应时间标准：毫秒级要求写入行业规范', summary: '国家能源局发布《电力系统调频辅助服务市场运营规范》修订版，首次在国家层面明确AGC直控指令的响应时间要求。', tags: ['AGC标准', 'K值规范', '调频市场'] },
  { id: 'N009', category: '政策法规', source: '南方监管局', date: '2026-03-13', title: '南方能源监管局开展2026年电力交易合规专项检查', summary: '南方能源监管局宣布启动2026年电力交易市场合规专项检查工作。', tags: ['合规检查', '监管执法', '申报合规'] },
  { id: 'N010', category: '储能动态', source: '储能头条', date: '2026-03-16', title: '比亚迪发布第五代液冷储能系统，系统效率突破93%', summary: '比亚迪储能发布全新MC-Cube 5.0液冷储能系统，单柜能量密度达480kWh，循环寿命突破1.2万次，系统效率达93.2%。', tags: ['比亚迪', '液冷储能', '技术突破'] },
  { id: 'N011', category: '储能动态', source: '中国储能网', date: '2026-03-15', title: '广东电网侧储能装机容量突破5GW，在运项目达156个', summary: '据南方电网发布的最新数据，截至2026年3月，广东省电网侧储能累计装机容量已突破5GW/10GWh。', tags: ['电网储能', '广东装机', '市场规模'] },
  { id: 'N012', category: '储能动态', source: '科城电力研究院', date: '2026-03-14', title: 'SOH衰减速率研究：不同调度策略对电池寿命影响差异达40%', summary: '科城电力研究院发布储能电站全生命周期管理研究报告，分析了不同调度策略对电池SOH衰减的影响。', tags: ['SOH管理', '电池衰减', '运维策略'] },
  { id: 'N013', category: '储能动态', source: '能源界', date: '2026-03-13', title: '全钒液流电池迎来规模化应用窗口，长时储能补贴政策有望出台', summary: '业内消息显示，国家能源局正在研究针对4小时以上长时储能的专项补贴政策。', tags: ['长时储能', '液流电池', '补贴政策'] },
  { id: 'N014', category: '需求响应', source: '广东电力需求响应中心', date: '2026-03-16', title: '广东启动2026年首次市场化需求响应，邀约规模500万千瓦', summary: '广东省需求侧管理中心发布公告，定于本周四（3月19日）14:00-17:00开展2026年首次市场化需求响应活动。', tags: ['需求响应', '市场化', '广东2026'] },
  { id: 'N015', category: '需求响应', source: '电网头条', date: '2026-03-15', title: '南方电网启动迎峰度夏需求响应提前准备工作', summary: '南方电网启动2026年迎峰度夏（5月-9月）电力保供准备工作，需求响应资源规模目标为1500万千瓦。', tags: ['迎峰度夏', '快速响应', '补贴提升'] },
  { id: 'N016', category: '需求响应', source: '中国能源报', date: '2026-03-14', title: '工业负荷柔性聚合技术突破：单一VPP聚合商最大响应容量记录刷新', summary: '汇通能源在广东省需求响应演练中创下单一VPP聚合商最大响应容量记录：234MW。', tags: ['VPP聚合', '响应记录', '工业负荷'] },
  { id: 'N017', category: '需求响应', source: '广东省电力局', date: '2026-03-13', title: '广东需求响应辅助服务市场月度结算：3月总支付金额达1.82亿元', summary: '广东省电力局公布2026年3月第一批需求响应辅助服务市场结算结果，本批次共有127家聚合商参与，总支付金额1.82亿元。', tags: ['结算公告', '需求响应市场', '储能补贴'] },
  { id: 'N018', category: '价格行情', source: '上海钢联', date: '2026-03-16', title: '碳酸锂价格本周环比下跌3.2%，储能系统EPC成本再创新低', summary: '电池级碳酸锂本周现货价格降至7.8万元/吨，环比下跌3.2%。', tags: ['碳酸锂', '储能成本', '原材料价格'] },
  { id: 'N019', category: '价格行情', source: '电力现货价格监测中心', date: '2026-03-15', title: '广东电力现货日前市场价格预测：明日峰谷价差预计扩大至1.15元/kWh', summary: '根据气象预报和系统预测，明日广东电力现货日前市场峰谷价差预计达1.15元/kWh。', tags: ['价格预测', '峰谷价差', '明日行情'] },
  { id: 'N020', category: '价格行情', source: '新华财经', date: '2026-03-14', title: '2026年Q1全国省级现货市场价格回顾：南方区域均价最高', summary: '新华财经发布2026年一季度电力现货市场价格报告，广东省日前市场均价最高，达0.487元/kWh。', tags: ['季度报告', '区域价格', '市场对比'] },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users
    for (const u of seedUsers) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (username, password_hash, name, email, role_key)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [u.username, hash, u.name, u.email, u.roleKey]
      );
    }
    console.log('✅ Users seeded');

    // Devices
    for (const d of seedDevices) {
      await client.query(
        `INSERT INTO devices (id, name, type, status, capacity, energy_capacity, current_power, location, last_update, soc, extra_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.name, d.type, d.status, d.capacity, d.energy_capacity, d.current_power, d.location, d.last_update, d.soc, JSON.stringify(d.extra_data)]
      );
    }
    console.log('✅ Devices seeded');

    // Tasks
    for (const t of seedTasks) {
      await client.query(
        `INSERT INTO demand_response_tasks (id, name, type, status, target_power, current_power, start_time, end_time, progress, reward)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name, t.type, t.status, t.target_power, t.current_power, t.start_time, t.end_time, t.progress, t.reward]
      );
    }
    console.log('✅ Tasks seeded');

    // Revenue
    for (const r of generateRevenue()) {
      await client.query(
        `INSERT INTO revenue (year, month, peak_revenue, freq_revenue, aux_revenue, total_revenue)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (year, month) DO NOTHING`,
        [r.year, r.month, r.peak_revenue, r.freq_revenue, r.aux_revenue, r.total_revenue]
      );
    }
    console.log('✅ Revenue seeded');

    // News
    for (const n of seedNews) {
      await client.query(
        `INSERT INTO news (id, title, summary, source, date, category, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [n.id, n.title, n.summary, n.source, n.date, n.category, JSON.stringify(n.tags)]
      );
    }
    console.log('✅ News seeded');

    await client.query('COMMIT');
    console.log('\n✅ All seed data inserted successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
