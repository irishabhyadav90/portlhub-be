import 'dotenv/config';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './db/index.js';

const PORT = Number(process.env.PORT) || 4001;

async function start() {
  await connectDb();
  console.log('[link-service] connected to MongoDB');

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[link-service] listening on http://localhost:${PORT}`);
  });

  // Graceful shutdown — close the HTTP server and the Mongo connection.
  async function shutdown(signal) {
    console.log(`[link-service] received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('[link-service] failed to start:', err);
  process.exit(1);
});
