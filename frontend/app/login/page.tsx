"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { Shield, Loader2, ArrowRight, AlertCircle, Fingerprint } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/operations');
    } catch (err) {
      setError("Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 selection:bg-black selection:text-white">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-black/20 group hover:scale-110 transition-transform cursor-pointer" onClick={() => router.push('/')}>
              <Fingerprint className="w-8 h-8" />
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Finance Control</h1>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Authorization Required</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-black/[0.02] space-y-10">
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Identifier</p>
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Credential</p>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                 </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-black uppercase tracking-widest flex items-center">
                   <AlertCircle className="w-4 h-4 mr-3 shrink-0" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-2xl shadow-black/20"
              >
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Access Console <ArrowRight className="w-4 h-4 ml-3" /></>}
              </button>
           </form>

           <div className="pt-8 border-t border-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 New operator? <Link href="/register" className="text-finance-accent hover:underline">Register Workspace</Link>
              </p>
           </div>
        </div>

        <div className="text-center opacity-30">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Audit Persistence Active</p>
        </div>
      </div>
    </div>
  );
}
