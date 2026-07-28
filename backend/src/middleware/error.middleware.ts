import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Normalize caught error into a genuine Error instance
  const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Internal Server Error');

  // Preserve res.statusCode only if it is a client/server error status (>= 400); otherwise assign 500
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

  // Logging error using centralized pino logger, using redacted req.path
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
      },
      method: req.method,
      url: req.path,
      statusCode,
    },
    `Error handled: ${error.message}`
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = isProduction
    ? (statusCode >= 500 ? 'Internal Server Error' : error.message)
    : error.message;

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    stack: isProduction ? undefined : error.stack,
  });
};
