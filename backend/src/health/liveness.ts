import { Request, Response } from 'express';

export const livenessHandler = (req: Request, res: Response) => {
  // Liveness check - always returns OK if the process is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};
