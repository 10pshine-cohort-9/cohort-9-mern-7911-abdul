import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Logging error using centralized pino logger
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
      },
      method: req.method,
      url: req.originalUrl,
      statusCode,
    },
    `Error handled: ${err.message || 'Internal Server Error'}`
  );

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
