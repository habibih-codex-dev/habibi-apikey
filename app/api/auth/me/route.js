import { getAdmin } from '@/lib/server/auth';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  const admin = getAdmin(req);
  if (!admin) return error('Missing or invalid token', 401);
  return json({ ok: true, admin });
}
