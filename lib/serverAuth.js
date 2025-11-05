import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export function getTokenFromCookies() {
  return cookies().get('auth_token')?.value || null;
}

export function verifyJWT(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return jwt.verify(token, secret);
}

export function requireAuth({ role } = {}) {
  const token = getTokenFromCookies();
  if (!token) throw new Error('UNAUTHENTICATED');
  const payload = verifyJWT(token);
  if (role && payload.role !== role) throw new Error('FORBIDDEN');
  return payload; // { sub, username, role, iat, exp }
}
