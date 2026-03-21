import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.util';
import { prisma } from '../config/prisma';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization token missing or invalid format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token) as TokenPayload;
    
    // Check if user still exists
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    
    if (!user) {
      res.status(401).json({ success: false, error: 'User does not exist anymore.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: 'Invalid or expired token.' });
    return;
  }
};
