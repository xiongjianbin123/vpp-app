import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import passport from './config/passport';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import tasksRouter from './routes/tasks';
import dashboardRouter from './routes/dashboard';
import revenueRouter from './routes/revenue';
import newsRouter from './routes/news';

const app = express();
const PORT = process.env.PORT ?? 3001;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json());

// ─── Session (required by Passport for OAuth state) ───────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 },
}));

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/revenue', revenueRouter);
app.use('/api/news', newsRouter);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 VPP server running at http://localhost:${PORT}`);
});

export default app;
