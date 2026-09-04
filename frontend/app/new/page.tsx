"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, ChevronRight, Info, Shield, Table
} from 'lucide-react';
import { uploadFiles, checkReadiness, startReconciliation } from '@/lib/api';
import { clsx } from 'clsx';

function NewReconciliationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get('runId');
  const isDemo = searchParams.get('isDemo') === 'true';

  const [step, setStep] = useState(1);
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [runId, setRunId] = useState<number | null>(initialRunId ? Number(initialRunId) : null);
  const [bankMapping, setBankMapping] = useState({ amount: 'amount', date: 'date', description: 'desc' });
  const [ledgerMapping, setLedgerMapping] = useState({ amount: 'amount', date: 'date', description: 'desc' });

  const [readiness, setReadiness] = useState<any>(null);

  // If we came from Demo, skip to Step 3
  useEffect(() => {
    if (isDemo && runId) {
      setStep(3);
      performReadinessCheck(runId, bankMapping, ledgerMapping);
    }
  }, [isDemo, runId]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankFile || !ledgerFile) return;

    setLoading(true);
    setError(null);
    try {
      const res = await uploadFiles(bankFile, ledgerFile);
      setRunId(res.run_id);
      // Use standard mappings initially
      performReadinessCheck(res.run_id, bankMapping, ledgerMapping);
      setStep(3);
    } catch (err: any) {
      setError("Failed to process files. Ensure they are valid CSVs.");
    } finally {
      setLoading(false);
    }
  };

  const performReadinessCheck = async (id: number, bMap: any, lMap: any) => {
    setLoading(true);
    try {
      const res = await checkReadiness(id, bMap, lMap);
      setReadiness(res);
    } catch (err) {
      setError("Readiness check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      await startReconciliation(runId, bankMapping, ledgerMapping);
      router.push(`/dashboard?runId=${runId}`);
    } catch (err) {
      setError("Reconciliation failed. Please check your data structure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="border-b border-gray-100 bg-white py-4 px-8 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">F</div>
          <span className="font-bold tracking-tight text-sm uppercase">Reconciliation Control</span>
        </div>
        <div className="flex items-center space-x-8">
           <StepIndicator current={step} />
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center space-y-2">
                 <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Upload Financial Sources</h1>
                 <p className="text-gray-500 font-medium italic">Begin by providing your bank statement and internal ledger CSVs.</p>
               </div>

               <form onSubmit={handleFileUpload} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <UploadZone
                    label="Bank Statement"
                    file={bankFile}
                    onChange={setBankFile}
                    icon={<Shield className="w-6 h-6 text-finance-accent" />}
                   />
                   <UploadZone
                    label="Internal Ledger"
                    file={ledgerFile}
                    onChange={setLedgerFile}
                    icon={<Table className="w-6 h-6 text-purple-500" />}
                   />
                 </div>

                 {error && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center">
                     <AlertTriangle className="w-4 h-4 mr-3" />
                     {error}
                   </div>
                 )}

                 <button
                  type="submit"
                  disabled={!bankFile || !ledgerFile || loading}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all flex items-center justify-center shadow-xl shadow-black/10 disabled:opacity-30"
                 >
                   {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Check Data Readiness <ArrowRight className="w-4 h-4 ml-3" /></>}
                 </button>
               </form>
            </div>
          )}

          {step === 3 && readiness && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center space-y-2">
                 <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Data Readiness Analysis</h1>
                 <p className="text-gray-500 font-medium italic">Verification of structural integrity and financial constraints.</p>
               </div>

               <div className="grid grid-cols-1 gap-6">
                 <ReadinessCard
                   title="Bank Integrity"
                   data={readiness.bank}
                   mapping={bankMapping}
                   setMapping={setBankMapping}
                   onUpdate={(m: any) => performReadinessCheck(runId!, m, ledgerMapping)}
                 />
                 <ReadinessCard
                   title="Ledger Integrity"
                   data={readiness.ledger}
                   mapping={ledgerMapping}
                   setMapping={setLedgerMapping}
                   onUpdate={(m: any) => performReadinessCheck(runId!, bankMapping, m)}
                 />
               </div>

               <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                     <div className={clsx("p-3 rounded-xl", readiness.overlap.status === 'PASS' ? 'bg-green-50' : 'bg-orange-50')}>
                        {readiness.overlap.status === 'PASS' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-orange-600" />}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cross-Source Validation</p>
                        <p className="text-sm font-bold text-gray-900">{readiness.overlap.message}</p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-4">
                  <button onClick={() => setStep(1)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black">Change Files</button>
                  <button
                    disabled={readiness.status === 'ACTION_REQUIRED' || loading}
                    onClick={handleReconcile}
                    className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all flex items-center shadow-xl shadow-black/10 disabled:opacity-30"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Start Reconciliation <ArrowRight className="w-4 h-4 ml-3" /></>}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function UploadZone({ label, file, onChange, icon }: any) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</p>
      <label className={clsx(
        "flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all bg-white group",
        file ? 'border-green-500 bg-green-50/10' : 'border-gray-200 hover:border-black'
      )}>
        <input type="file" className="hidden" accept=".csv" onChange={(e) => onChange(e.target.files?.[0])} />
        {file ? (
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
            <p className="text-sm font-black text-gray-900 truncate max-w-[180px]">{file.name}</p>
          </div>
        ) : (
          <div className="text-center space-y-4 px-6">
            <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors flex items-center justify-center mx-auto">
               {icon}
            </div>
            <div>
               <p className="text-xs font-black text-gray-900 uppercase">Click to browse</p>
               <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Supported: .CSV</p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}

function ReadinessCard({ title, data, mapping, setMapping, onUpdate }: any) {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
       <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">{title}</h3>
          <span className={clsx(
            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border",
            data.status === 'READY' ? 'bg-green-50 text-green-600 border-green-100' :
            data.status === 'READY_WITH_WARNINGS' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-red-50 text-red-600 border-red-100'
          )}>
            {data.status.replace(/_/g, ' ')}
          </span>
       </div>
       <div className="p-8 space-y-6">
          <div className="grid grid-cols-3 gap-6">
             <StatMini label="Rows" value={data.stats.row_count} />
             <StatMini label="Value" value={`₹${data.stats.total_amount.toLocaleString('en-IN')}`} />
             <StatMini label="Window" value={data.stats.date_range} />
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Health Checks</p>
             {data.checks.map((c: any, i: number) => (
                <div key={i} className="flex items-center text-xs font-bold text-gray-700">
                   {c.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-3" /> : <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mr-3" />}
                   {c.message}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

function StatMini({ label, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-gray-900 truncate">{value}</p>
    </div>
  );
}

function StepIndicator({ current }: any) {
  return (
    <div className="flex items-center space-x-4">
       <Step num={1} label="Upload" active={current >= 1} />
       <div className="w-4 h-px bg-gray-200" />
       <Step num={2} label="Analyze" active={current >= 3} />
       <div className="w-4 h-px bg-gray-200" />
       <Step num={3} label="Process" active={false} />
    </div>
  );
}

function Step({ num, label, active }: any) {
  return (
    <div className={clsx("flex items-center space-x-2 transition-opacity", active ? 'opacity-100' : 'opacity-40')}>
       <div className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center">{num}</div>
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function NewReconciliation() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Booting Control...</div>}>
      <NewReconciliationContent />
    </Suspense>
  );
}
