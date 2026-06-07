'use client';
import { useEffect, useState } from 'react';
import { api, API_URL } from '../../../lib/api';

export default function SettingsPage() {
  const [me, setMe] = useState(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [base, setBase] = useState('');

  useEffect(() => {
    api.me().then((d) => setMe(d.admin)).catch((e) => setErr(e.message));
    // API is same-origin (/api) unless NEXT_PUBLIC_API_URL is set.
    const origin = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    setBase(`${origin}/api`);
  }, []);

  async function change(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    try {
      await api.changePassword(current, next);
      setMsg('Password changed successfully.');
      setCurrent(''); setNext('');
    } catch (e) { setErr(e.message); }
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Settings</h1><p>Account & connection</p></div>
      </div>

      {err && <div className="alert err">{err}</div>}
      {msg && <div className="alert ok">{msg}</div>}

      <div className="grid cols-2">
        <div className="card">
          <h3>Account</h3>
          <p style={{ fontSize: 14 }}>Logged in as <b>{me?.username || '…'}</b></p>
          <form onSubmit={change} style={{ marginTop: 16 }}>
            <div className="field">
              <label>Current password</label>
              <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="field">
              <label>New password</label>
              <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
            </div>
            <button className="btn primary">Update password</button>
          </form>
        </div>

        <div className="card">
          <h3>Connection</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
            API base URL (untuk bot):<br />
            <span className="mono">{base}</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14, lineHeight: 1.7 }}>
            Arahkan bot ke API ini di <span className="mono">config.js</span>:<br />
            <span className="mono">apikey.customApiBase = &quot;{base}&quot;</span><br />
            <span className="mono">apikey.customApiKey = &quot;hbi_…&quot;</span>
          </p>
        </div>
      </div>
    </>
  );
}
