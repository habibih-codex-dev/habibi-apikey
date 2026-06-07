'use client';

// Same-origin by default: the API is served from this same Next.js app (/api/*).
// Override NEXT_PUBLIC_API_URL only if you host the API separately.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const TOKEN_KEY = 'habibi_token';

export const auth = {
  get token() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token) { localStorage.setItem(TOKEN_KEY, token); },
  clear() { localStorage.removeItem(TOKEN_KEY); },
  get isAuthed() { return !!this.token; },
};

async function request(path, { method = 'GET', body, authed = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authed && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try { data = await res.json(); } catch {}

  if (res.status === 401 && typeof window !== 'undefined') {
    auth.clear();
    if (!path.includes('/auth/login')) window.location.href = '/login';
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: { username, password }, authed: false }),
  me: () => request('/api/auth/me'),
  changePassword: (current, next) =>
    request('/api/auth/change-password', { method: 'POST', body: { current, next } }),

  // keys
  listKeys: () => request('/api/keys'),
  createKey: (body) => request('/api/keys', { method: 'POST', body }),
  updateKey: (id, body) => request(`/api/keys/${id}`, { method: 'PATCH', body }),
  rotateKey: (id) => request(`/api/keys/${id}/rotate`, { method: 'POST' }),
  deleteKey: (id) => request(`/api/keys/${id}`, { method: 'DELETE' }),

  // users
  listUsers: (q = '') => request(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  createUser: (body) => request('/api/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: 'PATCH', body }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),

  // stats
  summary: () => request('/api/stats/summary'),
  timeseries: (days = 14) => request(`/api/stats/timeseries?days=${days}`),
  endpoints: () => request('/api/stats/endpoints'),
  recent: (limit = 50) => request(`/api/stats/recent?limit=${limit}`),
};
