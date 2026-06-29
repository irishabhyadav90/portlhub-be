import { Platform } from '../models/platform.model.js';

/**
 * GET /api/platforms  (public)
 *
 * Returns all active platforms for the onboarding wizard's Step 2 grid,
 * ordered by sortOrder then name.
 */
export async function listPlatforms(req, res, next) {
  try {
    const platforms = await Platform.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select('slug name iconUrl urlTemplate placeholder category')
      .lean();

    return res.json({ data: platforms });
  } catch (err) {
    return next(err);
  }
}
