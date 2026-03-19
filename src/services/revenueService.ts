import api from './api';

export interface RevenueRecord {
  id: number;
  month: string;
  peakRevenue: number;
  freqRevenue: number;
  auxRevenue: number;
  totalRevenue: number;
}

export async function getMonthlyRevenue(): Promise<RevenueRecord[]> {
  const res = await api.get<{ data: RevenueRecord[] }>('/revenue/monthly');
  return res.data.data;
}
