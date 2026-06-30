import { Router } from 'express';
import * as controller from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  usernameParamSchema,
  updateMeSchema,
} from '../schemas/user.schema.js';

const router = Router();

// Auth
router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);

// Authenticated "me" routes — declared before the dynamic :username route so
// that "me" is never interpreted as a username.
router.get('/me', requireAuth, controller.getMe);
router.patch('/me', requireAuth, validate({ body: updateMeSchema }), controller.updateMe);

// Public
router.get(
  '/check-username/:username',
  validate({ params: usernameParamSchema }),
  controller.checkUsername
);
router.get(
  '/:username',
  validate({ params: usernameParamSchema }),
  controller.getPublicProfile
);

export default router;
