"use client";

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Clock, 
  ShieldPlus, 
  MessagesSquare, 
  FileText,
  Store,
  Stethoscope,
  LogOut
} from 'lucide-react';

const RoleLinks: Record<string, any[]> = {
  USER: [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/user' },
    { name: 'Safety Engine', icon: ShieldCheck, path: '/user/safety' },
    { name: 'My Schedule', icon: Clock, path: '/user/schedule' },
    { name: 'Messages', icon: MessagesSquare, path: '/user/messages' },
  ],
  GUARDIAN: [
    { name: 'Monitor Patients', icon: ShieldPlus, path: '/guardian' },
  ],
  DOCTOR: [
    { name: 'Patient Directory', icon: Stethoscope, path: '/doctor' },
    { name: 'Prescriptions', icon: FileText, path: '/doctor/prescriptions' },
  ],
  PHARMACY: [
    { name: 'Token Validator', icon: Store, path: '/pharmacy' },
  ]
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem('defendzero_role');
    if (!storedRole) {
       router.push('/roles');
       return;
    }
    setRole(storedRole);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/roles');
  };

  if (!mounted) return null;

  const links = RoleLinks[role || 'USER'] || [];

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden">
      
      {/* Sidebar Architecture */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="p-6">
           <Link href="/dashboard">
             <h2 className="text-2xl font-black mb-10 text-white tracking-tight cursor-pointer">Defend<span className="text-indigo-400">Zero</span></h2>
           </Link>
           
           <nav className="space-y-1">
             {links.map(link => {
               const isActive = pathname === link.path;
               return (
                 <Link 
                   href={link.path} 
                   key={link.name}
                   className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer group ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
                 >
                   <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'}`} />
                   <span className="font-bold text-sm tracking-tight uppercase">{link.name}</span>
                 </Link>
               );
             })}
           </nav>
        </div>
        
        <div className="p-6 border-t border-slate-800 space-y-4">
           <div className="flex items-center space-x-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <span className="text-indigo-400 font-bold text-xs">{role?.substring(0,2)}</span>
             </div>
             <div>
               <p className="text-sm font-bold text-white leading-none">Verified User</p>
               <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">{role} PROFILE</p>
             </div>
           </div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 hover:text-red-500 rounded-xl transition-all group"
           >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Terminate Session</span>
           </button>
        </div>
      </aside>

      {/* Main Glassmorphic Container Layer */}
      <main className="flex-1 overflow-y-auto bg-[url('/bg-patterns.svg')] bg-fixed relative">
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] z-0"></div>
        
        <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto min-h-full">
           {children}
        </div>
      </main>

    </div>
  );
}
