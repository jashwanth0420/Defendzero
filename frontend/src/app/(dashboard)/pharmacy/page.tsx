"use client";

import { Store, Camera, QrCode, ClipboardCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PharmacyDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <Store className="w-8 h-8 text-indigo-500" />
             Pharmacy Portal
          </h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">SECURE DISPENSING INTERFACE</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 border-t-4 border-t-emerald-500 hover:scale-105 transition-transform cursor-pointer group">
            <CardHeader className="flex flex-col items-center justify-center p-10 text-center">
               <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40 mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-8 h-8 text-emerald-500" />
               </div>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-1 leading-none">Scan Token</CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Verified Dispensary Authorization</CardDescription>
            </CardHeader>
         </Card>

         <Card className="bg-slate-900 border-slate-800 shadow-xl col-span-1 border-t-4 border-t-indigo-500 hover:scale-105 transition-transform cursor-pointer group">
            <CardHeader className="flex flex-col items-center justify-center p-10 text-center">
               <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/40 mb-4 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-8 h-8 text-indigo-500" />
               </div>
               <CardTitle className="text-xl font-black uppercase tracking-tight text-white mb-1 leading-none">Manual Entry</CardTitle>
               <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase mt-2">Enter Secure Transaction ID</CardDescription>
            </CardHeader>
         </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-xl border-t-4 border-t-slate-700">
         <CardHeader>
            <CardTitle className="text-xl font-black uppercase tracking-tight text-white">Recent Purchases</CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Verified Dispensary History</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-10 text-slate-700 font-bold uppercase tracking-widest text-[10px]">
               No dispensary activity recorded.
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
