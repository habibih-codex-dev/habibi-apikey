'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../lib/api';

const NAV = [
  { href: '/dashboard', label: 'Overview', ic: '📊' },
  { href: '/dashboard/keys', label: 'API Keys', ic: '🔑' },
  { href: '/dashboard/users', label: 'Users', ic: '👥' },
  { href: '/dashboard/logs', label: 'Request Logs', ic: '📜' },
  { href: '/dashboard/settings', label: 'Settings', ic: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    auth.clear();
    router.replace('/login');
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">H</div>
        <div>
          <b>Habibi Official</b>
          <small>Admin Panel</small>
        </div>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={pathname === n.href ? 'active' : ''}>
            <span className="ic">{n.ic}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="foot">
        <button className="logout" onClick={logout}>
          <span>⏻ Logout</span>
        </button>
      </div>
    </aside>
  );
}
