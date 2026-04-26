"use client";

import { useEffect, useState, use } from 'react';
import { Loader2, Shield, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GuardianAPI } from '@/lib/api';
import Link from 'next/link';

export default function PatientMonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res: any = await GuardianAPI.getPatientDetails(id);
        setData(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="text-red-500 p-20">{error}</div>;

  const { patient, schedules, history } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/guardian" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Monitoring: {patient.firstName} {patient.lastName}</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none mt-1">{patient.email}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-400 flex items-center gap-2">
               <TrendingUp className="w-6 h-6" /> {history.adherencePercent}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Missed Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-400 flex items-center gap-2">
               <Shield className="w-6 h-6" /> {history.currentMissedStreak} days
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Meds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-400 flex items-center gap-2">
               <Clock className="w-6 h-6" /> {schedules.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 h-fit">
           <CardHeader>
             <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Active Schedules</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
              {schedules.map((s: any) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                   <div className="text-white font-black uppercase text-sm tracking-tight">{s.medicineName}</div>
                   <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">{(s.scheduleTimes || []).join(', ')} • {s.dosage}</div>
                </div>
              ))}
           </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
           <CardHeader>
              <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Recent Adherence</CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
              {(history.timeline || []).slice(-7).reverse().map((t: any) => (
                <div key={t.date} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-800/50">
                   <div className="text-[11px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                   <div className={`text-[10px] font-black uppercase px-2 py-1 rounded ${t.adherencePercent >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {t.adherencePercent}% Score
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
