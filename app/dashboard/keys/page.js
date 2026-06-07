'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function KeysPage() {
  const [keys, setKeys] = useState([]);
  const [label, setLabel] = useState('');
  const [owner, setOwner] = useState('');
  const [quota, setQuota] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() {
    try { const { keys } = await api.listKeys(); setKeys(keys); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      const { key } = await api.createKey({ label, owner, quota: quota ? Number(quota) : undefined });
      setMsg(`Created key: ${key.key}`);
      setLabel(''); setOwner(''); setQuota('');
      load();
    } catch (e) { setErr(e.message); }
  }

  async function toggle(k) { await api.updateKey(k.id, { active: !k.active }); load(); }
  async function rotate(k) {
    if (!confirm('Rotate this key? The old secret stops working.')) return;
    const { key } = await api.rotateKey(k.id);
    setMsg(`Rotated. New secret: ${key.key}`);
    load();
  }
  async function remove(k) {
    if (!confirm(`Delete key "${k.label}"?`)) return;
    await api.deleteKey(k.id); load();
  }
  function copy(text) { navigator.clipboard?.writeText(text); setMsg('Copied to clipboard.'); }

  return (
    <>
      <div className="topbar">
        <div><h1>API Keys</h1><p>Generate and manage access keys</p></div>
        <span className="badge">{keys.length} keys</span>
      </div>

      {err && <div className="alert err">{err}</div>}
      {msg && <div className="alert ok">{msg}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Generate new key</h3>
        <form onSubmit={create} className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Label</label>
            <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="whatsapp-bot" required />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Owner</label>
            <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="habibi" />
          </div>
          <div className="field" style={{ width: 140, marginBottom: 0 }}>
            <label>Daily quota</label>
            <input className="input" value={quota} onChange={(e) => setQuota(e.target.value)} placeholder="1000" />
          </div>
          <button className="btn primary">+ Generate</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Label</th><th>Key</th><th>Owner</th><th>Used (today/total)</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {keys.length === 0 && <tr><td colSpan="6" style={{ color: 'var(--muted)' }}>No keys yet.</td></tr>}
            {keys.map((k) => (
              <tr key={k.id}>
                <td>{k.label}</td>
                <td>
                  <span className="mono">{k.key.slice(0, 14)}…</span>
                  <button className="btn sm" style={{ marginLeft: 8 }} onClick={() => copy(k.key)}>Copy</button>
                </td>
                <td>{k.owner || '—'}</td>
                <td>{k.usedToday}/{k.usedTotal}</td>
                <td><span className={`pill ${k.active ? 'on' : 'off'}`}>{k.active ? 'Active' : 'Disabled'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm" onClick={() => toggle(k)}>{k.active ? 'Disable' : 'Enable'}</button>{' '}
                  <button className="btn sm" onClick={() => rotate(k)}>Rotate</button>{' '}
                  <button className="btn sm danger" onClick={() => remove(k)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
