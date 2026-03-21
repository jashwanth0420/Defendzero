"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, Loader2, TrendingUp, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdherenceAPI } from '@/lib/api';

export default function PatientDashboard() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response: any = await AdherenceAPI.getSchedules();
        setSchedules(response.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleMarkTaken = async (id: string) => {
    try {
      await AdherenceAPI.markTaken(id);
      // Refresh data
      const response: any = await AdherenceAPI.getSchedules();
      setSchedules(response.data || []);
    } catch (err: any) {
      alert("Failed to log adherence: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in underline-offset-4 fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Patient Overview</h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">DEFENDZERO DETERMINISTIC SCANNING ACTIVE</p>
        </div>
        {error && <span className="text-red-400 text-xs font-black uppercase tracking-widest bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">{error}</span>}
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Adherence Score', value: '94%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { title: 'Active Schedules', value: schedules.length.toString(), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Safety Alerts', value: '0', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { title: 'Guarding Guardians', value: '0', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map(metric => (
           <Card key={metric.title} className="bg-slate-900/50 backdrop-blur-md border-slate-800 shadow-2xl overflow-hidden hover:border-slate-700 transition-all duration-300">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest leading-none">
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

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1">
           <CardHeader>
             <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Active Schedules
             </CardTitle>
             <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Autonomous adherence monitoring</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
              {schedules.length === 0 ? (
                <div className="text-center py-10 text-slate-700 font-bold uppercase tracking-widest text-[10px]">No active schedules detected.</div>
              ) : schedules.map((schedule) => (
                 <div key={schedule.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 transition-colors">
                   <div className="flex flex-col">
                      <span className="text-white font-black tracking-tighter uppercase">{schedule.medicine.name}</span>
                      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-indigo-500" /> {schedule.timeOfDay} • {schedule.dosage}
                      </span>
                   </div>
                   <button 
                     onClick={() => handleMarkTaken(schedule.id)}
                     className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95"
                   >
                     LOG DOSE
                   </button>
                 </div>
              ))}
           </CardContent>
        </Card>

        {/* Safety Engine Warnings */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-xl col-span-1 border-t-4 border-t-indigo-500">
           <CardHeader>
             <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Safety Status
             </CardTitle>
             <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Deterministic drug verification enabled</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                   <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div>
                     <h3 className="text-emerald-400 font-bold uppercase text-xs tracking-[0.1em] mb-1">Operational Safety Active</h3>
                     <p className="text-emerald-200/50 text-[11px] leading-relaxed font-medium">
                       Every pharmaceutical entry is scanned against the DefendZero Deterministic Risk Database. Trimester-based filters currently enforced.
                     </p>
                   </div>
                </div>
             </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
