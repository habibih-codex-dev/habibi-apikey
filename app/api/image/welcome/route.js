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
 * Welcome card — uses a public API (no canvas/native module needed).
 * Falls back gracefully.
 */
export async function GET(req) {
  return runPublic(req, async () => {
    const url = new URL(req.url);
    const name = url.searchParams.get('name') || 'Member';
    const group = url.searchParams.get('group') || 'Group';
    const avatar = url.searchParams.get('avatar') || '';
    const members = url.searchParams.get('members') || '';
    const bg = url.searchParams.get('bg') || '';

    // Use a public welcome-card generator API
    const providerUrl = `https://api.ownbestbot.my.id/api/maker/welcome?name=${encodeURIComponent(name)}&group=${encodeURIComponent(group)}&avatar=${encodeURIComponent(avatar)}&members=${encodeURIComponent(members)}&bg=${encodeURIComponent(bg)}`;

    try {
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
    } catch (e) {
      return json({ ok: false, error: 'Welcome card provider failed: ' + e.message }, { status: 502 });
    }
  });
}
