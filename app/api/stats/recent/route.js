import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const url = new URL(req.url);
  const limit = Math.min(200, Number(url.searchParams.get('limit')) || 50);
  const logs = await db.recentUsage(limit); // already newest-first
  return json({ ok: true, logs });
}
