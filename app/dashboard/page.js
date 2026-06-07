'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

function Stat({ label, value, sub, icon }) {
  return (
    <div className="card stat">
      <div className="icon">{icon}</div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [series, setSeries] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, t, e] = await Promise.all([api.summary(), api.timeseries(14), api.endpoints()]);
        setSummary(s.summary);
        setSeries(t.series);
        setEndpoints(e.endpoints);
      } catch (e) { setErr(e.message); }
    })();
  }, []);

  const max = Math.max(1, ...series.map((d) => d.count));

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Overview</h1>
          <p>API usage at a glance</p>
        </div>
        <span className="badge">● Live</span>
      </div>

      {err && <div className="alert err">{err}</div>}

      <div className="grid cols-4" style={{ marginBottom: 18 }}>
        <Stat label="Total Requests" value={summary?.totalRequests ?? '—'} icon="📈" />
        <Stat label="Last 24h" value={summary?.requests24h ?? '—'} icon="⚡" />
        <Stat label="Active Keys" value={`${summary?.activeKeys ?? '—'}/${summary?.totalKeys ?? '—'}`} icon="🔑" />
        <Stat label="Avg Latency" value={`${summary?.avgLatencyMs ?? '—'} ms`} sub={`Error rate ${summary?.errorRate ?? 0}%`} icon="⏱️" />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>Requests — last 14 days</h3>
          <div className="chart">
            {series.map((d) => (
              <div className="bar-wrap" key={d.date} title={`${d.date}: ${d.count}`}>
                <div className="bar" style={{ height: `${(d.count / max) * 150}px` }} />
                <span>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Top endpoints</h3>
          <table>
            <thead><tr><th>Endpoint</th><th style={{ textAlign: 'right' }}>Hits</th></tr></thead>
            <tbody>
              {endpoints.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--muted)' }}>No data yet</td></tr>}
              {endpoints.map((e) => (
                <tr key={e.endpoint}>
                  <td className="mono">{e.endpoint}</td>
                  <td style={{ textAlign: 'right' }}>{e.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
