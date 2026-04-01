import api from './api';

export interface RevenueRecord {
  id: number;
  month: string;
  peakRevenue: number;
  freqRevenue: number;
  auxRevenue: number;
  totalRevenue: number;
}

const mockRevenue: RevenueRecord[] = [
  { id: 1, month: '1月', peakRevenue: 280000, freqRevenue: 150000, auxRevenue: 85000, totalRevenue: 515000 },
  { id: 2, month: '2月', peakRevenue: 320000, freqRevenue: 180000, auxRevenue: 92000, totalRevenue: 592000 },
  { id: 3, month: '3月', peakRevenue: 380000, freqRevenue: 210000, auxRevenue: 108000, totalRevenue: 698000 },
];

export async function getMonthlyRevenue(year = 2025): Promise<RevenueRecord[]> {
  try {
    const res = await api.get<RevenueRecord[]>('/revenue', { params: { year } });
    return res.data;
  } catch {
    return mockRevenue;
  }
}
