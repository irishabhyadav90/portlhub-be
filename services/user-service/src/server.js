import 'dotenv/config';
import { createApp } from './app.js';
import { pool } from './db/index.js';

const PORT = Number(process.env.PORT) || 4000;

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`[user-service] listening on http://localhost:${PORT}`);
});

// Graceful shutdown — close the HTTP server and the PG pool.
async function shutdown(signal) {
  console.log(`[user-service] received ${signal}, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
