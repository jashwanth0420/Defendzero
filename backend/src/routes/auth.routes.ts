import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Basic Email/Password Auth
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth
router.post('/google', authController.googleLogin);

// Role Upgrade / Bonus
router.patch('/upgrade-role', authenticateJWT, authController.upgradeRole);

export default router;
