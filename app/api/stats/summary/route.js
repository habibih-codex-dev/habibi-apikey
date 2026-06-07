import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const usage = await db.allUsage();
  const keys = await db.listKeys();
  const users = await db.listUsers();

  const now = Date.now();
  const dayAgo = now - 86_400_000;
  const total = usage.length;
  const last24h = usage.filter((u) => u.ts >= dayAgo).length;
  const errors = usage.filter((u) => u.status >= 400).length;
  const avgMs = total ? Math.round(usage.reduce((a, u) => a + (u.ms || 0), 0) / total) : 0;

  return json({
    ok: true,
    summary: {
      totalRequests: total,
      requests24h: last24h,
      errorRate: total ? +((errors / total) * 100).toFixed(2) : 0,
      avgLatencyMs: avgMs,
      activeKeys: keys.filter((k) => k.active).length,
      totalKeys: keys.length,
      totalUsers: users.length,
    },
  });
}
