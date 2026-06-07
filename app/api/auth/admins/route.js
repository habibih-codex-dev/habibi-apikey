import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function POST(req) {
  const session = getAdmin(req);
  if (!session) return error('Missing or invalid token', 401);

  let body = {};
  try { body = await req.json(); } catch {}
  const { username, password } = body;
  if (!username || !password) return error('username & password required', 400);

  const admins = await db.listAdmins();
  if (admins.some((a) => a.username === username)) return error('Username already exists', 409);

  const admin = { id: nanoid(10), username, passwordHash: bcrypt.hashSync(password, 10), createdAt: Date.now() };
  admins.push(admin);
  await db.saveAdmins(admins);
  return json({ ok: true, admin: { id: admin.id, username } });
}
