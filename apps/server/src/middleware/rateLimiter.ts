import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { fail } from '../lib/response';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

/**
 * Redis-backed sliding window rate limiter.
 * Uses INCR + PEXPIRE pattern for atomic counting.
 * Adds standard rate limit headers to every response.
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
        const retryAfter = Math.ceil(Math.max(0, ttl) / 1000);
        res.setHeader('Retry-After', retryAfter);
        fail(res, 429, 'RATE_LIMIT_EXCEEDED', `Too many requests. Please try again in ${retryAfter} seconds.`);
        return;
      }

      next();
    } catch {
      // If Redis is down, allow the request through (fail-open)
      next();
    }
  };
};

// ─── Pre-configured Rate Limiters ────────────────────────────────────────────

// General API: generous limit — 500 req per 15 min per user
export const generalLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 500,
  keyPrefix: 'rl:general',
});

// Auth endpoints: stricter — 30 req per minute per IP (login, register, refresh)
export const authLimiter = rateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: 'rl:auth',
});

// AI assistant: prevent abuse — 20 req per hour per user
export const aiLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: 'rl:ai',
});
