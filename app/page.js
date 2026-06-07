'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Endpoints you can try from the playground.
const ENDPOINTS = [
  { id: 'ping', label: 'Ping (cek API key)', path: '/api/ping', param: null, type: 'json' },
  { id: 'wiki', label: 'Search Wikipedia', path: '/api/search/wikipedia', param: 'q', ph: 'WhatsApp', type: 'json' },
  { id: 'ai', label: 'AI Chat', path: '/api/ai/chat', param: 'q', ph: 'halo apa kabar', type: 'json' },
  { id: 'google', label: 'Search Google', path: '/api/search/google', param: 'q', ph: 'nodejs', type: 'json' },
  { id: 'tiktok', label: 'Download TikTok', path: '/api/download/tiktok', param: 'url', ph: 'https://vt.tiktok.com/...', type: 'json' },
  { id: 'ytmp3', label: 'YouTube MP3', path: '/api/download/ytmp3', param: 'url', ph: 'https://youtu.be/...', type: 'json' },
  { id: 'iqc', label: 'iPhone Chat (gambar)', path: '/api/image/iphonechat', param: 'text', ph: 'halo', type: 'image' },
  { id: 'welcome', label: 'Welcome Card (gambar)', path: '/api/image/welcome', param: 'name', ph: 'Budi', type: 'image' },
];

export default function Home() {
  const [status, setStatus] = useState('checking');
  const [apiKey, setApiKey] = useState('');
  const [epId, setEpId] = useState('ping');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, status, text, imgUrl }

  const ep = ENDPOINTS.find((e) => e.id === epId);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => setStatus(r.ok ? 'online' : 'down'))
      .catch(() => setStatus('down'));
  }, []);

  async function runTest(e) {
    e.preventDefault();
    if (!apiKey) { setResult({ ok: false, status: 0, text: 'Isi API key dulu (hbi_...). Generate di dashboard ▸ API Keys.' }); return; }
    setLoading(true);
    setResult(null);
    try {
      const origin = window.location.origin;
      const url = new URL(origin + ep.path);
      if (ep.param) url.searchParams.set(ep.param, value || ep.ph || 'test');
      const res = await fetch(url.toString(), { headers: { 'x-api-key': apiKey } });
      const ct = res.headers.get('content-type') || '';
      if (ct.startsWith('image/')) {
        const blob = await res.blob();
        setResult({ ok: res.ok, status: res.status, imgUrl: URL.createObjectURL(blob) });
      } else {
        const data = await res.json().catch(() => ({}));
        setResult({ ok: res.ok, status: res.status, text: JSON.stringify(data, null, 2) });
      }
    } catch (err) {
      setResult({ ok: false, status: 0, text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing">
      <header className="land-top">
        <div className="brand">
          <div className="logo">H</div>
          <div><b>Habibi Official</b><small>REST API</small></div>
        </div>
        <Link href="/login" className="btn">Admin Login</Link>
      </header>

      <section className="hero">
        <span className={`status-dot ${status}`}>
          {status === 'online' ? '● API Online' : status === 'down' ? '● API Down' : '● Mengecek...'}
        </span>
        <h1>Habibi Official <span className="gradient-text">API</span></h1>
        <p>Downloader, AI, Search, & Image generator dalam satu API. Coba langsung di bawah 👇</p>
      </section>

      <section className="card playground">
        <h3>🧪 API Playground — cek fitur jalan / nggak</h3>
        <form onSubmit={runTest}>
          <div className="field">
            <label>API Key</label>
            <input className="input" placeholder="hbi_xxxxxxxx" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>Fitur / Endpoint</label>
              <select className="input" value={epId} onChange={(e) => { setEpId(e.target.value); setValue(''); setResult(null); }}>
                {ENDPOINTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
            {ep.param && (
              <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                <label>{ep.param}</label>
                <input className="input" placeholder={ep.ph} value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
            )}
            <button className="btn primary" disabled={loading}>{loading ? 'Menguji…' : 'Test'}</button>
          </div>
        </form>

        <p className="endpoint-line"><span className="mono">{ep.path}{ep.param ? `?${ep.param}=…` : ''}</span></p>

        {result && (
          <div className="result">
            <span className={`pill ${result.ok ? 'on' : 'off'}`}>
              {result.ok ? `✅ JALAN (${result.status})` : `❌ GAGAL (${result.status || 'error'})`}
            </span>
            {result.imgUrl
              ? <img src={result.imgUrl} alt="result" className="result-img" />
              : <pre className="result-pre">{result.text}</pre>}
          </div>
        )}
      </section>

      <section className="card">
        <h3>📚 Endpoint tersedia</h3>
        <div className="ep-grid">
          {ENDPOINTS.map((e) => (
            <div key={e.id} className="ep-item">
              <b>{e.label}</b>
              <span className="mono">{e.path}</span>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 14 }}>
          Semua endpoint butuh header <span className="mono">x-api-key</span>. Buat & kelola key di{' '}
          <Link href="/login" className="gradient-text">Admin Dashboard</Link>.
        </p>
      </section>

      <footer className="land-foot">© 2026 Habibi Official</footer>
    </div>
  );
}
