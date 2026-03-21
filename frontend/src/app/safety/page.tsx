"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle, ChevronRight, Zap, Loader2, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SafetyAPI, MedicinesAPI } from '@/lib/api';

export default function SafetyEngine() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Fuzzy search for medicines when user types
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 1) {
        setIsSearching(true);
        try {
          const res: any = await MedicinesAPI.search(query);
          setMedicines(res.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setMedicines([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleCheck = async (medicineId: string) => {
    setAnalyzing(true);
    setResult(null);
    try {
      // In a real scenario, we'd fetch current meds from AdherenceAPI first
      // For this demo, we'll check target against profile stored in user's JWT/Session
      const res: any = await SafetyAPI.checkMedicine({
        targetMedicineId: medicineId,
        currentMedicineIds: [] // Currently active meds in user's adherence schedule
      });
      setResult(res.data);
    } catch (err: any) {
      alert("Safety check failed: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
       <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-md">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
             <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Deterministic Safety Engine</h1>
          <p className="text-slate-400 max-w-lg">
             Select any drug to evaluate its safety profile against your clinical user metadata.
          </p>
       </div>

       <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-visible">
         <CardContent className="p-8">
            <h3 className="text-lg font-bold text-slate-200 mb-4">Analyze Target Medication</h3>
            
            <div className="relative">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  {isSearching ? <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" /> : <Zap className="h-5 w-5 text-indigo-400" />}
               </div>
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search drug database... (e.g. 'Amoxicillin')" 
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
               />

               {/* Dropdown Suggestions */}
               {medicines.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
                    {medicines.map((med) => (
                      <button 
                        key={med.id}
                        onClick={() => {
                           setSelectedMed(med);
                           setQuery(med.name);
                           setMedicines([]);
                           handleCheck(med.id);
                        }}
                        className="w-full px-6 py-4 text-left hover:bg-slate-800 border-b border-slate-800 last:border-0 flex justify-between items-center group transition-colors"
                      >
                         <div>
                            <p className="text-white font-bold group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{med.name}</p>
                            <p className="text-slate-500 text-xs italic">{med.description || "Pharmaceutical agent"}</p>
                         </div>
                         <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    ))}
                 </div>
               )}
            </div>
         </CardContent>
       </Card>

       {analyzing && (
          <div className="flex flex-col items-center gap-4 py-10 animate-pulse">
             <div className="w-12 h-12 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
             <p className="text-indigo-400 font-bold tracking-widest text-sm">QUERYING THE DETERMINISTIC DATABASE...</p>
          </div>
       )}

       {/* RESULTS AREA */}
       {result && (
         <div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-500 pb-20">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.isSafe ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'} border`}>
                 {result.isSafe ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <AlertOctagon className="w-6 h-6 text-red-500" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white capitalize">{selectedMed?.name || "Evaluation Result"}</h2>
                <p className={`text-sm font-bold ${result.isSafe ? 'text-emerald-400' : 'text-red-400'}`}>OVERALL STATUS: {result.overallLevel}</p>
              </div>
            </div>

            {result.explanations.map((exp: any, i: number) => {
               const isDanger = ['DANGER', 'CONTRAINDICATED'].includes(exp.severity);
               return (
                  <div key={i} className={`p-6 rounded-2xl border ${
                    isDanger ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'
                  } flex items-start gap-4 transition-all hover:scale-[1.01]`}>
                     {isDanger ? 
                       <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-1" /> :
                       <Info className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                     }
                     <div>
                       <h3 className={`font-black mb-2 tracking-tight ${
                         isDanger ? 'text-red-400' : 'text-amber-400'
                       }`}>
                         RULE: {exp.rule}
                       </h3>
                       <p className={`${
                         isDanger ? 'text-red-100/70' : 'text-amber-100/70'
                       } leading-relaxed`}>
                         {exp.description}
                       </p>
                     </div>
                  </div>
               );
            })}
         </div>
       )}
    </div>
  );
}
