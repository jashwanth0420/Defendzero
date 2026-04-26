export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
export const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_PUBLIC_API_URL || 'http://localhost:5000/api';
export const MEDICINE_SEARCH_API_URL = process.env.NEXT_PUBLIC_MEDICINE_SEARCH_API_URL;
export const MEDICINE_SEARCH_QUERY_PARAM = process.env.NEXT_PUBLIC_MEDICINE_SEARCH_QUERY_PARAM || 'q';

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

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { success: false, error: 'Unexpected response from server' };
    }

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

      throw new Error(data.error || data.message || `API Error (${response.status})`);
    }

    return data;
  } catch (error: any) {
    console.error(`[Network Error] ${endpoint}`, error.message);
    throw error;
  }
}

export async function publicApiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  try {
    const response = await fetch(`${PUBLIC_API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[Public API Error] ${endpoint}`, data);
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data;
  } catch (error: any) {
    console.error(`[Public Network Error] ${endpoint}`, error.message);
    throw error;
  }
}

export async function externalApiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[External API Error]', { url, data });
      throw new Error(data.error || data.message || 'External API request failed');
    }

    return data;
  } catch (error: any) {
    console.error('[External Network Error]', { url, message: error.message });
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
  checkMedicineSafety: async (payload: any) => {
    try {
      return await apiFetch('/user/safety/verify', { method: 'POST', body: JSON.stringify(payload) });
    } catch {
      return publicApiFetch('/safety-check', { method: 'POST', body: JSON.stringify(payload) });
    }
  },
  checkN8nWebhook: (payload: any) => apiFetch<any>('/user/safety/webhook', { method: 'POST', body: JSON.stringify(payload) }),
};

export const MedicinesAPI = {
  search: (q: string) => {
    if (!MEDICINE_SEARCH_API_URL) {
      throw new Error('NEXT_PUBLIC_MEDICINE_SEARCH_API_URL is not configured.');
    }

    const separator = MEDICINE_SEARCH_API_URL.includes('?') ? '&' : '?';
    const url = `${MEDICINE_SEARCH_API_URL}${separator}${encodeURIComponent(MEDICINE_SEARCH_QUERY_PARAM)}=${encodeURIComponent(q)}`;
    return externalApiFetch<any>(url);
  },
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
  getTokenDetails: (token: string) => apiFetch(`/pharmacy/purchase-tokens/${token}`),
  validateHexToken: (payload: any) => apiFetch('/pharmacy/purchase-tokens/validate', { method: 'POST', body: JSON.stringify(payload) }),
  getAll: () => apiFetch('/pharmacy'),
};

export const DoctorAPI = {
  getPatients: () => apiFetch('/doctor/patients'),
  addPatient: (data: any) => apiFetch('/doctor/patients', { method: 'POST', body: JSON.stringify(data) }),
  updatePatient: (patientId: string, data: any) =>
    apiFetch(`/doctor/patients/${patientId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (patientId: string) => apiFetch(`/doctor/patients/${patientId}`, { method: 'DELETE' }),
  createPrescription: (data: any) => apiFetch('/doctor/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
};

export const MessagesAPI = {
  list: () => apiFetch('/user/messages/messages'),
  send: (payload: any) => apiFetch('/user/messages/messages', { method: 'POST', body: JSON.stringify(payload) }),
};

export const GuardianAPI = {
  getPatients: () => apiFetch('/guardian/patients'),
  getPatientDetails: (id: string) => apiFetch(`/guardian/patients/${id}/details`),
  addPatient: (data: any) => apiFetch('/guardian/add-patient', { method: 'POST', body: JSON.stringify(data) }),
  getMyGuardians: () => apiFetch('/user/guardians'),
};

export const MedicationAPI = {
  createSchedule: (payload: any) => apiFetch('/user/medication/schedules', { method: 'POST', body: JSON.stringify(payload) }),
  getSchedules: () => apiFetch('/user/medication/schedules'),
  getPrescriptions: () => apiFetch('/user/medication/prescriptions'),
  logDose: (payload: any) => apiFetch('/user/medication/log', { method: 'POST', body: JSON.stringify(payload) }),
  getLogs: (date?: string) => apiFetch(`/user/medication/logs${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  getHistory: () => apiFetch('/user/medication/history'),
  uploadPrescription: (payload: any) => apiFetch('/user/medication/prescriptions/upload', { method: 'POST', body: JSON.stringify(payload) }),
  confirmPrescription: (prescriptionId: string, medicines: any[]) =>
    apiFetch(`/user/medication/prescriptions/${prescriptionId}/confirm`, { method: 'POST', body: JSON.stringify({ medicines }) }),
  generatePurchaseToken: (payload: any) => apiFetch('/user/medication/purchase/token', { method: 'POST', body: JSON.stringify(payload) }),
  validatePurchase: (payload: any) => apiFetch('/user/medication/purchase/validate', { method: 'POST', body: JSON.stringify(payload) }),
  getPurchases: () => apiFetch('/user/medication/purchases'),
  getNotifications: () => apiFetch('/user/medication/notifications'),
  markNotificationRead: (notificationId: string) => apiFetch(`/user/medication/notifications/${notificationId}/read`, { method: 'PATCH' }),
};

