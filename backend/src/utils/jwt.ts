import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface TokenPayload {
  id: string;
  role: UserRole;
  email: string;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
