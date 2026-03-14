// Mock data for VPP App

export interface Device {
  id: string;
  name: string;
  type: '光伏电站' | '储能系统' | '风电' | '充电桩' | '工业负荷';
  status: '在线' | '离线' | '维护' | '告警';
  capacity: number; // MW
  currentPower: number; // MW
  location: string;
  lastUpdate: string;
  soc?: number; // battery state of charge %
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
  { id: 'D001', name: '光伏电站-北区', type: '光伏电站', status: '在线', capacity: 50, currentPower: 38.5, location: '北京市朝阳区', lastUpdate: '2026-03-14 10:30:00', },
  { id: 'D002', name: '储能系统-A', type: '储能系统', status: '在线', capacity: 20, currentPower: 15.2, location: '北京市海淀区', lastUpdate: '2026-03-14 10:30:00', soc: 72 },
  { id: 'D003', name: '风电场-东区', type: '风电', status: '在线', capacity: 30, currentPower: 22.1, location: '内蒙古呼和浩特', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D004', name: '充电桩群-CBD', type: '充电桩', status: '告警', capacity: 5, currentPower: 0, location: '北京市西城区', lastUpdate: '2026-03-14 10:28:00' },
  { id: 'D005', name: '工业负荷-钢厂', type: '工业负荷', status: '在线', capacity: 40, currentPower: 32.0, location: '河北省唐山市', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D006', name: '光伏电站-南区', type: '光伏电站', status: '维护', capacity: 25, currentPower: 0, location: '北京市大兴区', lastUpdate: '2026-03-14 09:00:00' },
  { id: 'D007', name: '储能系统-B', type: '储能系统', status: '在线', capacity: 15, currentPower: 8.5, location: '天津市滨海新区', lastUpdate: '2026-03-14 10:30:00', soc: 58 },
  { id: 'D008', name: '风电场-西区', type: '风电', status: '离线', capacity: 20, currentPower: 0, location: '张家口市', lastUpdate: '2026-03-14 08:15:00' },
  { id: 'D009', name: '充电桩群-园区', type: '充电桩', status: '在线', capacity: 3, currentPower: 1.8, location: '北京市昌平区', lastUpdate: '2026-03-14 10:30:00' },
  { id: 'D010', name: '工业负荷-化工', type: '工业负荷', status: '在线', capacity: 35, currentPower: 28.5, location: '天津市东丽区', lastUpdate: '2026-03-14 10:30:00' },
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
