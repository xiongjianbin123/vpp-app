import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface DbDevice {
  status: string;
  type: string;
  capacity: number;
  current_power: number;
}

function generate24hData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hour = time.getHours();
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

// GET /api/dashboard
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const rows = await query<DbDevice>('SELECT status, type, capacity, current_power FROM devices');

  const totalCapacity = rows.reduce((a, d) => a + Number(d.capacity), 0);
  const onlineDevices = rows.filter(d => d.status === '在线');
  const totalCurrentPower = onlineDevices.reduce((a, d) => a + Number(d.current_power), 0);
  const onlineCount = onlineDevices.length;
  const totalCount = rows.length;

  const statusCount = rows.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const energyPie = rows.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + Number(d.capacity);
    return acc;
  }, {} as Record<string, number>);

  res.json({
    totalCapacity,
    totalCurrentPower: Math.round(totalCurrentPower * 10) / 10,
    onlineCount,
    totalCount,
    statusCount,
    energyPie,
    powerData: generate24hData(),
  });
});

export default router;
