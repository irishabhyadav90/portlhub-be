import 'dotenv/config';
import { connectDb, disconnectDb } from '../db/index.js';
import { Platform } from '../models/platform.model.js';

/**
 * The master platform catalog. Edit this list and re-run `npm run seed` to add
 * or update platforms without a code deploy. Seeding is idempotent: it upserts
 * by slug, so existing user links keep working.
 */
const PLATFORMS = [
  {
    slug: 'github',
    name: 'GitHub',
    iconUrl: 'https://cdn.simpleicons.org/github',
    urlTemplate: 'https://github.com/{username}',
    placeholder: 'your-github-username',
    category: 'code',
    sortOrder: 1,
  },
  {
    slug: 'linkedin',
    name: 'LinkedIn',
    iconUrl: 'https://cdn.simpleicons.org/linkedin',
    urlTemplate: 'https://www.linkedin.com/in/{username}',
    placeholder: 'your-linkedin-handle',
    category: 'social',
    sortOrder: 2,
  },
  {
    slug: 'leetcode',
    name: 'LeetCode',
    iconUrl: 'https://cdn.simpleicons.org/leetcode',
    urlTemplate: 'https://leetcode.com/{username}',
    placeholder: 'your-leetcode-username',
    category: 'code',
    sortOrder: 3,
  },
  {
    slug: 'hackerrank',
    name: 'HackerRank',
    iconUrl: 'https://cdn.simpleicons.org/hackerrank',
    urlTemplate: 'https://www.hackerrank.com/profile/{username}',
    placeholder: 'your-hackerrank-username',
    category: 'code',
    sortOrder: 4,
  },
  {
    slug: 'topcoder',
    name: 'TopCoder',
    iconUrl: 'https://cdn.simpleicons.org/topcoder',
    urlTemplate: 'https://profiles.topcoder.com/{username}',
    placeholder: 'your-topcoder-handle',
    category: 'code',
    sortOrder: 5,
  },
  {
    slug: 'medium',
    name: 'Medium',
    iconUrl: 'https://cdn.simpleicons.org/medium',
    urlTemplate: 'https://medium.com/@{username}',
    placeholder: 'your-medium-handle',
    category: 'writing',
    sortOrder: 6,
  },
  {
    slug: 'behance',
    name: 'Behance',
    iconUrl: 'https://cdn.simpleicons.org/behance',
    urlTemplate: 'https://www.behance.net/{username}',
    placeholder: 'your-behance-username',
    category: 'design',
    sortOrder: 7,
  },
  {
    slug: 'figma',
    name: 'Figma',
    iconUrl: 'https://cdn.simpleicons.org/figma',
    urlTemplate: 'https://www.figma.com/@{username}',
    placeholder: 'your-figma-username',
    category: 'design',
    sortOrder: 8,
  },
];

async function seed() {
  await connectDb();
  console.log('[link-service] seeding platforms...');

  const ops = PLATFORMS.map((platform) => ({
    updateOne: {
      filter: { slug: platform.slug },
      update: { $set: platform },
      upsert: true,
    },
  }));

  const result = await Platform.bulkWrite(ops);
  const upserted = result.upsertedCount ?? 0;
  const modified = result.modifiedCount ?? 0;
  console.log(
    `[link-service] seed complete — ${upserted} inserted, ${modified} updated, ${PLATFORMS.length} total in catalog`
  );

  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('[link-service] seed failed:', err);
  await disconnectDb();
  process.exit(1);
});
