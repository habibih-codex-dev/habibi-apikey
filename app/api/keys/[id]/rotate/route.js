import crypto from 'crypto';
import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function POST(req, { params }) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const keys = await db.listKeys();
  const k = keys.find((x) => x.id === params.id);
  if (!k) return error('Key not found', 404);
  k.key = 'hbi_' + crypto.randomBytes(24).toString('hex');
  await db.saveKeys(keys);
  return json({ ok: true, key: k });
}
