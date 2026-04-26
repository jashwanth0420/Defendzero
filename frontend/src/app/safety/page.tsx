"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Plus, X, Loader2, Search, Pill } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SafetyAPI } from '@/lib/api';

// --- TYPES & INTERFACES ---
interface InteractionResult {
  drug_1: string;
  drug_2: string;
  risk: string;
  severity: string;
  evidence?: string;
}

const normalizeInteractions = (response: any): InteractionResult[] => {
  const candidates =
    response?.results ||
    response?.data?.results ||
    response?.data ||
    [];

  if (!Array.isArray(candidates)) {
    return [];
  }

  return candidates
    .map((item: any) => ({
      drug_1: item?.drug_1 || item?.drug1 || '',
      drug_2: item?.drug_2 || item?.drug2 || '',
      risk: item?.risk || item?.message || '',
      severity: item?.severity || 'moderate',
      evidence: item?.evidence,
    }))
    .filter((item: InteractionResult) => item.drug_1 && item.drug_2 && item.risk);
};

const getSeverityClasses = (severity: string) => {
  switch ((severity || '').toLowerCase()) {
    case 'critical':
      return 'bg-red-500/10 border-red-500/30 text-red-300';
    case 'high':
      return 'bg-orange-500/10 border-orange-500/30 text-orange-300';
    case 'moderate':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300';
    default:
      return 'bg-slate-700/30 border-slate-600/50 text-slate-200';
  }
};

export default function SafetyEngine() {
  const [inputMedicines, setInputMedicines] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InteractionResult[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const severityCounts = (results || []).reduce(
    (acc, item) => {
      const key = (item.severity || '').toLowerCase();
      if (key === 'critical') acc.critical += 1;
      if (key === 'high') acc.high += 1;
      if (key === 'moderate') acc.moderate += 1;
      return acc;
    },
    { critical: 0, high: 0, moderate: 0 }
  );

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
      .flatMap((m) => m.split(/[,+;\n]/g))
      .map(m => m.trim())
      .filter(m => m.length > 0);

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
      // 2. API CALL (ROUTED THROUGH BACKEND PROXY TO AVOID CORS)
      const response = await SafetyAPI.checkN8nWebhook({ medicines });

      // 6. DEBUG (REMOVE AFTER TESTING)
      console.log("API RESPONSE:", response);

      const processedResults = normalizeInteractions(response);

      // 6. DEBUG (REMOVE AFTER TESTING)
      console.log("FINAL RESULTS:", processedResults);
      setResults(processedResults);

    } catch (err) {
      // 5. ERROR HANDLING
      console.error(err);
      setErrorMsg("⚠️ Unable to check medicines right now. Please try again.");
      setResults(null);
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
                <AlertTriangle className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Safety Evaluation Results</h2>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 font-semibold">
              ⚠️ {results.length} Interaction(s) Detected
            </div>

            {results.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-semibold uppercase tracking-wide">
                  Critical: {severityCounts.critical}
                </span>
                <span className="px-3 py-1 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-semibold uppercase tracking-wide">
                  High: {severityCounts.high}
                </span>
                <span className="px-3 py-1 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 text-xs font-semibold uppercase tracking-wide">
                  Moderate: {severityCounts.moderate}
                </span>
              </div>
            )}

            {results.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-emerald-200 font-medium">
                No significant drug interactions found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, i) => (
                  <motion.div
                    key={`${result.drug_1}-${result.drug_2}-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 rounded-[2rem] bg-slate-900 border border-slate-800/80 shadow-xl group hover:border-indigo-500/30 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <h3 className="text-2xl font-black text-white leading-tight group-hover:text-indigo-400 transition-colors">
                        {result.drug_1} + {result.drug_2}
                      </h3>
                      <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wide ${getSeverityClasses(result.severity)}`}>
                        {result.severity}
                      </span>
                    </div>

                    <p className="text-slate-200 leading-relaxed">{result.risk}</p>

                    {result.evidence && (
                      <details className="mt-4 rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm">
                        <summary className="cursor-pointer text-slate-400 font-semibold">Evidence</summary>
                        <p className="mt-3 text-slate-300 leading-relaxed">{result.evidence}</p>
                      </details>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
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
