"use client";

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, Loader2, TrendingUp, Shield, QrCode as QrIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MedicationAPI } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

export default function PatientDashboard() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [history, setHistory] = useState<any>({ adherencePercent: 0, currentMissedStreak: 0 });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<{ token: string, expiryDate: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [schedulesResponse, historyResponse, notificationsResponse, prescriptionsResponse] = await Promise.all([
          MedicationAPI.getSchedules() as Promise<any>,
          MedicationAPI.getHistory() as Promise<any>,
          MedicationAPI.getNotifications() as Promise<any>,
          MedicationAPI.getPrescriptions() as Promise<any>,
        ]);
        setSchedules(schedulesResponse.data || []);
        setPrescriptions(prescriptionsResponse.data || []);
        setHistory(historyResponse.data || { adherencePercent: 0, currentMissedStreak: 0 });
        setNotifications(notificationsResponse.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateToken = async (prescriptionId: string) => {
    try {
      const res: any = await MedicationAPI.generatePurchaseToken({
        prescriptionId,
        maxQuantity: 10,
        expiryDays: 7
      });
      setActiveToken({ token: res.data.token, expiryDate: res.data.expiryDate });
    } catch (err: any) {
      alert("Failed to generate token: " + err.message);
    }
  };

  const handleMarkTaken = async (id: string) => {
    try {
      await MedicationAPI.logDose({ scheduleId: id, status: 'TAKEN' });
      const [schedulesResponse, historyResponse] = await Promise.all([
        MedicationAPI.getSchedules() as Promise<any>,
        MedicationAPI.getHistory() as Promise<any>,
      ]);
      setSchedules(schedulesResponse.data || []);
      setHistory(historyResponse.data || { adherencePercent: 0, currentMissedStreak: 0 });
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
    <div className="space-y-8 animate-in underline-offset-4 fade-in duration-500 pb-20">
      
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
          { title: 'Adherence Score', value: `${history.adherencePercent || 0}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { title: 'Active Schedules', value: schedules.length.toString(), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { title: 'Prescriptions', value: prescriptions.length.toString(), icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { title: 'Missed Streak', value: (history.currentMissedStreak || 0).toString(), icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' }
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
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800 shadow-xl border-t-4 border-t-emerald-500">
             <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Active Medication
               </CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Autonomous adherence monitoring</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                {schedules.length === 0 ? (
                  <div className="text-center py-10 text-slate-700 font-bold uppercase tracking-widest text-[10px]">No active schedules detected.</div>
                ) : schedules.map((schedule) => (
                   <div key={schedule.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/80 transition-colors">
                     <div className="flex flex-col">
                        <span className="text-white font-black tracking-tighter uppercase">{schedule.medicineName}</span>
                          <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> {(schedule.scheduleTimes || []).join(', ')} • {schedule.dosage}
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

          <Card className="bg-slate-900 border-slate-800 shadow-xl border-t-4 border-t-indigo-500">
             <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Verified Prescriptions
               </CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Digital medical records</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {prescriptions.length === 0 ? (
                 <div className="text-center py-10 text-slate-700 font-bold uppercase tracking-widest text-[10px]">No prescriptions found.</div>
               ) : prescriptions.map((p) => (
                 <div key={p.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-800 bg-slate-950/50">
                    <div>
                      <div className="text-white font-black tracking-tighter uppercase">{p.doctorName || "Unknown Physician"}</div>
                      <div className="text-[10px] text-slate-500 font-black uppercase mt-1">Issued: {new Date(p.issuedDate).toLocaleDateString()}</div>
                    </div>
                    {p.verified ? (
                       <button onClick={() => handleGenerateToken(p.id)} className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2">
                          <QrIcon className="w-4 h-4" /> GENERATE QR
                       </button>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-black uppercase bg-slate-800 px-3 py-1 rounded">Pending Verification</span>
                    )}
                 </div>
               ))}
             </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           {activeToken && (
             <Card className="bg-white border-none shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden animate-in slide-in-from-right duration-500">
                <CardHeader className="bg-indigo-600 text-white p-6">
                   <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <QrIcon className="w-5 h-5" /> Official Pharmacy QR
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 flex flex-col items-center gap-6">
                   <div className="p-4 bg-slate-50 rounded-3xl border-8 border-slate-100 shadow-inner">
                      <QRCodeSVG value={activeToken.token} size={200} />
                   </div>
                   <div className="text-center w-full">
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Secure Transaction Token</div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2 break-all font-mono text-[9px] text-slate-600">
                         {activeToken.token}
                      </div>
                      <button 
                        onClick={() => {
                           navigator.clipboard.writeText(activeToken.token);
                           alert("Token Copied!");
                        }}
                        className="mt-2 text-[10px] text-indigo-600 font-black uppercase hover:underline"
                      >
                         COPY HASH
                      </button>
                      <div className="text-[9px] text-red-500 font-black uppercase mt-4">Expires: {new Date(activeToken.expiryDate).toLocaleString()}</div>
                   </div>
                   <button onClick={() => setActiveToken(null)} className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">
                      CLOSE TOKEN
                   </button>
                </CardContent>
             </Card>
           )}

           <Card className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border-slate-700 shadow-xl border-t-4 border-t-indigo-500">
             <CardHeader>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Safety Engine
               </CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Real-time verification</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                   <p className="text-indigo-200/50 text-[11px] leading-relaxed font-medium mb-4">
                      DefendZero Deterministic Risk Database is active. Every token issued is cryptographically bound to your identity.
                   </p>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">System Secure</span>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
