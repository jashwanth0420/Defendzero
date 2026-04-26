import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config/env.config';

export interface TokenPayload {
  userId: string;
  role: Role;
}

const JWT_SECRET = config.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';
const JWT_REFRESH_EXPIRES_IN = '7d';

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
