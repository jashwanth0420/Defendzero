import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const authService = new AuthService();

export class AuthController {
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body);
      res.status(201).json({ success: true, data: user, tokens });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { user, tokens } = await authService.login(req.body);
      res.status(200).json({ success: true, data: user, tokens });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  public async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) throw new Error('Google ID Token required.');

      const { user, tokens } = await authService.googleLogin(idToken);
      res.status(200).json({ success: true, data: user, tokens });
    } catch (error: any) {
      res.status(401).json({ success: false, error: 'Google Auth failed or invalidated.' });
    }
  }

  // Bonus: Role Upgrade
  public async upgradeRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Typically verify logic/subscription before allowing upgrade
      const { targetRole } = req.body; 
      
      // We restrict endpoint using auth middlewares later, but just doublecheck payload
      if (!req.user) throw new Error('Unauthorized');
      if (!Object.values(Role).includes(targetRole)) throw new Error('Invalid Role Specified');

      const updatedUser = await authService.upgradeRole(req.user.id, targetRole as Role);
      res.status(200).json({ success: true, data: updatedUser, message: `Successfully upgraded to ${targetRole}` });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
