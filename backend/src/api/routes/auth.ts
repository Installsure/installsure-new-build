import { Router, Request, Response } from 'express';
import { authService } from '../../services/authService.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// POST /api/auth/register - Register new user
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body, req.requestId);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn,
    });
  }),
);

// POST /api/auth/login - User login
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body, req.requestId);

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn,
    });
  }),
);

// POST /api/auth/refresh - Refresh JWT token
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const result = await authService.refreshToken(token, req.requestId);

    res.json({
      message: 'Token refreshed successfully',
      user: result.user,
      token: result.token,
      expiresIn: result.expiresIn,
    });
  }),
);

// GET /api/auth/verify - Verify JWT token
router.get(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      message: 'Token is valid',
      user: req.user,
    });
  }),
);

// POST /api/auth/change-password - Change user password
router.post(
  '/change-password',
  authenticateToken,
  validateBody(changePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
      req.requestId,
    );

    res.json({
      message: 'Password changed successfully',
    });
  }),
);

// POST /api/auth/logout - User logout (client-side token removal)
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    // In a stateless JWT system, logout is handled client-side
    // In production, you might want to implement a token blacklist
    res.json({
      message: 'Logout successful',
    });
  }),
);

export default router;



