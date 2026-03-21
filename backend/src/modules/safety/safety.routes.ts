import { Router } from 'express';
import { SafetyController } from './safety.controller';

const router = Router();
const safetyController = new SafetyController();

// Note: authenticateJWT and requireUser are already applied at parent level in v1/index.ts
// Centralized rule engine evaluation bound
router.post('/check', safetyController.checkInteraction);

export default router;
