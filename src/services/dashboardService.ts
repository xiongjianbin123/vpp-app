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

export async function getDashboard(): Promise<DashboardData> {
  const totalCapacity = mockDevices.reduce((a, d) => a + d.capacity, 0);
  const totalCurrentPower = mockDevices.filter(d => d.status === '在线').reduce((a, d) => a + d.currentPower, 0);
  const onlineCount = mockDevices.filter(d => d.status === '在线').length;
  const totalCount = mockDevices.length;

  const statusCount = mockDevices.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const energyPie = mockDevices.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + d.capacity;
    return acc;
  }, {} as Record<string, number>);

  return { totalCapacity, totalCurrentPower, onlineCount, totalCount, statusCount, energyPie, powerData: generate24hData() };
}
