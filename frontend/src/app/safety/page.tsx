"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle, Plus, X, Loader2, Search, Thermometer, Pill } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// --- TYPES & INTERFACES ---
interface MedicineResult {
  name: string;
  composition: string;
  duplicate: boolean;
  overdose_risk: boolean;
  warning: string;
}

export default function SafetyEngine() {
  const [inputMedicines, setInputMedicines] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MedicineResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- HANDLERS ---
  const addMedicineField = () => {
    setInputMedicines([...inputMedicines, '']);
  };

  const removeMedicineField = (index: number) => {
    if (inputMedicines.length > 1) {
      const newList = [...inputMedicines];
      newList.splice(index, 1);
      setInputMedicines(newList);
    } else {
      setInputMedicines(['']);
    }
  };

  const updateMedicineValue = (index: number, value: string) => {
    const newList = [...inputMedicines];
    newList[index] = value;
    setInputMedicines(newList);
  };

  const handleCheckSafety = async () => {
    // 1. INPUT HANDLING
    // Accept user input as array of medicine names, clean input: trim, remove empty, lowercase
    const medicines = inputMedicines
      .map(m => m.trim())
      .filter(m => m.length > 0)
      .map(m => m.toLowerCase());

    if (medicines.length === 0) {
      setErrorMsg("Please enter at least one medicine name.");
      return;
    }

    setIsLoading(true);
    setResults(null);
    setErrorMsg(null);

    // 6. DEBUG (REMOVE AFTER TESTING)
    console.log("INPUT:", medicines);

    try {
      // 2. API CALL (NO BACKEND)
      const response = await fetch("https://n8n-production-fc4a.up.railway.app/webhook-test/medicine-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          medicines: medicines
        })
      });

      if (!response.ok) throw new Error("API failed");
      const data = await response.json();

      // 6. DEBUG (REMOVE AFTER TESTING)
      console.log("API RESPONSE:", data);

      // 3. RESPONSE VALIDATION (CRITICAL FIX)
      // Ensure medicine names are NEVER empty. Webhook is the ONLY source of truth.
      const processedResults = data.results.map((item: any, index: number) => ({
        name: item.name && item.name.trim() !== "" 
          ? item.name 
          : medicines[index],   // fallback to original input

        composition: item.composition || "Unknown",
        duplicate: item.duplicate ?? false,
        overdose_risk: item.overdose_risk ?? false,
        warning: item.warning || ""
      }));

      // 6. DEBUG (REMOVE AFTER TESTING)
      console.log("FINAL RESULTS:", processedResults);
      setResults(processedResults);

    } catch (err) {
      // 5. ERROR HANDLING
      console.error(err);
      setErrorMsg("⚠️ Unable to check medicines right now. Please try again.");
      
      const fallbackData = medicines.map(name => ({
        name,
        composition: "Unknown",
        duplicate: false,
        overdose_risk: false,
        warning: "Service unavailable"
      }));
      setResults(fallbackData);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI RENDER COMPONENTS ---
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-10 px-4 min-h-screen">
      
      {/* 🎯 HERO SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 rounded-[2.5rem] border border-slate-800/60 backdrop-blur-xl relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.3)] rotate-3 hover:rotate-0 transition-transform duration-500">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Medicine <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Safety Check</span>
        </h1>
        <p className="text-slate-400 max-w-lg text-lg font-medium leading-relaxed">
          Real-time deterministic safety validation for multiple drug combinations.
        </p>
      </motion.div>

      {/* 🎯 INPUT SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-slate-900/60 border-slate-800/80 shadow-2xl backdrop-blur-md rounded-[2rem] border-2">
          <CardContent className="p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Pill className="text-indigo-400 w-6 h-6" />
                Input Medicines
              </h3>
              <button
                onClick={addMedicineField}
                className="inline-flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-5 py-2.5 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Drug
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {inputMedicines.map((med, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="flex gap-4 group"
                  >
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={med}
                        autoFocus={index === inputMedicines.length - 1 && index > 0}
                        onChange={(e) => updateMedicineValue(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCheckSafety();
                        }}
                        placeholder="e.g. Ibuprofen, Acetaminophen..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-14 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all font-medium text-lg placeholder:text-slate-600"
                      />
                    </div>
                    <button 
                      onClick={() => removeMedicineField(index)}
                      className="p-4 rounded-2xl bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 transition-all hover:border-red-500/40"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {errorMsg && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-red-400 font-bold text-center bg-red-500/10 py-3 rounded-xl border border-red-500/20"
              >
                {errorMsg}
              </motion.p>
            )}

            <button
              onClick={handleCheckSafety}
              disabled={isLoading}
              className="mt-10 w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-black text-xl py-6 rounded-2xl transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.4)] disabled:shadow-none flex items-center justify-center gap-3 relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-7 h-7 animate-spin" />
                  ANALYZING SAFETY...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-7 h-7" />
                  RUN SAFETY CHECK
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </motion.div>

      {/* 🎯 RESULTS SECTION */}
      <AnimatePresence>
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="space-y-6 pb-20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Safety Evaluation Results</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800/80 shadow-xl group hover:border-indigo-500/30 transition-all duration-500"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-white capitalize group-hover:text-indigo-400 transition-colors">
                        {result.name}
                      </h3>
                      <p className="text-slate-500 text-sm font-bold flex items-center gap-1.5 mt-1">
                        <Thermometer className="w-4 h-4" />
                        COMPOSITION: <span className="text-slate-300">{result.composition}</span>
                      </p>
                    </div>
                  </div>

                  {/* 4. UI DISPLAY RULES (Status Badges) */}
                  <div className="space-y-3">
                    {result.duplicate && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="text-amber-200 font-bold uppercase text-xs tracking-wider">⚠️ Duplicate Drug Alert</span>
                      </div>
                    )}

                    {result.overdose_risk && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                        <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />
                        <span className="text-red-200 font-bold uppercase text-xs tracking-wider">🚨 Overdose Risk Warning</span>
                      </div>
                    )}

                    {!result.duplicate && !result.overdose_risk && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-emerald-200 font-bold uppercase text-xs tracking-wider">✅ Safe Status</span>
                      </div>
                    )}

                    {result.warning && (
                      <div className="mt-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-sm italic italic leading-relaxed">
                        "{result.warning}"
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}
