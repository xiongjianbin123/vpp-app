import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface DbTask {
  id: string;
  name: string;
  type: string;
  status: string;
  target_power: number;
  current_power: number;
  start_time: string;
  end_time: string;
  progress: number;
  reward: number;
}

function toApiTask(t: DbTask) {
  return {
    id: t.id,
    name: t.name,
    type: t.type,
    status: t.status,
    targetPower: Number(t.target_power),
    currentPower: Number(t.current_power),
    startTime: t.start_time,
    endTime: t.end_time,
    progress: Number(t.progress),
    reward: Number(t.reward),
  };
}

// GET /api/tasks
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const rows = await query<DbTask>('SELECT * FROM demand_response_tasks ORDER BY id');
  res.json(rows.map(toApiTask));
});

// POST /api/tasks
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { id, name, type, status = '待响应', targetPower, currentPower = 0, startTime, endTime, progress = 0, reward = 0 } = req.body;
  const rows = await query<DbTask>(
    `INSERT INTO demand_response_tasks (id, name, type, status, target_power, current_power, start_time, end_time, progress, reward)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, name, type, status, targetPower, currentPower, startTime, endTime, progress, reward]
  );
  res.status(201).json(toApiTask(rows[0]));
});

// PUT /api/tasks/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { name, type, status, targetPower, currentPower, startTime, endTime, progress, reward } = req.body;
  const rows = await query<DbTask>(
    `UPDATE demand_response_tasks SET
       name = COALESCE($2, name),
       type = COALESCE($3, type),
       status = COALESCE($4, status),
       target_power = COALESCE($5, target_power),
       current_power = COALESCE($6, current_power),
       start_time = COALESCE($7, start_time),
       end_time = COALESCE($8, end_time),
       progress = COALESCE($9, progress),
       reward = COALESCE($10, reward)
     WHERE id = $1 RETURNING *`,
    [req.params.id, name, type, status, targetPower, currentPower, startTime, endTime, progress, reward]
  );
  if (!rows[0]) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(toApiTask(rows[0]));
});

export default router;
