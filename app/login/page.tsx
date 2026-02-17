'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-slate-900/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Zugang zur SGR Verwaltung</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-200">
            <div className="p-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-3 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl outline-none text-slate-900 font-medium focus:bg-blue-50/50 transition-colors"
                placeholder="admin@sgruwertal.de"
              />
            </div>
            <div className="h-px bg-slate-100 mx-4" />
            <div className="p-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-3 mb-1">Passwort</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 rounded-xl outline-none text-slate-900 font-medium focus:bg-blue-50/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Lade...' : <>Einloggen <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 font-medium">
            ← Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}