"use client";

import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DoctorAPI } from '@/lib/api';

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function DoctorPrescriptionsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const [patientId, setPatientId] = useState('');
  const [medicineId, setMedicineId] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('DAILY');
  const [timeOfDay, setTimeOfDay] = useState('08:00');

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await DoctorAPI.getPatients();
      const next = Array.isArray(res.data) ? res.data : [];
      setPatients(next);
      if (next.length > 0 && !patientId) {
        setPatientId(next[0].id);
      }
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

  const createPrescription = async () => {
    if (!patientId || !medicineId) return;
    setBusy(true);
    setError(null);
    setResponseText('');
    try {
      const res = await DoctorAPI.createPrescription({
        patientId,
        medicines: [
          {
            medicineId,
            dosage,
            frequency,
            timeOfDay,
          },
        ],
      });
      setResponseText(JSON.stringify(res, null, 2));
      setMedicineId('');
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-500" />
          Prescriptions
        </h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
          Dynamic prescription creation
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Create Prescription</CardTitle>
          <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            Uses backend endpoint /doctor/prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.email})
                  </option>
                ))}
              </select>

              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                placeholder="Medicine UUID"
              />

              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Dosage"
              />

              <select
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
              </select>

              <input
                type="time"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
              />

              <button
                onClick={createPrescription}
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-indigo-500 disabled:bg-slate-700"
              >
                {busy ? 'Submitting...' : 'Create Prescription'}
              </button>
            </div>
          )}

          {responseText && (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
              {responseText}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
