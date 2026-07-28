import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error({ method: req.method, url: req.originalUrl, status: res.statusCode, duration }, message);
    } else if (res.statusCode >= 400) {
      logger.warn({ method: req.method, url: req.originalUrl, status: res.statusCode, duration }, message);
    } else {
      logger.info({ method: req.method, url: req.originalUrl, status: res.statusCode, duration }, message);
    }
  });

  next();
};
