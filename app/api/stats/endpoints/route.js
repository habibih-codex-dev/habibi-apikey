import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const usage = await db.allUsage();
  const map = {};
  for (const u of usage) map[u.endpoint] = (map[u.endpoint] || 0) + 1;
  const top = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([endpoint, count]) => ({ endpoint, count }));
  return json({ ok: true, endpoints: top });
}
