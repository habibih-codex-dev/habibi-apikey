import { verifyLogin, signToken } from '@/lib/server/auth';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch {}
  const { username, password } = body;
  if (!username || !password) return error('username & password required', 400);
  try {
    const admin = await verifyLogin(username, password);
    if (!admin) return error('Invalid credentials', 401);
    return json({ ok: true, token: signToken(admin), admin: { id: admin.id, username: admin.username } });
  } catch (e) {
    return error(e.message, 500);
  }
}
