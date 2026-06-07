/**
 * Serverless data store backed by Upstash Redis (works on Vercel & Cloudflare).
 *
 * Env vars (auto-injected when you add Upstash/KV storage in Vercel):
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *   (or KV_REST_API_URL / KV_REST_API_TOKEN)
 *
 * Collections (admins, apikeys, apiusers) are stored as JSON arrays.
 * Usage logs use a capped Redis list; daily per-key counters use INCR+EXPIRE.
 */
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

/**
 * Find the Upstash/KV REST credentials in env, tolerant of any prefix that
 * Vercel's integration may add (e.g. STORAGE_KV_REST_API_URL).
 */
function findCreds() {
  const env = process.env;
  // 1) common exact names first
  let url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  let token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };

  // 2) scan for any (prefixed) REST url/token. Avoid read-only token & redis:// urls.
  for (const [k, v] of Object.entries(env)) {
    if (!v) continue;
    if (!url && /(?:UPSTASH_REDIS_REST_URL|KV_REST_API_URL)$/.test(k)) url = v;
    if (!token && /(?:UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN)$/.test(k) && !/READ_ONLY/.test(k)) {
      token = v;
    }
  }
  return { url, token };
}

let _redis = null;
function redis() {
  if (_redis) return _redis;
  const { url, token } = findCreds();
  if (!url || !token) {
    throw new Error(
      'Database not configured. Add Upstash Redis (Vercel ▸ Storage) and Redeploy so the REST URL & TOKEN env vars are available.',
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const K = {
  admins: 'habibi:admins',
  apikeys: 'habibi:apikeys',
  apiusers: 'habibi:apiusers',
  usageLogs: 'habibi:usage:logs',
};

async function getArr(key) {
  const v = await redis().get(key);
  return Array.isArray(v) ? v : [];
}
async function setArr(key, arr) {
  await redis().set(key, arr);
}

// ---- Admins ----
async function listAdmins() { return getArr(K.admins); }
async function saveAdmins(arr) { return setArr(K.admins, arr); }

/** Ensure a default admin exists (idempotent). */
async function bootstrapAdmin() {
  const admins = await listAdmins();
  if (admins.length) return admins;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'habibi123';
  const admin = {
    id: nanoid(10),
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: Date.now(),
  };
  await saveAdmins([admin]);
  return [admin];
}

// ---- API keys ----
async function listKeys() { return getArr(K.apikeys); }
async function saveKeys(arr) { return setArr(K.apikeys, arr); }

// ---- API users ----
async function listUsers() { return getArr(K.apiusers); }
async function saveUsers(arr) { return setArr(K.apiusers, arr); }

// ---- Usage ----
function dayStr(ts = Date.now()) {
  return new Date(ts).toISOString().slice(0, 10);
}
async function logUsage(entry) {
  const r = redis();
  await r.lpush(K.usageLogs, JSON.stringify(entry));
  await r.ltrim(K.usageLogs, 0, 4999); // keep last 5000
  // daily per-key counter
  const counterKey = `habibi:usage:${entry.apiKeyId}:${dayStr(entry.ts)}`;
  const n = await r.incr(counterKey);
  if (n === 1) await r.expire(counterKey, 60 * 60 * 26); // ~1 day
}
async function getKeyUsageToday(apiKeyId) {
  const v = await redis().get(`habibi:usage:${apiKeyId}:${dayStr()}`);
  return Number(v) || 0;
}
async function recentUsage(limit = 50) {
  const raw = await redis().lrange(K.usageLogs, 0, limit - 1);
  return raw.map((x) => (typeof x === 'string' ? safeParse(x) : x)).filter(Boolean);
}
async function allUsage(max = 5000) {
  const raw = await redis().lrange(K.usageLogs, 0, max - 1);
  return raw.map((x) => (typeof x === 'string' ? safeParse(x) : x)).filter(Boolean);
}
function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

export const db = {
  redis,
  bootstrapAdmin,
  listAdmins, saveAdmins,
  listKeys, saveKeys,
  listUsers, saveUsers,
  logUsage, getKeyUsageToday, recentUsage, allUsage,
  dayStr,
};
