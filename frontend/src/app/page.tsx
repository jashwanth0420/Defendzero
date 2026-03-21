export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center p-6 text-slate-100">
      <div className="max-w-xl w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-10 rounded-3xl shadow-2xl">
        
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto border border-red-500/20">
           <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>

        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 text-center mb-6">
          Critical Medical Disclaimer
        </h1>
        
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed mb-8">
          <p>
            <strong className="text-white font-semibold">DefendZero is NOT a diagnostic tool.</strong> This application strictly functions as a deterministic safety constraints engine and personal adherence tracker.
          </p>
          <p>
            Any alerts generated regarding duplicated ingredients, drug interactions, or pregnancy contraindications are strictly aggregated reference material pulled from documented pharmaceutical guidelines.
          </p>
          <p className="text-red-300/90 font-medium">
            Always explicitly consult a licensed physician or pharmacist before starting, altering, or stopping any medical regimen, even if explicitly listed as "SAFE" by an underlying rule engine.
          </p>
        </div>

        <a 
          href="/roles"
          className="w-full block text-center py-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-95 text-white"
        >
          I Understand & Agree
        </a>
      </div>
    </div>
  );
}
