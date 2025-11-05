import jwt from 'jsonwebtoken';

export function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Please define JWT_SECRET in your environment variables');
  }
  return secret;
}

export function signToken(payload, options = {}) {
  const secret = getJWTSecret();
  const opts = { expiresIn: '7d', ...options };
  return jwt.sign(payload, secret, opts);
}

export function verifyToken(token) {
  const secret = getJWTSecret();
  return jwt.verify(token, secret);
}
