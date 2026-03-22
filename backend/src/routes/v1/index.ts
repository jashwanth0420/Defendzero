import { Router } from 'express';
import safetyRoutes from '../../modules/safety/safety.routes';
import adherenceRoutes from '../../modules/adherence/adherence.routes';
import guardianRoutes from '../../modules/guardian/guardian.routes';
import doctorCommRoutes from '../../modules/doctor-comm/doctor-comm.routes';
import pharmacyRoutes from '../../modules/pharmacy/pharmacy.routes';
import authRoutes from '../auth.routes';
import protectedRoutes from '../protected.routes';
import medicinesRoutes from '../../modules/medicines/medicines.routes';
import doctorRoutes from '../../modules/doctor/doctor.routes';
import medicationRoutes from '../../modules/medication/medication.routes';

import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireDoctor, requirePharmacy, requireGuardian, requireUser } from '../../middlewares/role.middleware';

const router = Router();

// ========== PUBLIC ROUTES ==========
// Authentication (No Auth Required)
router.use('/auth', authRoutes);

// ========== PROTECTED ROUTES (Require JWT) ==========
// User Profile and General Protected Routes
router.use('/', protectedRoutes);

// ========== USER (PATIENT) FEATURES ==========
router.use('/user/safety', authenticateJWT, requireUser, safetyRoutes);
router.use('/user/adherence', authenticateJWT, requireUser, adherenceRoutes);
router.use('/user/messages', authenticateJWT, requireUser, doctorCommRoutes);
router.use('/user/medicines', authenticateJWT, requireUser, medicinesRoutes);
router.use('/user/medication', authenticateJWT, requireUser, medicationRoutes);

// ========== GUARDIAN FEATURES ==========
router.use('/guardian', authenticateJWT, requireGuardian, guardianRoutes);

// ========== PHARMACY FEATURES ==========
router.use('/pharmacy', authenticateJWT, requirePharmacy, pharmacyRoutes);

// ========== DOCTOR (PHYSICIAN) FEATURES ==========
router.use('/doctor', authenticateJWT, requireDoctor, doctorRoutes);

export default router;
