import { Router } from 'express';
import { DoctorCommController } from './doctor-comm.controller';

const router = Router();
const doctorCommController = new DoctorCommController();

// Note: authenticateJWT is already applied at parent level in v1/index.ts
router.post('/messages', doctorCommController.send);
router.get('/messages', doctorCommController.getAll);

export default router;
