import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import passport from '../config/passport';
import { query } from '../config/database';
import { requireAuth, signToken, JwtPayload } from '../middleware/auth';
import { getRoleOrDefault } from '../config/roles';

const router = Router();

interface DbUser {
  id: number;
  username: string;
  password_hash: string;
  name: string;
  email: string;
  role_key: string;
}

function buildUserResponse(user: DbUser) {
  const role = getRoleOrDefault(user.role_key);
  return {
    username: user.username,
    name: user.name,
    email: user.email,
    roleKey: user.role_key,
    roleLabel: role.label,
    allowedRoutes: role.allowedRoutes,
  };
}

// POST /api/auth/login — username + password
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const rows = await query<DbUser>('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];

  if (!user || !user.password_hash) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const payload: JwtPayload = { userId: user.id, username: user.username, roleKey: user.role_key };
  const token = signToken(payload);
  res.json({ token, user: buildUserResponse(user) });
});

// GET /api/auth/me — return current user from JWT
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const { username } = (req as Request & { user: JwtPayload }).user;
  const rows = await query<DbUser>('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user) { res.status(404).json({ error: '用户不存在' }); return; }
  res.json(buildUserResponse(user));
});

// POST /api/auth/logout — client-side JWT; just acknowledge
router.post('/logout', (_req, res) => {
  res.json({ ok: true });
});

// GET /api/auth/github — initiate GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// GET /api/auth/github/callback — OAuth callback
router.get(
  '/github/callback',
  passport.authenticate('github', { session: true, failureRedirect: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/#/login?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as { id: number; username: string; roleKey: string; name: string; email: string; roleLabel: string; allowedRoutes: string[] };
    const payload: JwtPayload = { userId: user.id, username: user.username, roleKey: user.roleKey };
    const token = signToken(payload);
    const userParam = encodeURIComponent(JSON.stringify({
      username: user.username,
      name: user.name,
      email: user.email,
      roleKey: user.roleKey,
      roleLabel: user.roleLabel,
      allowedRoutes: user.allowedRoutes,
    }));
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/#/oauth-callback?token=${token}&user=${userParam}`);
  }
);

export default router;
