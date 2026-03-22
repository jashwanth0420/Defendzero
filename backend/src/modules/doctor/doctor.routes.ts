import { Router } from 'express';
import { DoctorController } from './doctor.controller';
import { PharmacyController } from '../pharmacy/pharmacy.controller';

const router = Router();
const doctorController = new DoctorController();
const pharmacyController = new PharmacyController();

// Note: authenticateJWT and requireDoctor are already applied at parent level in v1/index.ts
router.post('/patients', doctorController.addPatient);
router.post('/prescriptions', doctorController.createPrescription);
router.get('/patients', doctorController.getMyPatients);
router.put('/patients/:patientId', doctorController.updatePatient);
router.delete('/patients/:patientId', doctorController.deletePatient);

// Pharmacy Token Generation (Doctor creates purchase limits for patients)
router.post('/pharmacy-tokens/generate', pharmacyController.generateToken);

export default router;
