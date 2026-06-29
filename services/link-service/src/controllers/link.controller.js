import { Link } from '../models/link.model.js';
import { Platform } from '../models/platform.model.js';
import { resolveUrl } from '../utils/resolveUrl.js';

/**
 * Turn the client-supplied link entries into stored entries:
 *  - custom links keep their raw url + label
 *  - non-custom links must reference an active platform; the full url is
 *    resolved server-side from the platform's urlTemplate (never trust the
 *    client to build it)
 *
 * Throws a tagged error (err.status / err.code) on bad input so the controller
 * can translate it into a clean response.
 */
async function buildLinks(inputLinks) {
  // Look up every referenced slug in one query.
  const slugs = [
    ...new Set(
      inputLinks
        .filter((l) => !l.isCustom && l.platformSlug)
        .map((l) => l.platformSlug)
    ),
  ];

  const platforms = await Platform.find({
    slug: { $in: slugs },
    isActive: true,
  }).lean();
  const bySlug = new Map(platforms.map((p) => [p.slug, p]));

  return inputLinks.map((entry, index) => {
    const order = entry.order ?? index;
    const isVisible = entry.isVisible ?? true;

    if (entry.isCustom) {
      if (!entry.url) {
        const err = new Error('Custom links require a url');
        err.status = 400;
        err.code = 'INVALID_LINK';
        throw err;
      }
      return {
        platformSlug: null,
        handle: null,
        url: entry.url,
        label: entry.label ?? null,
        isCustom: true,
        order,
        isVisible,
      };
    }

    const platform = bySlug.get(entry.platformSlug);
    if (!platform) {
      const err = new Error(
        `Unknown or inactive platform: ${entry.platformSlug}`
      );
      err.status = 400;
      err.code = 'UNKNOWN_PLATFORM';
      throw err;
    }

    return {
      platformSlug: platform.slug,
      handle: entry.handle,
      url: resolveUrl(platform.urlTemplate, entry.handle),
      label: null,
      isCustom: false,
      order,
      isVisible,
    };
  });
}

/**
 * POST /api/links  (auth required)
 *
 * Create or replace the links document for the authenticated user. The token's
 * user must match the body's userId — a user can only write their own links.
 */
export async function createLinks(req, res, next) {
  try {
    const { userId, links } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({
        error: {
          message: 'You can only modify your own links',
          code: 'FORBIDDEN',
        },
      });
    }

    const resolved = await buildLinks(links);

    const doc = await Link.findOneAndUpdate(
      { userId },
      { userId, links: resolved },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(201).json({ data: doc });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: { message: err.message, code: err.code },
      });
    }
    return next(err);
  }
}

/**
 * GET /api/links/user/:userId  (public)
 *
 * Returns a user's visible links, ordered — what the gateway calls when
 * composing the public profile page.
 */
export async function getUserLinks(req, res, next) {
  try {
    const { userId } = req.params;

    const doc = await Link.findOne({ userId }).lean();
    if (!doc) {
      return res.status(404).json({
        error: { message: 'No links found for this user', code: 'NOT_FOUND' },
      });
    }

    const links = doc.links
      .filter((l) => l.isVisible)
      .sort((a, b) => a.order - b.order);

    return res.json({ data: { userId: doc.userId, links } });
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/links/user/:userId  (auth required, self only)
 *
 * Whole-array replace of a user's links — add, remove, reorder, edit, or toggle
 * visibility. Simpler than per-entry patching and matches how the dashboard
 * submits the full set.
 */
export async function updateUserLinks(req, res, next) {
  try {
    const { userId } = req.params;
    const { links } = req.body;

    const resolved = await buildLinks(links);

    const doc = await Link.findOneAndUpdate(
      { userId },
      { links: resolved },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(404).json({
        error: { message: 'No links found for this user', code: 'NOT_FOUND' },
      });
    }

    return res.json({ data: doc });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: { message: err.message, code: err.code },
      });
    }
    return next(err);
  }
}

/**
 * DELETE /api/links/user/:userId  (auth required, self only)
 *
 * Removes a user's links document entirely.
 */
export async function deleteUserLinks(req, res, next) {
  try {
    const { userId } = req.params;

    const result = await Link.deleteOne({ userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: { message: 'No links found for this user', code: 'NOT_FOUND' },
      });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
