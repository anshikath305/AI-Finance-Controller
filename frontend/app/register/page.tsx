"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { Shield, Loader2, ArrowRight, AlertCircle, Fingerprint, Layers } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    organization_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(formData);
      router.push('/login');
    } catch (err) {
      setError("Registration failed. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 selection:bg-black selection:text-white">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-4">
           <div className="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-black/20" onClick={() => router.push('/')}>
              <Layers className="w-8 h-8 text-blue-400" />
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Control Center</h1>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">Initialize Operational Context</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-black/[0.02] space-y-10">
           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Operator Name</p>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={formData.display_name}
                      onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Workplace Identifier</p>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={formData.organization_name}
                      onChange={(e) => setFormData({...formData, organization_name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Auth Identifier</p>
                    <input
                      type="email"
                      required
                      placeholder="Operator Email"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Security Token</p>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black outline-none transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Provision Workspace <ArrowRight className="w-4 h-4 ml-3" /></>}
              </button>
           </form>

           <div className="pt-8 border-t border-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 Authorized already? <Link href="/login" className="text-finance-accent hover:underline">Access Console</Link>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
