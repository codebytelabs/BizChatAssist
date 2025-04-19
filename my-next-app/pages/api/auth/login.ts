import type { NextApiRequest, NextApiResponse } from 'next';
import { signJwt } from '../../../utils/jwt';

// Dummy login endpoint for demonstration. Replace with real user DB lookup.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { email, password } = req.body;
  // TODO: Replace with real user lookup and password check
  if (email === 'demo@bizchat.com' && password === 'password') {
    const token = signJwt({ email, tenant: 'demo-tenant', role: 'owner' });
    return res.status(200).json({ token });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}
