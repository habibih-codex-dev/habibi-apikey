'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState('');

  async function load() {
    try { const { logs } = await api.recent(100); setLogs(logs); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="topbar">
        <div><h1>Request Logs</h1><p>Most recent API calls (auto-refreshing)</p></div>
        <span className="badge">↻ every 5s</span>
      </div>

      {err && <div className="alert err">{err}</div>}

      <div className="card">
        <table>
          <thead>
            <tr><th>Time</th><th>Key</th><th>Method</th><th>Endpoint</th><th>Status</th><th>Latency</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--muted)' }}>No requests logged yet.</td></tr>}
            {logs.map((l, i) => (
              <tr key={i}>
                <td>{new Date(l.ts).toLocaleTimeString()}</td>
                <td>{l.label || '—'}</td>
                <td className="mono">{l.method}</td>
                <td className="mono">{l.endpoint}</td>
                <td><span className={`pill ${l.status < 400 ? 'on' : 'off'}`}>{l.status}</span></td>
                <td>{l.ms} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
