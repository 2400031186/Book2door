import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import { generalLimiter } from './middleware/rateLimit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, corsOrigins[0] || true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'book2door-api' });
});

app.get('/health/db', async (_req, res) => {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!key.startsWith('eyJ') && !key.startsWith('sb_secret_')) {
      return res.status(503).json({
        status: 'error',
        message: 'SUPABASE_SERVICE_ROLE_KEY is missing or invalid',
      });
    }

    const { supabase } = await import('./config/supabase.js');
    const { error } = await supabase.from('settings').select('key').limit(1);
    if (error) throw error;

    res.json({ status: 'ok', supabase: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large. Max upload size is 4.5MB on Vercel.',
    });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Book2Door API running on port ${PORT}`);
  });
}

export default app;
