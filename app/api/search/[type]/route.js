import axios from 'axios';
import { runPublic } from '@/lib/server/apikey';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

const SEARCH = {
  google: 'UPSTREAM_GOOGLE_URL',
  image: 'UPSTREAM_IMAGE_URL',
  pinterest: 'UPSTREAM_PINTEREST_URL',
};

export async function GET(req, { params }) {
  return runPublic(req, async () => {
    const type = params.type;
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    if (!q) return error('q required', 400);

    // Wikipedia works without any upstream config.
    if (type === 'wikipedia') {
      const title = encodeURIComponent(q);
      const { data } = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`,
        { headers: { 'User-Agent': 'Habibi-API/1.0' }, timeout: 15_000 },
      );
      return json({ ok: true, result: { title: data.title, summary: data.extract, url: data.content_urls?.desktop?.page } });
    }

    const envVar = SEARCH[type];
    if (!envVar) return error(`Unknown search type "${type}"`, 404);
    const upstream = process.env[envVar];
    if (!upstream) {
      return json({ ok: false, error: `${type} search not configured`, hint: `Set ${envVar} env var.` }, { status: 501 });
    }
    const { data } = await axios.get(upstream, { params: { q }, timeout: 30_000 });
    return json({ ok: true, result: data.result || data });
  });
}
