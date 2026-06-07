import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 7));
  const usage = await db.allUsage();

  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const u of usage) {
    const day = new Date(u.ts).toISOString().slice(0, 10);
    if (day in buckets) buckets[day]++;
  }
  return json({ ok: true, series: Object.entries(buckets).map(([date, count]) => ({ date, count })) });
}
