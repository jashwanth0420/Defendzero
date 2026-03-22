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
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={requestedQuantity}
              onChange={(e) => setRequestedQuantity(e.target.value)}
            />
            <button
              onClick={verifyPurchase}
              disabled={busy}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-emerald-500 disabled:bg-slate-700"
            >
              {busy ? 'Verifying...' : 'Verify'}
            </button>
            {result && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
                {JSON.stringify(result)}
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
