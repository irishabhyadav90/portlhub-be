import express from 'express';
import userRoutes from './routes/user.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json());

  // Lightweight health check for local checks and future orchestration.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
  });

  app.use('/api/users', userRoutes);

  // 404 for anything unmatched.
  app.use((req, res) => {
    res.status(404).json({
      error: { message: 'Route not found', code: 'NOT_FOUND' },
    });
  });

  // Centralized error handler. Keep responses consistent and never leak
  // stack traces or raw DB errors to the client.
  // eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
  app.use((err, req, res, next) => {
    console.error('[user-service] Unhandled error:', err);

    // Postgres unique-violation safety net in case a race slips past our
    // pre-checks (e.g. two simultaneous registrations).
    if (err && err.code === '23505') {
      return res.status(409).json({
        error: {
          message: 'A record with that value already exists',
          code: 'CONFLICT',
        },
      });
    }

    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
  });

  return app;
}
