"use client";

import { useEffect, useState } from 'react';
import { Stethoscope, Users, FilePlus, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DoctorAPI } from '@/lib/api';

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res: any = await DoctorAPI.getPatients();
        setPatients(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  if (loading) {
    return (
       <div className="flex items-center justify-center min-h-[400px]">
         <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
       </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <Stethoscope className="w-8 h-8 text-indigo-500" />
             Physician Portal
          </h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">SECURE CLINICAL WORKSPACE ENABLED</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Managed Patients', value: patients.length.toString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Pending Prescriptions', value: '4', icon: FilePlus, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { title: 'Clinical Search', value: 'Live', icon: Search, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
        ].map(metric => (
           <Card key={metric.title} className="bg-slate-900/50 backdrop-blur-md border-slate-800 shadow-2xl overflow-hidden hover:border-slate-700 transition-all duration-300">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  {metric.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metric.bg}`}>
                   <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-black text-white">{metric.value}</div>
             </CardContent>
           </Card>
        ))}
      </div>

      {/* Activity Panels */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-2">
           <CardHeader className="flex flex-row items-center justify-between">
             <div>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white leading-none">Your Patients</CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Verified Clinical Relationships</CardDescription>
             </div>
             <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95">
                + Add Patient
             </button>
           </CardHeader>
           <CardContent className="space-y-4">
              {patients.length === 0 ? (
                <div className="text-center py-10 text-slate-700 font-bold uppercase tracking-widest text-[10px]">No patients currently assigned.</div>
              ) : patients.map((p) => (
                 <div key={p.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black text-xs text-indigo-400">
                         {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-black tracking-tighter uppercase">{p.firstName} {p.lastName}</span>
                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">UID: {p.id.substring(0,8)}</span>
                      </div>
                   </div>
                   <button className="text-indigo-400 hover:text-indigo-300 transition-colors font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                      Prescribe
                   </button>
                 </div>
              ))}
           </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 border-t-4 border-t-indigo-500">
           <CardHeader>
             <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-1 leading-none">Clinical Tools</CardTitle>
             <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Autonomous Prescription Guard</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                <FilePlus className="w-6 h-6 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-white text-[10px] font-black uppercase tracking-widest">New Digital Order</h4>
                <p className="text-slate-500 text-[9px] mt-1 font-medium italic">Issue secure, trackable prescriptions.</p>
             </div>
             <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer group">
                <Search className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-white text-[10px] font-black uppercase tracking-widest">Safety Engine Search</h4>
                <p className="text-slate-500 text-[9px] mt-1 font-medium italic">Deterministic verification via Backend.</p>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
