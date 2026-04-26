import { Router } from 'express';
import { GuardianController } from './guardian.controller';

const router = Router();
const guardianController = new GuardianController();

// Note: authenticateJWT and requireGuardian are already applied at parent level in v1/index.ts
// Guardian manages their assigned patients
router.post('/add-patient', guardianController.add);
router.get('/patients', guardianController.getPatients);
router.get('/patients/:patientId/details', guardianController.getPatientDetails.bind(guardianController));

export default router;
