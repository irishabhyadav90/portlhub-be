import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;

/**
 * The full profile of the authenticated owner (everything except passwordHash).
 */
function toPrivateUser(row) {
  const { passwordHash, ...rest } = row;
  return rest;
}

/**
 * Public-facing profile — safe to expose on the public profile page and to
 * other services. Deliberately omits email, phone, and passwordHash.
 */
function toPublicUser(row) {
  return {
    id: row.id,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    bio: row.bio,
    professionalTitle: row.professionalTitle,
    yearsOfExperience: row.yearsOfExperience,
    location: row.location,
    profilePhotoUrl: row.profilePhotoUrl,
    createdAt: row.createdAt,
  };
}

/**
 * POST /api/users/register
 */
export async function register(req, res, next) {
  try {
    const { email, password, username } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check uniqueness up front so we can return clear, field-specific 409s.
    const [emailTaken, usernameTaken] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
        columns: { id: true },
      }),
      db.query.users.findFirst({
        where: eq(users.username, normalizedUsername),
        columns: { id: true },
      }),
    ]);

    if (emailTaken) {
      return res.status(409).json({
        error: { message: 'Email is already registered', code: 'EMAIL_TAKEN' },
      });
    }
    if (usernameTaken) {
      return res.status(409).json({
        error: { message: 'Username is already taken', code: 'USERNAME_TAKEN' },
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [created] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
      })
      .returning();

    const token = signToken(created.id);
    return res.status(201).json({ user: toPrivateUser(created), token });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/users/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    // Use a single generic message for both "no such user" and "bad password"
    // so we don't reveal which emails are registered.
    const invalid = () =>
      res.status(401).json({
        error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
      });

    if (!user) {
      return invalid();
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return invalid();
    }

    const token = signToken(user.id);
    return res.json({ user: toPrivateUser(user), token });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/check-username/:username  (public)
 */
export async function checkUsername(req, res, next) {
  try {
    const username = req.params.username.toLowerCase().trim();

    const existing = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: { id: true },
    });

    return res.json({ username, available: !existing });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/:username  (public)
 */
export async function getPublicProfile(req, res, next) {
  try {
    const username = req.params.username.toLowerCase().trim();

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
    }

    return res.json({ user: toPublicUser(user) });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/me  (auth required)
 */
export async function getMe(req, res, next) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.id),
    });

    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
    }

    return res.json({ user: toPrivateUser(user) });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/users/me  (auth required)
 *
 * TODO: username and email changes are intentionally out of scope for Phase 0.
 * They need extra handling (re-checking uniqueness, possibly email
 * re-verification) and will get dedicated endpoints later.
 */
const UPDATABLE_FIELDS = [
  'firstName',
  'lastName',
  'bio',
  'professionalTitle',
  'yearsOfExperience',
  'phone',
  'location',
  'profilePhotoUrl',
];

export async function updateMe(req, res, next) {
  try {
    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: {
          message: 'No updatable fields provided',
          code: 'NO_UPDATES',
        },
      });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, req.user.id))
      .returning();

    if (!updated) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'USER_NOT_FOUND' },
      });
    }

    return res.json({ user: toPrivateUser(updated) });
  } catch (err) {
    return next(err);
  }
}
