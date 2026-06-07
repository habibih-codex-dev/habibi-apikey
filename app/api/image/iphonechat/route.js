import { runPublic } from '@/lib/server/apikey';
import { error, preflight, withCorsImage, json } from '@/lib/server/cors';
import { hasCanvas, generateIphoneChat } from '@/lib/server/canvas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  return runPublic(req, async () => {
    if (!hasCanvas()) return json({ ok: false, error: '@napi-rs/canvas not available' }, { status: 501 });
    const p = new URL(req.url).searchParams;
    if (!p.get('text')) return error('text required', 400);
    const png = await generateIphoneChat({
      text: p.get('text'),
      name: p.get('name'),
      time: p.get('time'),
      avatar: p.get('avatar'),
      carrier: p.get('carrier'),
      battery: p.get('battery'),
      reactions: p.get('reactions'),
      showPicker: p.get('picker'),
    });
    return withCorsImage(png);
  });
}
