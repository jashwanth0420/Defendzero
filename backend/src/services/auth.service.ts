import bcrypt from 'bcrypt';
import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, generateRefreshToken, TokenPayload } from '../utils/jwt.util';
import { config } from '../config/env.config';

const googleClient = config.GOOGLE_CLIENT_ID ? new OAuth2Client(config.GOOGLE_CLIENT_ID) : null;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Register with Email/Password
   */
  public async register(data: any): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password, firstName, lastName, role } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role && Object.values(Role).includes(role) ? role : Role.USER;

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: assignedRole,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isVerified: true },
    });

    const tokens = this.generateAuthTokens({ userId: user.id, role: user.role });
    return { user, tokens };
  }

  /**
   * Login with Email/Password
   */
  public async login(data: any): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password } = data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    const tokens = this.generateAuthTokens({ userId: user.id, role: user.role });
    
    // Omit sensitive data
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Google OAuth Verify and Create/Login
   */
  public async googleLogin(idToken: string): Promise<{ user: any; tokens: AuthTokens }> {
    if (!config.GOOGLE_CLIENT_ID || !googleClient) {
      throw new Error('Google login is not configured on this server.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error('Google token did not contain email.');
    }

    const { email, sub: googleId, given_name: firstName, family_name: lastName } = payload;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new Google User
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          role: Role.USER, // Default Role
          isVerified: true, // Auto-verified from Google
        },
      });
    } else if (!user.googleId) {
      // Link Google ID if same email exists
      user = await prisma.user.update({
        where: { email },
        data: { googleId, isVerified: true },
      });
    }

    const tokens = this.generateAuthTokens({ userId: user.id, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Upgrade User Role (BONUS)
   */
  public async upgradeRole(userId: string, targetRole: Role): Promise<any> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: targetRole },
      select: { id: true, email: true, role: true },
    });
    return updatedUser;
  }

  private generateAuthTokens(payload: TokenPayload): AuthTokens {
    return {
      accessToken: generateToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
