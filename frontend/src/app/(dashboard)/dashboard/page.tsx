"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirector() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem('defendzero_role');

    if (!role) {
      router.push('/roles');
      return;
    }

    switch (role) {
      case 'DOCTOR':
        router.push('/doctor');
        break;
      case 'GUARDIAN':
        router.push('/guardian');
        break;
      case 'PHARMACY':
        router.push('/pharmacy');
        break;
      case 'USER':
      default:
        router.push('/user');
        break;
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
        <p className="text-slate-500 font-medium animate-pulse text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Isolated Workspace...</p>
      </div>
    </div>
  );
}
