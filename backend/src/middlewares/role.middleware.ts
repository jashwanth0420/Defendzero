import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { Role } from '@prisma/client';

export const requireRole = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
       res.status(401).json({ success: false, error: 'Unauthorized' });
       return;
    }

    if (!roles.includes(req.user.role)) {
       res.status(403).json({ 
         success: false, 
         error: `Forbidden. Action requires one of: ${roles.join(', ')}` 
       });
       return;
    }
    
    next();
  };
};

export const requireDoctor = requireRole([Role.DOCTOR]);
export const requirePharmacy = requireRole([Role.PHARMACY]);
export const requireGuardian = requireRole([Role.GUARDIAN]);
export const requireUser = requireRole([Role.USER]);
