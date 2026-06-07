import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function PATCH(req, { params }) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const users = await db.listUsers();
  const u = users.find((x) => x.id === params.id);
  if (!u) return error('User not found', 404);
  let body = {};
  try { body = await req.json(); } catch {}
  const { name, email, plan } = body;
  if (name !== undefined) u.name = name;
  if (email !== undefined) u.email = email;
  if (plan !== undefined) u.plan = plan;
  await db.saveUsers(users);
  return json({ ok: true, user: u });
}

export async function DELETE(req, { params }) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const users = await db.listUsers();
  const idx = users.findIndex((x) => x.id === params.id);
  if (idx === -1) return error('User not found', 404);
  users.splice(idx, 1);
  await db.saveUsers(users);
  return json({ ok: true });
}
