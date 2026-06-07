import { runPublic } from '@/lib/server/apikey';
import { error, preflight, json } from '@/lib/server/cors';
import { NextResponse } from 'next/server';
import axios from 'axios';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

/**
 * iQC — iPhone Chat Style.
 * Uses a free public API (no canvas needed, works on Vercel out of the box).
 * Falls back to a second provider if the first fails.
 */
const PROVIDERS = [
  // Provider 1: iqc-1.vercel.app (public, free)
  (p) => `https://iqc-1.vercel.app/api/generate?text=${enc(p.text)}&name=${enc(p.name || 'Contact')}&time=${enc(p.time || '')}&avatar=${enc(p.avatar || '')}`,
  // Provider 2: alternative
  (p) => `https://api.ownbestbot.my.id/api/maker/iqc?text=${enc(p.text)}&name=${enc(p.name || 'Contact')}`,
];

function enc(s) { return encodeURIComponent(s || ''); }

export async function GET(req) {
  return runPublic(req, async () => {
    const url = new URL(req.url);
    const text = url.searchParams.get('text');
    if (!text) return error('text required', 400);

    const params = {
      text,
      name: url.searchParams.get('name') || 'Contact',
      time: url.searchParams.get('time') || '',
      avatar: url.searchParams.get('avatar') || '',
    };

    for (const buildUrl of PROVIDERS) {
      try {
        const providerUrl = buildUrl(params);
        const res = await axios.get(providerUrl, {
          responseType: 'arraybuffer',
          timeout: 20_000,
          headers: { 'User-Agent': 'Habibi-API/1.0' },
        });
        const ct = res.headers['content-type'] || 'image/png';
        return new NextResponse(Buffer.from(res.data), {
          status: 200,
          headers: { ...CORS, 'Content-Type': ct, 'Cache-Control': 'no-store' },
        });
      } catch {
        continue; // try next provider
      }
    }
    return json({ ok: false, error: 'All iQC providers failed. Try again later.' }, { status: 502 });
  });
}
