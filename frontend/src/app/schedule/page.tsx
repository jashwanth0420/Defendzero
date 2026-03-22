"use client";

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Calendar, Utensils, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicationAPI, MedicinesAPI } from '@/lib/api';

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [composition, setComposition] = useState('');
  
  const [formData, setFormData] = useState({
    dosage: '1 tablet',
    frequency: 'DAILY',
    timeOfDay: '08:00',
    mealRelation: 'WITH_FOOD'
  });

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    setLoading(true);
    try {
      const next = await MedicationAPI.getSchedules() as any;
      setSchedules(next.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Drug search logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        const res: any = await MedicinesAPI.search(query);
        const data = Array.isArray(res) ? res : (res.data || res.results || []);
        setMedicines(data);
      } else {
        setMedicines([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async () => {
    if (!selectedMed) return;
    setAdding(true);
    try {
      await MedicationAPI.createSchedule({
        medicineName: selectedMed.name,
        composition: composition.split(',').map((x: string) => x.trim()).filter(Boolean),
        dosage: formData.dosage,
        frequency: formData.frequency,
        timingType: formData.mealRelation,
        scheduleTimes: [formData.timeOfDay],
        startDate: new Date().toISOString(),
      });
      // Reset & Refresh
      setSelectedMed(null);
      setQuery('');
      setComposition('');
      loadSchedules();
    } catch (err: any) {
      alert("Error adding schedule: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <h1 className="text-3xl font-black text-white tracking-tight">Medicine Schedules</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ADD NEW SCHEDULE */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 h-fit">
           <CardHeader>
             <CardTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <Plus className="w-5 h-5 text-indigo-400" /> New Reminder
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Medicine</label>
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none"
                  placeholder="Type name..."
                />
                {medicines.length > 0 && (
                   <div className="bg-slate-950 border border-slate-800 rounded-xl mt-1 overflow-hidden">
                      {medicines.map(m => (
                        <button key={m.id || m.name} onClick={() => { setSelectedMed(m); setQuery(m.name); setMedicines([]); }} className="w-full text-left px-4 py-3 hover:bg-slate-900 text-sm text-slate-300 transition-colors uppercase font-bold tracking-tight">
                           {m.name}
                        </button>
                      ))}
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Composition (comma separated)</label>
                <input
                  type="text"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none"
                  placeholder="e.g. acetaminophen"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dosage</label>
                    <input 
                       type="text" 
                       value={formData.dosage} 
                       onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time</label>
                    <input 
                       type="time" 
                       value={formData.timeOfDay} 
                       onChange={(e) => setFormData({...formData, timeOfDay: e.target.value})}
                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none" 
                    />
                 </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={!selectedMed || adding}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black rounded-xl shadow-lg transition-all"
              >
                {adding ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "ADD TO SCHEDULE"}
              </button>
           </CardContent>
        </Card>

        {/* LIST SCHEDULES */}
        <div className="lg:col-span-2 space-y-4">
           {loading ? (
              <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>
           ) : schedules.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-20 text-center">
                 <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                 <p className="text-slate-500 font-medium">No active medication schedules found.</p>
              </div>
           ) : schedules.map((s) => (
              <Card key={s.id} className="bg-slate-900 border-slate-800 group hover:border-slate-700 transition-all overflow-hidden">
                 <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <Clock className="w-6 h-6 text-indigo-400" />
                       </div>
                        <div>
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">{s.medicineName}</h3>
                          <div className="flex gap-4 text-slate-400 text-sm mt-1">
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {s.frequency}</span>
                            <span className="flex items-center gap-1 font-bold text-slate-300">@{(s.scheduleTimes || []).join(', ')}</span>
                            <span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {s.timingType}</span>
                          </div>
                       </div>
                    </div>
                    <button className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                       <Trash2 className="w-5 h-5" />
                    </button>
                 </CardContent>
              </Card>
           ))}
        </div>

      </div>
    </div>
  );
}
