import { nanoid } from 'nanoid';
import { getAdmin } from '@/lib/server/auth';
import { db } from '@/lib/server/db';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  let list = await db.listUsers();
  if (q) {
    const s = q.toLowerCase();
    list = list.filter((u) => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  }
  return json({ ok: true, users: list });
}

export async function POST(req) {
  if (!getAdmin(req)) return error('Missing or invalid token', 401);
  let body = {};
  try { body = await req.json(); } catch {}
  const { name, email, plan } = body;
  if (!name) return error('name required', 400);
  const user = { id: nanoid(10), name, email: email || '', plan: plan || 'free', createdAt: Date.now() };
  const users = await db.listUsers();
  users.push(user);
  await db.saveUsers(users);
  return json({ ok: true, user }, { status: 201 });
}
