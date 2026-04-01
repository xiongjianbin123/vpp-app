import api from './api';
import { mockDevices, generate24hData } from '../mock/data';

export interface DashboardData {
  totalCapacity: number;
  totalCurrentPower: number;
  onlineCount: number;
  totalCount: number;
  statusCount: Record<string, number>;
  energyPie: Record<string, number>;
  powerData: Array<Record<string, string | number>>;
}

function buildMockDashboard(): DashboardData {
  const devices = mockDevices;
  const totalCapacity = devices.reduce((s, d) => s + d.capacity, 0);
  const totalCurrentPower = devices.reduce((s, d) => s + d.currentPower, 0);
  const onlineCount = devices.filter(d => d.status === '在线').length;
  const statusCount: Record<string, number> = {};
  devices.forEach(d => { statusCount[d.status] = (statusCount[d.status] || 0) + 1; });
  const energyPie: Record<string, number> = {};
  devices.forEach(d => { energyPie[d.type] = (energyPie[d.type] || 0) + d.capacity; });
  return {
    totalCapacity: Math.round(totalCapacity * 10) / 10,
    totalCurrentPower: Math.round(totalCurrentPower * 10) / 10,
    onlineCount,
    totalCount: devices.length,
    statusCount,
    energyPie,
    powerData: generate24hData(),
  };
}

export async function getDashboard(): Promise<DashboardData> {
  try {
    const res = await api.get<DashboardData>('/dashboard');
    return res.data;
  } catch {
    return buildMockDashboard();
  }
}
