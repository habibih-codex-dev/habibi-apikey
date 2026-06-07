import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

function genKey() { return 'hbi_' + crypto.randomBytes(24).toString('hex'); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const keys = await db.listKeys();
  const usage = await db.allUsage();
  const since = new Date().setHours(0, 0, 0, 0);
  const list = keys.map((k) => ({
    ...k,
    usedToday: usage.filter((u) => u.apiKeyId === k.id && u.ts >= since).length,
    usedTotal: usage.filter((u) => u.apiKeyId === k.id).length,
  }));
  return json({ ok: true, keys: list });
}

export async function POST(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  let body = {};
  try { body = await req.json(); } catch {}
  const { label, owner, quota } = body;
  const record = {
    id: nanoid(10),
    key: genKey(),
    label: label || 'unnamed',
    owner: owner || '',
    active: true,
    quota: Number.isFinite(+quota) && quota !== undefined && quota !== '' ? +quota : undefined,
    createdAt: Date.now(),
  };
  const keys = await db.listKeys();
  keys.push(record);
  await db.saveKeys(keys);
  return json({ ok: true, key: record }, { status: 201 });
}
