import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface DbNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  category: string;
  tags: string[];
}

// GET /api/news?category=现货市场
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { category } = req.query as { category?: string };
  let rows: DbNews[];
  if (category) {
    rows = await query<DbNews>(
      'SELECT * FROM news WHERE category = $1 ORDER BY date DESC, id',
      [category]
    );
  } else {
    rows = await query<DbNews>('SELECT * FROM news ORDER BY date DESC, id');
  }
  res.json(rows.map(n => ({
    id: n.id,
    title: n.title,
    summary: n.summary,
    source: n.source,
    date: typeof n.date === 'string' ? n.date : new Date(n.date).toISOString().split('T')[0],
    category: n.category,
    tags: Array.isArray(n.tags) ? n.tags : JSON.parse(n.tags as unknown as string),
  })));
});

export default router;
