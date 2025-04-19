import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// Simple in-memory rate limiter for demonstration (replace with Redis for production)
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 10;
const ipRequestCounts: Record<string, { count: number; windowStart: number }> = {};

export function rateLimit(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (!ipRequestCounts[ip] || now - ipRequestCounts[ip].windowStart > rateLimitWindowMs) {
      ipRequestCounts[ip] = { count: 1, windowStart: now };
    } else {
      ipRequestCounts[ip].count++;
    }
    if (ipRequestCounts[ip].count > maxRequestsPerWindow) {
      res.setHeader('Retry-After', Math.ceil((rateLimitWindowMs - (now - ipRequestCounts[ip].windowStart)) / 1000));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    return handler(req, res);
  };
}
