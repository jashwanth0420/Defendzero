export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Standardized API client utilizing Fetch
 * Automatically attaches the JWT Bearer token natively if it exists in localStorage
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('defendzero_token') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // 404 on list endpoints should be handled as empty data to prevent UI crashes
      if (response.status === 404) {
        return { success: true, data: [] } as any;
      }

      console.error(`[API Error] ${endpoint}`, data);
      
      // Auto-logout user if JWT expires natively
      if (response.status === 401 || response.status === 403) {
         if (typeof window !== 'undefined') {
            localStorage.removeItem('defendzero_token');
            window.location.href = '/roles';
         }
      }

      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    console.error(`[Network Error] ${endpoint}`, error.message);
    throw error;
  }
}

// ----------------------------------------
// MODULE FACTORIES (Ensuring Independence)
// ----------------------------------------

export const AuthAPI = {
  login: (credentials: any) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: any) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
};

export const SafetyAPI = {
  checkMedicine: (payload: any) => apiFetch('/user/safety/check', { method: 'POST', body: JSON.stringify(payload) }),
};

export const MedicinesAPI = {
  search: (q: string) => apiFetch(`/user/medicines/search?q=${encodeURIComponent(q)}`),
};

export const AdherenceAPI = {
  getSchedules: () => apiFetch<any>('/user/adherence/schedules'),
  createSchedule: (payload: any) => apiFetch('/user/adherence/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  markTaken: (scheduleId: string) => apiFetch(`/user/adherence/schedules/${scheduleId}/logs`, { 
    method: 'POST', 
    body: JSON.stringify({ status: 'TAKEN' }) 
  }),
};

export const PharmacyAPI = {
  generateToken: (payload: any) => apiFetch('/doctor/pharmacy-tokens/generate', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPurchase: (payload: any) => apiFetch('/pharmacy/process-purchase', { method: 'POST', body: JSON.stringify(payload) }),
  getAll: () => apiFetch('/pharmacy'),
};

export const DoctorAPI = {
  getPatients: () => apiFetch('/doctor/patients'),
  addPatient: (data: any) => apiFetch('/doctor/patients', { method: 'POST', body: JSON.stringify(data) }),
  createPrescription: (data: any) => apiFetch('/doctor/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
};

export const GuardianAPI = {
  getPatients: () => apiFetch('/guardian/patients'),
  addPatient: (data: any) => apiFetch('/guardian/add-patient', { method: 'POST', body: JSON.stringify(data) }),
  getMyGuardians: () => apiFetch('/user/guardians'),
};

