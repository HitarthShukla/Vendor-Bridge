import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/db';
import { fail } from '../lib/response';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

/**
 * Verify JWT access token from Authorization header.
 * Attaches user info to req.user for downstream handlers.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      fail(res, 401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      fail(res, 401, 'UNAUTHORIZED', 'Token not provided');
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, is_active: true, deleted_at: true },
    });

    if (!user || !user.is_active || user.deleted_at) {
      fail(res, 401, 'UNAUTHORIZED', 'User account is inactive or deleted');
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      fail(res, 401, 'TOKEN_EXPIRED', 'Access token has expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      fail(res, 401, 'INVALID_TOKEN', 'Invalid access token');
      return;
    }
    fail(res, 500, 'AUTH_ERROR', 'Authentication failed');
  }
};
