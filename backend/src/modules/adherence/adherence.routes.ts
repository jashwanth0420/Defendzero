import { Router } from 'express';
import { AdherenceController } from './adherence.controller';

const router = Router();
const adherenceController = new AdherenceController();

// Protected Adherence Endpoints
// Note: authenticateJWT is already applied at parent level in v1/index.ts
router.post('/schedules', adherenceController.create);
router.get('/schedules', adherenceController.getAll);
router.post('/schedules/:scheduleId/logs', adherenceController.log);

export default router;
