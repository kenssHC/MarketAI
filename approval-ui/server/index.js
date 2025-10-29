import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import draftsRouter from './routes/drafts.js';
import keywordsRouter from './routes/keywords.js';
import { query } from './db.js';
import { startScheduler } from './services/scheduler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[api] healthcheck failed', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.use('/api/keywords', keywordsRouter);
app.use('/api/drafts', draftsRouter);

if (fs.existsSync(config.frontendBuildDir)) {
  app.use(express.static(config.frontendBuildDir));
  app.get('*', (_req, res, next) => {
    const indexPath = path.join(config.frontendBuildDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
}

app.use((err, _req, res, _next) => {
  console.error('[api] unexpected error', err);
  res.status(500).json({ message: 'Error inesperado en el servidor', details: err.message });
});

app.listen(config.apiPort, () => {
  console.log(`Approval API listening on http://localhost:${config.apiPort}`);
  
  // Iniciar el scheduler de publicaciones programadas
  startScheduler();
});
