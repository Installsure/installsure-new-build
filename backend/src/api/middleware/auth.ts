import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';
import { createError } from './errorHandler.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        companyId?: number;
      };
    }
  }
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  companyId?: number;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.AUTH_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || '24h',
    issuer: 'installsure',
    audience: 'installsure-users',
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.AUTH_SECRET, {
      issuer: 'installsure',
      audience: 'installsure-users',
    }) as JWTPayload;
  } catch (error) {
    throw createError('Invalid or expired token', 401);
  }
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn(
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
      },
      'Authentication failed: No token provided',
    );
    next(createError('Access token required', 401));
    return;
  }

  try {
    const decoded = verifyToken(token);

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };

    // Add user context to logger
    req.logger = logger.child({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    logger.warn(
      {
        error: (error as Error).message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
      },
      'Authentication failed: Invalid token',
    );
    next(error);
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(createError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(
        {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          url: req.url,
        },
        'Authorization failed: Insufficient permissions',
      );
      next(createError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };
    req.logger = logger.child({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  next();
};



