import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/link.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireSelf } from '../middleware/auth.middleware.js';

const router = Router();

// Each entry in a `links` array. Custom links need a url; non-custom links need
// a platformSlug + handle (the full url is resolved server-side, so it's not
// required from the client). Deeper cross-field rules live in the controller.
const linkEntryRules = (prefix) => [
  body(`${prefix}.*.isCustom`).optional().isBoolean(),
  body(`${prefix}.*.platformSlug`)
    .optional({ nullable: true })
    .isString()
    .trim(),
  body(`${prefix}.*.handle`).optional({ nullable: true }).isString().trim(),
  body(`${prefix}.*.url`)
    .optional({ nullable: true })
    .isURL()
    .withMessage('url must be a valid URL'),
  body(`${prefix}.*.label`)
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 100 }),
  body(`${prefix}.*.order`).optional().isInt({ min: 0 }),
  body(`${prefix}.*.isVisible`).optional().isBoolean(),
];

const userIdParamRules = [
  param('userId').isUUID().withMessage('userId must be a valid UUID'),
];

const createLinksRules = [
  body('userId').isUUID().withMessage('userId must be a valid UUID'),
  body('links').isArray().withMessage('links must be an array'),
  ...linkEntryRules('links'),
];

const updateLinksRules = [
  ...userIdParamRules,
  body('links').isArray().withMessage('links must be an array'),
  ...linkEntryRules('links'),
];

// Auth required — create/replace the caller's own links document.
router.post('/', requireAuth, validate(createLinksRules), controller.createLinks);

// Public — the gateway's hot read path for the public profile page.
router.get(
  '/user/:userId',
  validate(userIdParamRules),
  controller.getUserLinks
);

// Auth required + self only — dashboard edits.
router.patch(
  '/user/:userId',
  requireAuth,
  validate(updateLinksRules),
  requireSelf,
  controller.updateUserLinks
);

router.delete(
  '/user/:userId',
  requireAuth,
  validate(userIdParamRules),
  requireSelf,
  controller.deleteUserLinks
);

export default router;
