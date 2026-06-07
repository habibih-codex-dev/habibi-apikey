import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function PATCH(req, { params }) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const keys = await db.listKeys();
  const k = keys.find((x) => x.id === params.id);
  if (!k) return error('Key not found', 404);

  let body = {};
  try { body = await req.json(); } catch {}
  const { active, label, quota } = body;
  if (typeof active === 'boolean') k.active = active;
  if (label !== undefined) k.label = label;
  if (quota !== undefined) k.quota = +quota;
  await db.saveKeys(keys);
  return json({ ok: true, key: k });
}

export async function DELETE(req, { params }) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const keys = await db.listKeys();
  const idx = keys.findIndex((x) => x.id === params.id);
  if (idx === -1) return error('Key not found', 404);
  keys.splice(idx, 1);
  await db.saveKeys(keys);
  return json({ ok: true });
}
