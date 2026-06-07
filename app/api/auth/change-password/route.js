import bcrypt from 'bcryptjs';
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
  const { current, next } = body;

  const admins = await db.listAdmins();
  const admin = admins.find((a) => a.id === session.sub);
  if (!admin || !bcrypt.compareSync(current || '', admin.passwordHash)) {
    return error('Current password is wrong', 401);
  }
  if (!next || next.length < 6) return error('New password too short', 400);

  admin.passwordHash = bcrypt.hashSync(next, 10);
  await db.saveAdmins(admins);
  return json({ ok: true });
}
