/**
 * API key validation + usage logging + per-key daily quota (Redis-backed).
 * Used by public route handlers.
 */
import { db } from './db';
import { error } from './cors';

const DAILY_QUOTA = Number(process.env.APIKEY_DAILY_QUOTA || 1000);

function readKey(req) {
  const url = new URL(req.url);
  return req.headers.get('x-api-key') || url.searchParams.get('apikey');
}

/**
 * Returns { ok:true, record } when authorized,
 * or { ok:false, status, error } otherwise.
 */
export async function authorizeApiKey(req) {
  const key = readKey(req);
  if (!key) return { ok: false, status: 401, error: 'API key required (x-api-key header or ?apikey=)' };

  const keys = await db.listKeys();
  const record = keys.find((k) => k.key === key);
  if (!record || !record.active) return { ok: false, status: 403, error: 'Invalid or disabled API key' };

  const quota = record.quota ?? DAILY_QUOTA;
  if (quota > 0) {
    const used = await db.getKeyUsageToday(record.id);
    if (used >= quota) return { ok: false, status: 429, error: 'Daily quota exceeded for this API key', quota };
  }
  return { ok: true, record };
}

/** Fire-and-forget usage logging (call after responding). */
export async function recordUsage(record, req, status, startedAt) {
  try {
    const url = new URL(req.url);
    await db.logUsage({
      ts: Date.now(),
      apiKeyId: record.id,
      label: record.label,
      endpoint: url.pathname,
      method: req.method,
      status,
      ms: Date.now() - startedAt,
    });
  } catch {
    // never let logging break the response
  }
}

export { DAILY_QUOTA };

/**
 * Wrapper for public route handlers: authorize the API key, run the handler,
 * then log usage. `fn(record)` must return a Response (NextResponse).
 */
export async function runPublic(req, fn) {
  const startedAt = Date.now();
  const auth = await authorizeApiKey(req);
  if (!auth.ok) return error(auth.error, auth.status);
  let res;
  try {
    res = await fn(auth.record);
  } catch (e) {
    res = error(e.message || 'Upstream error', 502);
  }
  // fire-and-forget logging
  recordUsage(auth.record, req, res.status, startedAt);
  return res;
}
