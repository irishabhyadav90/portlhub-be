import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// username: alphanumeric + hyphens, 3-30 chars
const USERNAME_PATTERN = /^[a-zA-Z0-9-]+$/;

const registerRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('Username may only contain letters, numbers, and hyphens'),
];

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const usernameParamRules = [
  param('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(USERNAME_PATTERN)
    .withMessage('Username may only contain letters, numbers, and hyphens'),
];

const updateMeRules = [
  body('firstName').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('lastName').optional({ nullable: true }).isString().isLength({ max: 100 }),
  body('bio').optional({ nullable: true }).isString().isLength({ max: 2000 }),
  body('professionalTitle')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 150 }),
  body('yearsOfExperience')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('yearsOfExperience must be an integer between 0 and 100'),
  body('phone').optional({ nullable: true }).isString().isLength({ max: 30 }),
  body('location').optional({ nullable: true }).isString().isLength({ max: 150 }),
  body('profilePhotoUrl')
    .optional({ nullable: true })
    .isURL()
    .withMessage('profilePhotoUrl must be a valid URL'),
];

// Auth
router.post('/register', validate(registerRules), controller.register);
router.post('/login', validate(loginRules), controller.login);

// Authenticated "me" routes — declared before the dynamic :username route so
// that "me" is never interpreted as a username.
router.get('/me', requireAuth, controller.getMe);
router.patch('/me', requireAuth, validate(updateMeRules), controller.updateMe);

// Public
router.get(
  '/check-username/:username',
  validate(usernameParamRules),
  controller.checkUsername
);
router.get('/:username', validate(usernameParamRules), controller.getPublicProfile);

export default router;
