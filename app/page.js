'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/api';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(auth.isAuthed ? '/dashboard' : '/login');
  }, [router]);
  return <div className="center-screen">Loading…</div>;
}
