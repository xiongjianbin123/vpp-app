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
  soc?: number; // battery state of charge %
  // 电网侧储能专属字段
  station?: string;       // 站点名称
  projectName?: string;   // 项目全称
  buildLocation?: string; // 建设地点
  company?: string;       // 申报公司
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
  { id: 'D001', name: '光伏电站-北区', type: '光伏电站', status: '在线', capacity: 50, currentPower: 38.5, location: '北京市朝阳区', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D002', name: '储能系统-A', type: '储能系统', status: '在线', capacity: 20, currentPower: 15.2, location: '北京市海淀区', lastUpdate: '2026-03-14 10:30:00', soc: 72 },
  { id: 'D003', name: '风电场-东区', type: '风电', status: '在线', capacity: 30, currentPower: 22.1, location: '内蒙古呼和浩特', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D004', name: '充电桩群-CBD', type: '充电桩', status: '告警', capacity: 5, currentPower: 0, location: '北京市西城区', lastUpdate: '2026-03-14 10:28:00' },
  { id: 'D005', name: '工业负荷-钢厂', type: '工业负荷', status: '在线', capacity: 40, currentPower: 32.0, location: '河北省唐山市', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D006', name: '光伏电站-南区', type: '光伏电站', status: '维护', capacity: 25, currentPower: 0, location: '北京市大兴区', lastUpdate: '2026-03-14 09:00:00' },
  { id: 'D007', name: '储能系统-B', type: '储能系统', status: '在线', capacity: 15, currentPower: 8.5, location: '天津市滨海新区', lastUpdate: '2026-03-14 10:30:00', soc: 58 },
  { id: 'D008', name: '风电场-西区', type: '风电', status: '离线', capacity: 20, currentPower: 0, location: '张家口市', lastUpdate: '2026-03-14 08:15:00' },
  { id: 'D009', name: '充电桩群-园区', type: '充电桩', status: '在线', capacity: 3, currentPower: 1.8, location: '北京市昌平区', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D010', name: '工业负荷-化工', type: '工业负荷', status: '在线', capacity: 35, currentPower: 28.5, location: '天津市东丽区', lastUpdate: '2026-03-14 10:30:00' },

  // 电网侧独立储能项目
  {
    id: 'E001', name: '富山站储能', type: '电网储能', status: '在线',
    capacity: 150, energyCapacity: 300, currentPower: 86.4, soc: 65,
    location: '广州市番禺区石壁街道',
    lastUpdate: '2026-03-16 10:30:00',
    station: '富山站',
    projectName: '广州市番禺区富山220kV变电站150MW/300MWh新型独立储能项目',
    buildLocation: '广州市番禺区石壁街道东新高速禺山互通起点位置（禺山高架桥79号至禺山桥6号墩范围）',
    company: '广州颐海能源科技有限公司',
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
  },
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
