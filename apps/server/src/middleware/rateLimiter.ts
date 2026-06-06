import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { fail } from '../lib/response';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

/**
 * Redis-backed rate limiter.
 * Defaults: 100 requests per 15 minutes.
 * Auth endpoints: 10 requests per minute.
 */
export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.user?.userId || req.ip || 'anonymous';
    const key = `${keyPrefix}:${identifier}`;

    try {
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }

      const ttl = await redis.pttl(key);

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
      res.setHeader('X-RateLimit-Reset', Date.now() + Math.max(0, ttl));

      if (current > maxRequests) {
        fail(res, 429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.');
        return;
      }

      next();
    } catch {
      // If Redis is down, allow the request through
      next();
    }
  };
};

// Pre-configured rate limiters
export const generalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'rl:general',
});

export const authLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'rl:auth',
});

export const aiLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyPrefix: 'rl:ai',
});
