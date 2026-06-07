/**
 * Admin auth: JWT sign/verify + bcrypt login + a guard for route handlers.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '12h' });
}

export async function verifyLogin(username, password) {
  const admins = await db.bootstrapAdmin(); // ensures default admin exists
  const admin = admins.find((a) => a.username === username);
  if (!admin) return null;
  return bcrypt.compareSync(password, admin.passwordHash) ? admin : null;
}

/**
 * Verify the Authorization: Bearer <jwt> header.
 * Returns the decoded payload, or null if missing/invalid.
 */
export function getAdmin(req) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export { JWT_SECRET };
