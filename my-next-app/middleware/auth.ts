import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.BIZCHAT_JWT_SECRET || 'demo-jwt-secret';

export function requireAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.toString().replace(/^Bearer\s+/, '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing JWT token' });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Attach decoded token to request for downstream handlers
      (req as any).user = decoded;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid JWT token' });
    }
  };
}
