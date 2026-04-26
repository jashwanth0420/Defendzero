"use client";

import { useEffect, useState } from 'react';
import { Loader2, Store, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PharmacyAPI } from '@/lib/api';

type PharmacyItem = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  storeName?: string;
};

export default function PharmacyDashboard() {
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>([]);
  const [token, setToken] = useState('');
  const [requestedQuantity, setRequestedQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPharmacies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await PharmacyAPI.getAll();
      setPharmacies(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setPharmacies([]);
      setError(err.message || 'Failed to load pharmacies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacies();
  }, []);

  const verifyPurchase = async () => {
    if (!token.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await PharmacyAPI.verifyPurchase({
        token: token.trim(),
        requestedQuantity: Number(requestedQuantity),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Purchase verification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <Store className="w-8 h-8 text-indigo-500" />
          Pharmacy Portal
        </h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block">
          Dynamic transaction verification
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-400" /> Verify Purchase
            </CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Validate token and quantity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 text-sm"
                placeholder="Enter Hex Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button
                onClick={async () => {
                   if(!token.trim()) return;
                   setBusy(true);
                   setError(null);
                   try {
                     const res: any = await PharmacyAPI.getTokenDetails(token.trim());
                     setResult(res.data);
                   } catch(err: any) {
                     setError(err.message);
                   } finally {
                     setBusy(false);
                   }
                }}
                disabled={busy}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-lg text-xs font-black uppercase"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "LOAD"}
              </button>
            </div>

            {result && result.medicines && (
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 tracking-widest border-b border-slate-800 pb-2 mb-2">
                   <span>Patient: {result.patientName}</span>
                   <span>Expires: {new Date(result.expiryDate).toLocaleDateString()}</span>
                </div>
                {result.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{m.name || m.medicineName}</div>
                      <div className="text-[10px] text-slate-500">{m.dosage}</div>
                    </div>
                    <button
                      onClick={async () => {
                         setBusy(true);
                         setError(null);
                         try {
                           const res: any = await PharmacyAPI.validateHexToken({
                             token: token.trim(),
                             medicineName: m.name || m.medicineName,
                             quantity: 1
                           });
                           alert("Transaction Successful! Remaining: " + res.data.remainingQuantity);
                           setToken('');
                           setResult(null);
                         } catch(err: any) {
                           setError(err.message);
                         } finally {
                           setBusy(false);
                         }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase"
                    >
                      FULFILL
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!result && (
               <div className="text-center py-6 text-slate-700 text-[10px] font-black uppercase tracking-widest border border-dashed border-slate-800 rounded-xl">
                  Enter patient token to begin scanning
               </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Registered Pharmacies</CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Live list from backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500">
                No pharmacies available.
              </div>
            ) : (
              <div className="space-y-3">
                {pharmacies.map((pharmacy) => (
                  <div key={pharmacy.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="text-white font-black uppercase tracking-tight">
                      {pharmacy.storeName || `${pharmacy.firstName || ''} ${pharmacy.lastName || ''}`.trim() || 'Unknown Store'}
                    </div>
                    <div className="text-xs text-slate-400">{pharmacy.email || 'No email'}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
