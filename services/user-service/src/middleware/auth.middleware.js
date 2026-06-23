import { verifyToken } from '../utils/jwt.js';

/**
 * Verifies a JWT from the `Authorization: Bearer <token>` header.
 * On success, attaches `req.user = { id }` and calls next().
 * On missing/invalid token, responds with 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: {
        message: 'Missing or malformed Authorization header',
        code: 'UNAUTHORIZED',
      },
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
    });
  }
}
