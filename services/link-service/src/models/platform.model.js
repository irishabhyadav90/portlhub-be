import { mongoose } from '../db/index.js';

const { Schema, model } = mongoose;

/**
 * The platform catalog (reference data). Identical for every user and seeded
 * via the seed script, so new platforms can be added without a code deploy.
 */
const platformSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true, // stable identifier used by links + frontend
      trim: true,
      lowercase: true,
    },
    name: { type: String, required: true, trim: true }, // display name
    iconUrl: { type: String, default: null },
    urlTemplate: { type: String, required: true }, // e.g. https://github.com/{username}
    placeholder: { type: String, default: null }, // input hint in the wizard
    category: {
      type: String,
      enum: ['code', 'social', 'design', 'writing', 'other'],
      default: 'other',
    },
    isActive: { type: Boolean, default: true }, // soft-disable without deleting
    sortOrder: { type: Number, default: 0 }, // default display order
  },
  { timestamps: true }
);

// Catalog is filtered by isActive on the public read path.
platformSchema.index({ isActive: 1 });

export const Platform = model('Platform', platformSchema);
