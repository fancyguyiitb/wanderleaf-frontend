'use client';

import { useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import HostHomeView from '@/components/host-home-view';
import RequireAuth from '@/components/require-auth';
import { useAuthStore } from '@/lib/store';

export default function HostPage() {
  const setUserMode = useAuthStore((state) => state.setUserMode);

  useEffect(() => {
    setUserMode('host');
  }, [setUserMode]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <HostHomeView />
        <Footer />
      </div>
    </RequireAuth>
  );
}
