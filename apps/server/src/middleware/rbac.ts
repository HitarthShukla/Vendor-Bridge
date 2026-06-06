import { Request, Response, NextFunction } from 'express';
import { fail } from '../lib/response';

/**
 * Role-Based Access Control middleware.
 * Usage: authorize('ADMIN', 'PROCUREMENT_OFFICER')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      fail(res, 401, 'UNAUTHORIZED', 'Authentication required');
      return;
    }

    // ADMIN has access to all protected routes
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      fail(res, 403, 'FORBIDDEN', 'Insufficient permissions for this action');
      return;
    }

    next();
  };
};
