import { Request, Response, NextFunction } from 'express';
import { fail } from '../lib/response';

/**
 * Global error handler.
 * Catches all unhandled errors and returns consistent error responses.
 * Must be registered LAST in the middleware chain.
 */
export const errorHandler = (
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(`❌ [${new Date().toISOString()}] ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'An unexpected error occurred'
      : err.message;

  fail(res, status, code, message);
};

/**
 * 404 handler for unmatched routes.
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  fail(res, 404, 'NOT_FOUND', 'The requested resource was not found');
};
