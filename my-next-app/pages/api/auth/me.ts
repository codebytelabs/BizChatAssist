import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../middleware/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // User info from JWT
  const user = (req as any).user;
  return res.status(200).json({ user });
}

export default requireAuth(handler);
