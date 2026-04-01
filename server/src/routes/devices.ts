import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

interface DbDevice {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity: number;
  energy_capacity: number | null;
  current_power: number;
  location: string;
  last_update: string;
  soc: number | null;
  extra_data: Record<string, unknown>;
}

function toApiDevice(d: DbDevice) {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    status: d.status,
    capacity: Number(d.capacity),
    energyCapacity: d.energy_capacity != null ? Number(d.energy_capacity) : undefined,
    currentPower: Number(d.current_power),
    location: d.location,
    lastUpdate: d.last_update,
    soc: d.soc != null ? Number(d.soc) : undefined,
    ...d.extra_data,
  };
}

// GET /api/devices
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const rows = await query<DbDevice>('SELECT * FROM devices ORDER BY id');
  res.json(rows.map(toApiDevice));
});

// GET /api/devices/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const rows = await query<DbDevice>('SELECT * FROM devices WHERE id = $1', [req.params.id]);
  if (!rows[0]) { res.status(404).json({ error: 'Device not found' }); return; }
  res.json(toApiDevice(rows[0]));
});

// POST /api/devices
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { id, name, type, status = '在线', capacity, energyCapacity, currentPower = 0, location, lastUpdate, soc, ...rest } = req.body;
  const rows = await query<DbDevice>(
    `INSERT INTO devices (id, name, type, status, capacity, energy_capacity, current_power, location, last_update, soc, extra_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [id, name, type, status, capacity, energyCapacity ?? null, currentPower, location, lastUpdate, soc ?? null, JSON.stringify(rest)]
  );
  res.status(201).json(toApiDevice(rows[0]));
});

// PUT /api/devices/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { name, type, status, capacity, energyCapacity, currentPower, location, lastUpdate, soc, ...rest } = req.body;
  const rows = await query<DbDevice>(
    `UPDATE devices SET
       name = COALESCE($2, name),
       type = COALESCE($3, type),
       status = COALESCE($4, status),
       capacity = COALESCE($5, capacity),
       energy_capacity = COALESCE($6, energy_capacity),
       current_power = COALESCE($7, current_power),
       location = COALESCE($8, location),
       last_update = COALESCE($9, last_update),
       soc = COALESCE($10, soc),
       extra_data = extra_data || $11::jsonb
     WHERE id = $1 RETURNING *`,
    [req.params.id, name, type, status, capacity, energyCapacity, currentPower, location, lastUpdate, soc, JSON.stringify(rest)]
  );
  if (!rows[0]) { res.status(404).json({ error: 'Device not found' }); return; }
  res.json(toApiDevice(rows[0]));
});

// DELETE /api/devices/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  await query('DELETE FROM devices WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
