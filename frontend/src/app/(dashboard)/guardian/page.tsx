"use client";

import { useEffect, useState } from 'react';
import { Loader2, ShieldPlus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GuardianAPI } from '@/lib/api';

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

export default function GuardianDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await GuardianAPI.getPatients();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setPatients([]);
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const addPatient = async () => {
    if (!patientId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await GuardianAPI.addPatient({ patientId: patientId.trim() });
      setPatientId('');
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <ShieldPlus className="w-8 h-8 text-indigo-500" />
          Guardian Monitor
        </h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
          Dynamic patient monitoring
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Link Patient
            </CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Add by patient UUID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
            />
            <button
              onClick={addPatient}
              disabled={busy}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-indigo-500 disabled:bg-slate-700"
            >
              {busy ? 'Linking...' : 'Link Patient'}
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Linked Patients</CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Real-time data from guardian API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : patients.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500">
                No linked patients found.
              </div>
            ) : (
              <div className="space-y-3">
                {patients.map((patient) => (
                  <div key={patient.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="text-white font-black uppercase tracking-tight">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-xs text-slate-400">{patient.email}</div>
                    <div className="text-xs text-slate-500">{patient.phone || 'No phone available'}</div>
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
