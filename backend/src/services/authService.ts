import argon2 from 'argon2';
import { db } from '../data/db.js';
import { logger } from '../infra/logger.js';
import { generateToken } from '../api/middleware/auth.js';
import { createError } from '../api/middleware/errorHandler.js';
import { z } from 'zod';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  companyId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: string;
  companyId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: string;
}

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'user']).optional(),
  companyId: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthService {
  async register(data: CreateUserData, requestId?: string): Promise<AuthResult> {
    const childLogger = logger.child({ requestId, service: 'auth' });

    try {
      // Validate input
      const validatedData = createUserSchema.parse(data);
      childLogger.debug({ email: validatedData.email }, 'Starting user registration');

      // Check if user already exists
      const existingUser = await db.query<User>(
        'SELECT id FROM auth_users WHERE email = $1',
        [validatedData.email],
        requestId,
      );

      if (existingUser.rows.length > 0) {
        childLogger.warn(
          { email: validatedData.email },
          'Registration failed: User already exists',
        );
        throw createError('User with this email already exists', 409);
      }

      // Hash password
      const hashedPassword = await argon2.hash(validatedData.password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1,
      });

      // Create user
      const result = await db.query<User>(
        `INSERT INTO auth_users (email, password_hash, name, role, company_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, role, company_id as "companyId", 
                   created_at as "createdAt", updated_at as "updatedAt"`,
        [
          validatedData.email,
          hashedPassword,
          validatedData.name,
          validatedData.role || 'user',
          validatedData.companyId || null,
        ],
        requestId,
      );

      const user = result.rows[0];

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });

      childLogger.info(
        {
          userId: user.id,
          email: user.email,
        },
        'User registered successfully',
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        expiresIn: '24h',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError(
          'Validation error: ' + error.errors.map((e) => e.message).join(', '),
          400,
        );
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Registration failed');
      throw createError('Registration failed', 500);
    }
  }

  async login(credentials: LoginCredentials, requestId?: string): Promise<AuthResult> {
    const childLogger = logger.child({ requestId, service: 'auth' });

    try {
      // Validate input
      const validatedCredentials = loginSchema.parse(credentials);
      childLogger.debug({ email: validatedCredentials.email }, 'Starting user login');

      // Find user
      const result = await db.query<User & { password_hash: string }>(
        `SELECT id, email, name, role, company_id as "companyId", password_hash,
                created_at as "createdAt", updated_at as "updatedAt"
         FROM auth_users 
         WHERE email = $1 AND active = true`,
        [validatedCredentials.email],
        requestId,
      );

      if (result.rows.length === 0) {
        childLogger.warn({ email: validatedCredentials.email }, 'Login failed: User not found');
        throw createError('Invalid email or password', 401);
      }

      const user = result.rows[0];

      // Verify password
      try {
        await argon2.verify(user.password_hash, validatedCredentials.password);
      } catch (error) {
        childLogger.warn(
          {
            userId: user.id,
            email: validatedCredentials.email,
          },
          'Login failed: Invalid password',
        );
        throw createError('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
      });

      childLogger.info(
        {
          userId: user.id,
          email: user.email,
        },
        'User logged in successfully',
      );

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
        expiresIn: '24h',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError(
          'Validation error: ' + error.errors.map((e) => e.message).join(', '),
          400,
        );
      }
      if (
        error instanceof Error &&
        (error.message.includes('Invalid') || error.message.includes('not found'))
      ) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Login failed');
      throw createError('Login failed', 500);
    }
  }

  async verifyToken(token: string, requestId?: string): Promise<Omit<User, 'password'>> {
    const childLogger = logger.child({ requestId, service: 'auth' });

    try {
      // Verify JWT token
      const { verifyToken } = await import('../api/middleware/auth.js');
      const decoded = verifyToken(token);

      // Get fresh user data
      const result = await db.query<User>(
        `SELECT id, email, name, role, company_id as "companyId",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM auth_users 
         WHERE id = $1 AND active = true`,
        [decoded.userId],
        requestId,
      );

      if (result.rows.length === 0) {
        childLogger.warn({ userId: decoded.userId }, 'Token verification failed: User not found');
        throw createError('User not found', 401);
      }

      return result.rows[0];
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Token verification failed');
      throw error;
    }
  }

  async refreshToken(token: string, requestId?: string): Promise<AuthResult> {
    const user = await this.verifyToken(token, requestId);

    const newToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return {
      user,
      token: newToken,
      expiresIn: '24h',
    };
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    requestId?: string,
  ): Promise<void> {
    const childLogger = logger.child({ requestId, service: 'auth', userId });

    try {
      // Get current password hash
      const result = await db.query<{ password_hash: string }>(
        'SELECT password_hash FROM auth_users WHERE id = $1',
        [userId],
        requestId,
      );

      if (result.rows.length === 0) {
        throw createError('User not found', 404);
      }

      // Verify current password
      await argon2.verify(result.rows[0].password_hash, currentPassword);

      // Hash new password
      const hashedNewPassword = await argon2.hash(newPassword, {
        type: argon2.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });

      // Update password
      await db.query(
        'UPDATE auth_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedNewPassword, userId],
        requestId,
      );

      childLogger.info('Password changed successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      childLogger.error({ error: (error as Error).message }, 'Password change failed');
      throw createError('Password change failed', 500);
    }
  }
}

export const authService = new AuthService();



