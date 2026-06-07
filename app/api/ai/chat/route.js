import axios from 'axios';
import { runPublic } from '@/lib/server/apikey';
import { json, error, preflight } from '@/lib/server/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS() { return preflight(); }

export async function GET(req) {
  return runPublic(req, async () => {
    const url = new URL(req.url);
    const q = url.searchParams.get('q');
    if (!q) return error('q required', 400);
    if (!process.env.OPENAI_API_KEY) {
      return json({ ok: false, error: 'AI not configured', hint: 'Set OPENAI_API_KEY env var.' }, { status: 501 });
    }
    const { data } = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      { model: 'gpt-4o-mini', messages: [{ role: 'user', content: q }], temperature: 0.7 },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 60_000 },
    );
    return json({ ok: true, result: data.choices?.[0]?.message?.content?.trim() });
  });
}
