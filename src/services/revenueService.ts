import { generateMonthlyRevenue } from '../mock/data';

export interface RevenueRecord {
  id: number;
  month: string;
  peakRevenue: number;
  freqRevenue: number;
  auxRevenue: number;
  totalRevenue: number;
}

export async function getMonthlyRevenue(): Promise<RevenueRecord[]> {
  return generateMonthlyRevenue().map((item, i) => ({
    id: i + 1,
    month: item.month,
    peakRevenue: item.调峰收益,
    freqRevenue: item.调频收益,
    auxRevenue: item.辅助服务,
    totalRevenue: item.总收益,
  }));
}
