import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface DbRevenue {
  id: number;
  year: number;
  month: string;
  peak_revenue: number;
  freq_revenue: number;
  aux_revenue: number;
  total_revenue: number;
}

// GET /api/revenue?year=2025
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const year = req.query.year ? Number(req.query.year) : 2025;
  const rows = await query<DbRevenue>(
    'SELECT * FROM revenue WHERE year = $1 ORDER BY id',
    [year]
  );
  res.json(rows.map(r => ({
    id: r.id,
    month: r.month,
    peakRevenue: Number(r.peak_revenue),
    freqRevenue: Number(r.freq_revenue),
    auxRevenue: Number(r.aux_revenue),
    totalRevenue: Number(r.total_revenue),
  })));
});

export default router;
