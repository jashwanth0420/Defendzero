import { Card } from "@/components/ui/card";
import { User, Shield, Stethoscope, Store } from "lucide-react";
import Link from 'next/link';

const roles = [
  { id: 'USER', name: 'Patient', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'GUARDIAN', name: 'Guardian', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'DOCTOR', name: 'Physician', icon: Stethoscope, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'PHARMACY', name: 'Pharmacy', icon: Store, color: 'text-amber-400', bg: 'bg-amber-500/10' }
];

export default function RoleSelection() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 max-w-4xl w-full">
        <h1 className="text-4xl md:text-6xl font-black text-center mb-4 tracking-tighter">
           Defend<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Zero</span>
        </h1>
        <p className="text-slate-400 text-center mb-16 max-w-lg mx-auto text-lg leading-relaxed">
           Select your operating profile to access the synchronized secure medical interface.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <Link href={`/login?role=${role.id}`} key={role.id}>
              <div 
                className="group relative h-48 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center transition-all hover:bg-slate-800/80 hover:border-slate-700 hover:scale-[1.03] cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1 ${role.bg}`}>
                    <role.icon className={`w-8 h-8 ${role.color}`} />
                 </div>
                 
                 <h3 className="text-xl font-semibold text-slate-200 group-hover:text-white transition-colors">{role.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
