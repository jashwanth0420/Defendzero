"use client";

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Stethoscope, UserPlus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DoctorAPI } from '@/lib/api';

type Patient = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isPregnant?: boolean | null;
  trimester?: number | null;
};

const emptyPatientForm = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  isPregnant: false,
  trimester: '' as '' | '1' | '2' | '3',
};

export default function DoctorDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [createForm, setCreateForm] = useState(emptyPatientForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    isPregnant: false,
    trimester: '' as '' | '1' | '2' | '3',
  });

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await DoctorAPI.getPatients();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load patients');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((patient) => {
      const hay = `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.phone || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [patients, query]);

  const handleCreate = async () => {
    if (!createForm.email || !createForm.firstName || !createForm.lastName) return;

    setBusy(true);
    setError(null);
    try {
      await DoctorAPI.addPatient({
        email: createForm.email,
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        phone: createForm.phone || undefined,
        isPregnant: createForm.isPregnant,
        trimester: createForm.isPregnant && createForm.trimester ? Number(createForm.trimester) : null,
      });
      setCreateForm(emptyPatientForm);
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone || '',
      isPregnant: Boolean(patient.isPregnant),
      trimester: patient.trimester ? (String(patient.trimester) as '1' | '2' | '3') : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (patientId: string) => {
    setBusy(true);
    setError(null);
    try {
      await DoctorAPI.updatePatient(patientId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone || undefined,
        isPregnant: editForm.isPregnant,
        trimester: editForm.isPregnant && editForm.trimester ? Number(editForm.trimester) : null,
      });
      setEditingId(null);
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Failed to update patient');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (patientId: string) => {
    setBusy(true);
    setError(null);
    try {
      await DoctorAPI.deletePatient(patientId);
      await loadPatients();
    } catch (err: any) {
      setError(err.message || 'Failed to remove patient');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-indigo-500" />
            Patient Management
          </h1>
          <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
            Dynamic doctor workspace
          </p>
        </div>
        <div className="text-xs text-slate-400 uppercase tracking-widest font-black">
          Total patients: <span className="text-white">{patients.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Add Patient
            </CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Create and link to your directory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="First name"
              value={createForm.firstName}
              onChange={(e) => setCreateForm((s) => ({ ...s, firstName: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Last name"
              value={createForm.lastName}
              onChange={(e) => setCreateForm((s) => ({ ...s, lastName: e.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Phone (optional)"
              value={createForm.phone}
              onChange={(e) => setCreateForm((s) => ({ ...s, phone: e.target.value }))}
            />

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={createForm.isPregnant}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, isPregnant: e.target.checked, trimester: e.target.checked ? s.trimester : '' }))
                }
              />
              Pregnant
            </label>

            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={createForm.trimester}
              onChange={(e) => setCreateForm((s) => ({ ...s, trimester: e.target.value as '' | '1' | '2' | '3' }))}
              disabled={!createForm.isPregnant}
            >
              <option value="">Trimester</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>

            <button
              disabled={busy}
              onClick={handleCreate}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-indigo-500 disabled:bg-slate-700"
            >
              {busy ? 'Saving...' : 'Create Patient'}
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Patient Directory</CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Read, update, and remove linked patients
            </CardDescription>
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Search by name, email, phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500">
                No linked patients found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => {
                  const isEditing = editingId === patient.id;
                  return (
                    <div key={patient.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      {isEditing ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm((s) => ({ ...s, firstName: e.target.value }))}
                          />
                          <input
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm((s) => ({ ...s, lastName: e.target.value }))}
                          />
                          <input
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 md:col-span-2"
                            value={editForm.phone}
                            onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
                            placeholder="Phone"
                          />
                          <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={editForm.isPregnant}
                              onChange={(e) =>
                                setEditForm((s) => ({ ...s, isPregnant: e.target.checked, trimester: e.target.checked ? s.trimester : '' }))
                              }
                            />
                            Pregnant
                          </label>
                          <select
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                            value={editForm.trimester}
                            onChange={(e) => setEditForm((s) => ({ ...s, trimester: e.target.value as '' | '1' | '2' | '3' }))}
                            disabled={!editForm.isPregnant}
                          >
                            <option value="">Trimester</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                          <div className="md:col-span-2 flex gap-2">
                            <button
                              onClick={() => handleSave(patient.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-emerald-500"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold uppercase text-slate-200 hover:bg-slate-600"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-white font-black uppercase tracking-tight">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-xs text-slate-400">{patient.email}</div>
                            <div className="text-xs text-slate-500">
                              {patient.phone || 'No phone'}
                              {patient.isPregnant ? ` • Pregnant${patient.trimester ? ` (T${patient.trimester})` : ''}` : ''}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(patient)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold uppercase text-slate-100 hover:bg-slate-700"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
