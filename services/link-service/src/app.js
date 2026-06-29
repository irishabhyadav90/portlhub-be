import express from 'express';
import morgan from 'morgan';
import platformRoutes from './routes/platform.routes.js';
import linkRoutes from './routes/link.routes.js';

export function createApp() {
  const app = express();

  // Request logging. 'dev' logs method/path/status/response-time only — never
  // request bodies, so tokens are not exposed.
  app.use(morgan('dev'));
  app.use(express.json());

  // Lightweight health check for local checks and future orchestration.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'link-service' });
  });

  app.use('/api/platforms', platformRoutes);
  app.use('/api/links', linkRoutes);

  // 404 for anything unmatched.
  app.use((req, res) => {
    res.status(404).json({
      error: { message: 'Route not found', code: 'NOT_FOUND' },
    });
  });

  // Centralized error handler. Keep responses consistent and never leak stack
  // traces or raw DB errors to the client.
  // eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
  app.use((err, req, res, next) => {
    console.error('[link-service] Unhandled error:', err);

    // MongoDB duplicate-key safety net (e.g. a race creating two links docs
    // for the same userId).
    if (err && err.code === 11000) {
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
