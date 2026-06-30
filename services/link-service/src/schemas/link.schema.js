import { z } from 'zod';

// Shared fields present on every link entry, custom or not.
const baseEntry = {
  order: z.number().int().min(0).optional(),
  isVisible: z.boolean().optional(),
};

// A non-custom link references an active platform by slug; the full url is
// resolved server-side from the platform's urlTemplate, so it's not accepted
// from the client here.
const platformEntry = z.object({
  isCustom: z.literal(false),
  platformSlug: z.string().trim().toLowerCase().min(1, 'platformSlug is required'),
  handle: z.string().trim().min(1, 'handle is required'),
  ...baseEntry,
});

// A custom link carries a raw url + display label instead of a platform.
const customEntry = z.object({
  isCustom: z.literal(true),
  url: z.url('url must be a valid URL'),
  label: z.string().max(100).nullish(),
  ...baseEntry,
});

// `isCustom` is optional on the wire (defaults to false). Fill it in before the
// discriminated union runs so callers can omit it for normal platform links.
const linkEntry = z.preprocess(
  (val) =>
    val && typeof val === 'object' && val.isCustom === undefined
      ? { ...val, isCustom: false }
      : val,
  z.discriminatedUnion('isCustom', [platformEntry, customEntry])
);

const linksArray = z.array(linkEntry);

export const userIdParamSchema = z.object({
  userId: z.uuid('userId must be a valid UUID'),
});

export const createLinksSchema = z.object({
  userId: z.uuid('userId must be a valid UUID'),
  links: linksArray,
});

export const updateLinksSchema = z.object({
  links: linksArray,
});
