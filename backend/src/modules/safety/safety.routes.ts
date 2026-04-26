import { Router } from 'express';
import { SafetyController } from './safety.controller';

const router = Router();
const safetyController = new SafetyController();

// Note: authenticateJWT and requireUser are already applied at parent level in v1/index.ts
// Centralized rule engine evaluation bound
router.post('/check', safetyController.checkInteraction);
router.post('/verify', safetyController.verifyMedicineIntelligence.bind(safetyController));
router.post('/webhook', safetyController.checkN8nSafety.bind(safetyController));

export default router;
