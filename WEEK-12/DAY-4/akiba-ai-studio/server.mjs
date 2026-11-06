import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApiRouter } from './server/api.js';
import { createAuthRouter, requireAuth } from './server/auth.js';
import { createDatabase } from './server/database.js';

const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const databaseDirectory = path.join(projectDirectory, 'database');
mkdirSync(databaseDirectory, { recursive: true });

const databasePath = process.env.DATABASE_PATH || path.join(databaseDirectory, 'akiba.sqlite');
const db = createDatabase(databasePath);
const app = express();
app.use('/api/auth', createAuthRouter(db));
app.use('/api', requireAuth(db), createApiRouter(db));

if (process.env.NODE_ENV === 'production' || process.argv.includes('--production')) {
  app.use(express.static(path.join(projectDirectory, 'dist')));
  app.get('*', (_request, response) => response.sendFile(path.join(projectDirectory, 'dist', 'index.html')));
} else {
  const vite = await createViteServer({
    configFile: path.join(projectDirectory, 'vite.config.ts'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Akiba app and SQLite API running at http://localhost:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});
