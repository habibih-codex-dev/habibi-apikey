import { runPublic } from '@/lib/server/apikey';
import { json, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  return runPublic(req, async (record) => json({ ok: true, pong: true, key: record.label, ts: Date.now() }));
}
