import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    ok: true,
    connected: false,
    message: 'QuickBooks integration placeholder',
  });
});

export default router;
