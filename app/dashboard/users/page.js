'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [err, setErr] = useState('');

  async function load() {
    try { const { users } = await api.listUsers(q); setUsers(users); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function create(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.createUser({ name, email, plan });
      setName(''); setEmail(''); setPlan('free'); load();
    } catch (e) { setErr(e.message); }
  }
  async function changePlan(u) {
    const next = u.plan === 'free' ? 'premium' : u.plan === 'premium' ? 'enterprise' : 'free';
    await api.updateUser(u.id, { plan: next }); load();
  }
  async function remove(u) {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    await api.deleteUser(u.id); load();
  }

  return (
    <>
      <div className="topbar">
        <div><h1>Users</h1><p>Manage API consumers</p></div>
        <span className="badge">{users.length} users</span>
      </div>

      {err && <div className="alert err">{err}</div>}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3>Add user</h3>
        <form onSubmit={create} className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 1, marginBottom: 0 }}>
            <label>Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@mail.com" />
          </div>
          <div className="field" style={{ width: 160, marginBottom: 0 }}>
            <label>Plan</label>
            <select className="input" value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <button className="btn primary">+ Add</button>
        </form>
      </div>

      <div className="card">
        <div className="spread" style={{ marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>All users</h3>
          <form onSubmit={(e) => { e.preventDefault(); load(); }} className="row">
            <input className="input" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn sm">Search</button>
          </form>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Joined</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {users.length === 0 && <tr><td colSpan="5" style={{ color: 'var(--muted)' }}>No users.</td></tr>}
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email || '—'}</td>
                <td><span className="pill plan">{u.plan}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn sm" onClick={() => changePlan(u)}>Change plan</button>{' '}
                  <button className="btn sm danger" onClick={() => remove(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
