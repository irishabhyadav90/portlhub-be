import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Copy .env.example to .env first.');
}

/**
 * Verifies a JWT from the `Authorization: Bearer <token>` header. The token is
 * issued by user-service and signed with the shared JWT_SECRET; its `sub` claim
 * is the userId. On success, attaches `req.user = { id }` and calls next().
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
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({
      error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' },
    });
  }
}

/**
 * Guards a `:userId` route param so a user can only modify their own links.
 * Must run after requireAuth.
 */
export function requireSelf(req, res, next) {
  if (req.user?.id !== req.params.userId) {
    return res.status(403).json({
      error: {
        message: 'You can only modify your own links',
        code: 'FORBIDDEN',
      },
    });
  }
  return next();
}
