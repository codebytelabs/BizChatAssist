import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.BIZCHAT_JWT_SECRET || 'demo-jwt-secret';

export function signJwt(payload: any, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
