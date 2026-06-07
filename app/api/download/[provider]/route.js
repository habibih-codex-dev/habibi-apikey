import axios from 'axios';
import { runPublic } from '@/lib/server/apikey';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

// provider -> upstream env var
const PROVIDERS = {
  tiktok: 'UPSTREAM_TIKTOK_URL',
  ytmp3: 'UPSTREAM_YTMP3_URL',
  ytmp4: 'UPSTREAM_YTMP4_URL',
  instagram: 'UPSTREAM_IG_URL',
  facebook: 'UPSTREAM_FB_URL',
  twitter: 'UPSTREAM_TWITTER_URL',
  capcut: 'UPSTREAM_CAPCUT_URL',
  threads: 'UPSTREAM_THREADS_URL',
  snackvideo: 'UPSTREAM_SNACK_URL',
  spotify: 'UPSTREAM_SPOTIFY_URL',
  mediafire: 'UPSTREAM_MEDIAFIRE_URL',
  gdrive: 'UPSTREAM_GDRIVE_URL',
};

export async function GET(req, { params }) {
  return runPublic(req, async () => {
    const provider = params.provider;
    const envVar = PROVIDERS[provider];
    if (!envVar) return error(`Unknown provider "${provider}"`, 404);

    const url = new URL(req.url);
    const target = url.searchParams.get('url');
    if (!target) return error('url required', 400);

    const upstream = process.env[envVar];
    if (!upstream) {
      return json(
        { ok: false, error: `${provider} provider not configured`, hint: `Set ${envVar} env var.` },
        { status: 501 },
      );
    }
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { data } = await axios.get(upstream, { params: queryParams, timeout: 60_000 });
    return json({ ok: true, result: data.result || data });
  });
}
