import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Internal Server Error');
  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;

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

  if (res.headersSent) {
    return next(error);
  }

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    stack: isProduction ? undefined : error.stack,
  });
};
