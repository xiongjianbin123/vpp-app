import api from './api';

export interface DashboardData {
  totalCapacity: number;
  totalCurrentPower: number;
  onlineCount: number;
  totalCount: number;
  statusCount: Record<string, number>;
  energyPie: Record<string, number>;
  powerData: Array<Record<string, string | number>>;
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await api.get<{ data: DashboardData }>('/dashboard');
  return res.data.data;
}
