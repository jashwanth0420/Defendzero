"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, Mail, Lock } from 'lucide-react';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'USER';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await AuthAPI.login({ email, password });
      
      // Store tokens from the nested tokens object
      if (res.tokens) {
        localStorage.setItem('defendzero_token', res.tokens.accessToken);
        localStorage.setItem('defendzero_refreshToken', res.tokens.refreshToken);
        localStorage.setItem('defendzero_role', res.data.role);
        
        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Authentication response missing tokens.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
      <Card className="max-w-md w-full bg-slate-900 border-slate-800 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-slate-800/50 to-transparent p-10 text-center">
          <CardTitle className="text-3xl font-black text-white tracking-tight">Access <span className="text-indigo-400">{role}</span> Portal</CardTitle>
          <CardDescription className="text-slate-400 mt-2">Enter your verified medical credentials.</CardDescription>
        </CardHeader>

        <CardContent className="p-10 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="name@healthcare.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-black py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>AUTHENTICATE</span>}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="text-center">
             <p className="text-slate-500 text-sm">Need a verified account? <a href="#" className="text-indigo-400 hover:underline font-bold transition-all">Request access from your doctor.</a></p>
          </div>
        </CardContent>
      </Card>
      
      <button 
        onClick={() => router.push('/roles')}
        className="mt-8 text-slate-500 hover:text-white transition-colors text-sm font-medium tracking-wide border-b border-transparent hover:border-slate-800"
      >
        ← BACK TO ROLE SELECTION
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginPageContent />
    </Suspense>
  );
}
