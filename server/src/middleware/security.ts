import { Request, Response, NextFunction } from 'express';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

/**
 * Enterprise IP-based Rate Limiter Middleware
 * Protects against brute force attacks and denial-of-service on sensitive API routes.
 */
export const rateLimiter = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip rate limiting in automated testing environments
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    record.count++;

    if (record.count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: options.message || 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds,
      });
      return;
    }

    next();
  };
};

/**
 * Standard Security Headers Middleware (Helmet alternative)
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};
