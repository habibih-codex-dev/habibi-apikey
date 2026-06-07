import { runPublic } from '@/lib/server/apikey';
import { preflight, withCorsImage, json } from '@/lib/server/cors';
import { hasCanvas, generateCard } from '@/lib/server/canvas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  return runPublic(req, async () => {
    if (!hasCanvas()) return json({ ok: false, error: '@napi-rs/canvas not available' }, { status: 501 });
    const p = new URL(req.url).searchParams;
    const png = await generateCard('goodbye', {
      avatar: p.get('avatar'), name: p.get('name'), group: p.get('group'),
      members: p.get('members'), bg: p.get('bg'), title: p.get('title'),
    });
    return withCorsImage(png);
  });
}
