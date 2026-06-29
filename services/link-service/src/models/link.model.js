import { mongoose } from '../db/index.js';

const { Schema, model } = mongoose;

/**
 * A single link entry. Non-custom links reference a platform by slug and carry
 * a server-resolved URL; custom links have a free-form url + label.
 */
const linkEntrySchema = new Schema(
  {
    platformSlug: { type: String, default: null }, // references platforms.slug; null for custom
    handle: { type: String, default: null }, // the username the user entered
    url: { type: String, required: true }, // resolved full URL (or raw URL for custom)
    label: { type: String, default: null }, // custom links use this for their display name
    isCustom: { type: Boolean, default: false },
    order: { type: Number, default: 0 }, // display order on the public page
    isVisible: { type: Boolean, default: true }, // hide without deleting
  },
  { _id: false }
);

/**
 * One document per user holding all their links. Keeps the public-profile read
 * as a single query (best for the read-heavy hot path).
 */
const linkSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // one links document per user
      index: true,
    },
    links: { type: [linkEntrySchema], default: [] },
  },
  { timestamps: true }
);

export const Link = model('Link', linkSchema);
