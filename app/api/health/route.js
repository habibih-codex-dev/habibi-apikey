import { json, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

// Public, no API key required — used by the landing page status indicator.
export function GET() {
  return json({ ok: true, service: 'Habibi Official API', ts: Date.now() });
}
