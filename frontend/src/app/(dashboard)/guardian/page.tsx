"use client";

import { ShieldPlus, Activity, Clock, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function GuardianDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <ShieldPlus className="w-8 h-8 text-indigo-500" />
             Guardian Monitor
          </h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">REMOTE PATIENT VIGILANCE ENABLED</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
         <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-2">
            <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white leading-none">Linked Patients</CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-1">Real-time Adherence Stream</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-center py-20 text-slate-700 font-bold uppercase tracking-widest text-[10px]">
                  No patients currently linked to your monitoring profile.
               </div>
            </CardContent>
         </Card>

         <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 border-t-4 border-t-amber-500">
            <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-1 leading-none">Alert Center</CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Missed Dose Notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-200/50 text-[10px] uppercase font-black tracking-widest">No Active Alerts</span>
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
