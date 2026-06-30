import { Router } from 'express';
import * as controller from '../controllers/link.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireSelf } from '../middleware/auth.middleware.js';
import {
  createLinksSchema,
  updateLinksSchema,
  userIdParamSchema,
} from '../schemas/link.schema.js';

const router = Router();

// Auth required — create/replace the caller's own links document.
router.post(
  '/',
  requireAuth,
  validate({ body: createLinksSchema }),
  controller.createLinks
);

// Public — the gateway's hot read path for the public profile page.
router.get(
  '/user/:userId',
  validate({ params: userIdParamSchema }),
  controller.getUserLinks
);

// Auth required + self only — dashboard edits.
router.patch(
  '/user/:userId',
  requireAuth,
  validate({ params: userIdParamSchema, body: updateLinksSchema }),
  requireSelf,
  controller.updateUserLinks
);

router.delete(
  '/user/:userId',
  requireAuth,
  validate({ params: userIdParamSchema }),
  requireSelf,
  controller.deleteUserLinks
);

export default router;
