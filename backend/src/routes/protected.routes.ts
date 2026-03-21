import { Router, Response } from 'express';
import { authenticateJWT, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { requireDoctor, requirePharmacy, requireGuardian, requireUser } from '../middlewares/role.middleware';
import { GuardianController } from '../modules/guardian/guardian.controller';

const router = Router();
const guardianController = new GuardianController();

// Profile visible to ANY Authenticated user
router.get('/profile', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.user, message: 'Welcome to your Profile' });
});

// DOCTOR ONLY
router.get('/doctor/dashboard', authenticateJWT, requireDoctor, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, message: 'Welcome to your Doctor Dashboard' });
});

// PHARMACY ONLY
router.get('/pharmacy/orders', authenticateJWT, requirePharmacy, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, orders: [], message: 'Pharmacy Pending Compliance Orders Dashboard' });
});

// USER (PATIENT) - Get their guardians
router.get('/user/guardians', authenticateJWT, requireUser, guardianController.getMyGuardians);

export default router;
