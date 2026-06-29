import { Router } from 'express';
import * as controller from '../controllers/platform.controller.js';

const router = Router();

// Public — the wizard's Step 2 catalog. No auth.
router.get('/', controller.listPlatforms);

export default router;
