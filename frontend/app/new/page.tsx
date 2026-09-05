"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload, FileText, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, ChevronRight, Info, Shield, Table,
  Activity, Layers, Fingerprint, Settings, Sparkles
} from 'lucide-react';
import { uploadFiles, checkReadiness, startReconciliation } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
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
  const [bankMapping, setBankMapping] = useState({ amount: 'amount', date: 'date', description: 'desc', id: 'id' });
  const [ledgerMapping, setLedgerMapping] = useState({ amount: 'amount', date: 'date', description: 'desc', id: 'id' });
  const [availableColumns, setAvailableColumns] = useState<{bank: string[], ledger: string[]}>({bank: [], ledger: []});

  const [profile, setProfile] = useState({
    profile_name: 'STANDARD',
    date_tolerance: 3,
    amount_tolerance: 0.01,
    match_threshold: 0.85,
    currency: 'INR',
    source_type: 'Bank Statement'
  });
  const [readiness, setReadiness] = useState<any>(null);

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
      setAvailableColumns({ bank: res.bank_columns, ledger: res.ledger_columns });

      // Update mappings if backend detected them (we'll assume defaults for now or extend API)
      performReadinessCheck(res.run_id, bankMapping, ledgerMapping);
      setStep(3);
    } catch (err: any) {
      setError("Synchronization failure. Source files rejected by security gateway.");
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
      setError("Readiness analysis failed. Context could not be synthesized.");
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      await startReconciliation(runId, bankMapping, ledgerMapping, profile);
      router.push(`/dashboard?runId=${runId}`);
    } catch (err) {
      setError("Execution failure. Forensic alignment cycle disrupted.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col selection:bg-black selection:text-white">
      <nav className="border-b border-gray-100 bg-white py-6 px-10 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-10 cursor-pointer" onClick={() => router.push('/')}>
          <div className="flex items-center space-x-3 group">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">F</div>
             <span className="font-black tracking-tighter text-lg uppercase italic">Initiation Protocol</span>
          </div>
          <div className="h-4 w-px bg-gray-200" />
          <StepIndicator current={step} />
        </div>
        <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-100 shadow-sm italic">
           <Shield className="w-3.5 h-3.5" />
           <span>Encrypted Audit Stream</span>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <div className="max-w-4xl w-full">
          {step === 1 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
               <div className="text-center space-y-4">
                 <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase italic">Mount Financial Sources</h1>
                 <p className="text-lg font-medium text-gray-500 italic max-w-md mx-auto leading-relaxed">Provide your authoritative Bank and Ledger CSVs to begin forensic reconciliation.</p>
               </div>

               <form onSubmit={handleFileUpload} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <UploadZone
                    label="Bank Authority Statement"
                    file={bankFile}
                    onChange={setBankFile}
                    icon={<Shield className="w-10 h-10 text-finance-accent" />}
                   />
                   <UploadZone
                    label="Internal Entity Ledger"
                    file={ledgerFile}
                    onChange={setLedgerFile}
                    icon={<Table className="w-10 h-10 text-purple-600" />}
                   />
                 </div>

                 {error && (
                   <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-700 text-sm font-black uppercase tracking-widest flex items-center shadow-xl shadow-red-100/30 animate-in zoom-in duration-300">
                     <AlertTriangle className="w-5 h-5 mr-4 animate-bounce" />
                     {error}
                   </div>
                 )}

                 <button
                  type="submit"
                  disabled={!bankFile || !ledgerFile || loading}
                  className="w-full py-8 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] disabled:opacity-20"
                 >
                   {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Execute Data Mounting <ArrowRight className="w-5 h-5 ml-4" /></>}
                 </button>
               </form>
            </div>
          )}

          {step === 3 && readiness && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
               <div className="text-center space-y-4">
                 <h1 className="text-6xl font-black text-gray-900 tracking-tighter uppercase italic">Integrity Verification</h1>
                 <p className="text-lg font-medium text-gray-500 italic max-w-md mx-auto leading-relaxed">System-level analysis of structural constraints and financial overlaps.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <ReadinessCard
                   title="Bank Artifact Analysis"
                   data={readiness.bank}
                   mapping={bankMapping}
                   columns={availableColumns.bank}
                   onMappingChange={(m: any) => {
                      const newMap = { ...bankMapping, ...m };
                      setBankMapping(newMap);
                      performReadinessCheck(runId!, newMap, ledgerMapping);
                   }}
                 />
                 <ReadinessCard
                   title="Ledger Entity Analysis"
                   data={readiness.ledger}
                   mapping={ledgerMapping}
                   columns={availableColumns.ledger}
                   onMappingChange={(m: any) => {
                      const newMap = { ...ledgerMapping, ...m };
                      setLedgerMapping(newMap);
                      performReadinessCheck(runId!, bankMapping, newMap);
                   }}
                 />
               </div>

               {/* Configuration Profile */}
               <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm space-y-10">
                  <div className="flex items-center space-x-3">
                     <Settings className="w-5 h-5 text-gray-400" />
                     <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Engine Parameters</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <ConfigInput
                        label="Date Tolerance"
                        value={profile.date_tolerance}
                        onChange={(v: number) => setProfile({...profile, profile_name: 'CUSTOM', date_tolerance: v})}
                        unit="Days"
                        min={0} max={10}
                     />
                     <ConfigInput
                        label="Amount Tolerance"
                        value={profile.amount_tolerance}
                        onChange={(v: number) => setProfile({...profile, profile_name: 'CUSTOM', amount_tolerance: v})}
                        unit="INR"
                        step={0.01}
                     />
                     <ConfigInput
                        label="Match Threshold"
                        value={profile.match_threshold}
                        onChange={(v: number) => setProfile({...profile, profile_name: 'CUSTOM', match_threshold: v})}
                        unit="Score"
                        min={0.6} max={1.0} step={0.05}
                     />
                     <div className="space-y-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Calibration Profile</p>
                        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 h-[56px]">
                           <ProfileTab
                            label="STRICT"
                            active={profile.profile_name === 'STRICT'}
                            onClick={() => setProfile({...profile, profile_name: 'STRICT', date_tolerance: 1, amount_tolerance: 0.0, match_threshold: 0.95, currency: profile.currency, source_type: profile.source_type})}
                           />
                           <ProfileTab
                            label="STANDARD"
                            active={profile.profile_name === 'STANDARD'}
                            onClick={() => setProfile({...profile, profile_name: 'STANDARD', date_tolerance: 3, amount_tolerance: 0.01, match_threshold: 0.85, currency: profile.currency, source_type: profile.source_type})}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-50">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Operational Currency</p>
                        <select
                           value={profile.currency}
                           onChange={(e) => setProfile({...profile, currency: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:border-black transition-all shadow-sm"
                        >
                           <option value="INR">INR (₹) - Indian Rupee</option>
                           <option value="USD">USD ($) - US Dollar</option>
                           <option value="EUR">EUR (€) - Euro</option>
                           <option value="GBP">GBP (£) - British Pound</option>
                        </select>
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Source Entity Type</p>
                        <select
                           value={profile.source_type}
                           onChange={(e) => setProfile({...profile, source_type: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-700 outline-none focus:border-black transition-all shadow-sm"
                        >
                           <option value="Bank Statement">Bank Statement</option>
                           <option value="Payment Gateway">Payment Gateway</option>
                           <option value="Merchant Ledger">Internal Ledger</option>
                           <option value="Other">Other Analytical Source</option>
                        </select>
                     </div>
                  </div>

                  <div className="bg-blue-50/30 p-8 rounded-[2rem] border border-blue-100/50 space-y-6">
                     <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Financial Safety Rules — Always Active</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                        <SafetyRule label="Amount mismatches are never automatically reconciled" />
                        <SafetyRule label="Transactions can only be matched once" />
                        <SafetyRule label="Uncertain cases go to human review" />
                        <SafetyRule label="Every decision is auditable" />
                     </div>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-gray-200 shadow-sm flex items-center justify-between group hover:border-black transition-all">
                  <div className="flex items-center space-x-8">
                     <div className={clsx(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all",
                        readiness.overlap.status === 'PASS' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                     )}>
                        {readiness.overlap.status === 'PASS' ? <CheckCircle2 className="w-8 h-8 text-green-600" /> : <AlertTriangle className="w-8 h-8 text-orange-600 shadow-sm" />}
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Temporal Alignment Trace</p>
                        <p className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">{readiness.overlap.message}</p>
                     </div>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-8">
                  <button onClick={() => setStep(1)} className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] hover:text-black transition-colors">Discard Context</button>
                  <button
                    disabled={readiness.status === 'ACTION_REQUIRED' || loading}
                    onClick={handleReconcile}
                    className="px-12 py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.05] transition-all flex items-center shadow-2xl shadow-black/20 disabled:opacity-20"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <>Initiate Reconciliation <Fingerprint className="w-5 h-5 ml-4 text-finance-accent" /></>}
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
    <div className="space-y-4">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4">{label}</p>
      <label className={clsx(
        "flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-[3.5rem] cursor-pointer transition-all bg-white group shadow-sm",
        file ? 'border-green-500 bg-green-50/10 shadow-xl shadow-green-500/5' : 'border-gray-100 hover:border-black hover:shadow-2xl hover:shadow-black/5'
      )}>
        <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => onChange(e.target.files?.[0])} />
        {file ? (
          <div className="text-center space-y-4 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div className="space-y-1">
               <p className="text-sm font-black text-gray-900 truncate max-w-[220px] px-4">{file.name}</p>
               <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Target Locked</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 px-10">
            <div className="p-6 bg-gray-50 rounded-3xl group-hover:bg-black group-hover:text-white group-hover:rotate-12 transition-all flex items-center justify-center mx-auto shadow-sm">
               {icon}
            </div>
            <div>
               <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Synchronize Data</p>
               <p className="text-[10px] text-gray-300 font-bold uppercase mt-2 tracking-widest">Protocol: CSV / EXCEL</p>
            </div>
          </div>
        )}
      </label>
    </div>
  );
}

function ReadinessCard({ title, data, mapping, onMappingChange, columns }: any) {
  return (
    <div className="bg-white rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden group hover:border-black transition-all">
       <div className="px-10 py-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
             <Layers className="w-4 h-4 text-gray-400" />
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">{title}</h3>
          </div>
          <span className={clsx(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
            data.status === 'READY' ? 'bg-green-50 text-green-700 border-green-100' :
            data.status === 'READY_WITH_WARNINGS' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-red-50 text-red-600 border-red-100'
          )}>
            {data.status.replace(/_/g, ' ')}
          </span>
       </div>
       <div className="p-10 space-y-10">
          <div className="grid grid-cols-3 gap-10">
             <StatMini label="Payload Count" value={formatNumber(data.stats.row_count)} />
             <StatMini label="Gross Magnitude" value={formatCurrency(data.stats.total_amount)} />
             <StatMini label="Temporal Window" value={data.stats.date_range} />
          </div>

          <div className="space-y-6">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Column Authorization</p>
             <div className="grid grid-cols-2 gap-4">
                <MappingSelect label="Amount" value={mapping.amount} options={columns} onChange={(v) => onMappingChange({amount: v})} />
                <MappingSelect label="Date" value={mapping.date} options={columns} onChange={(v) => onMappingChange({date: v})} />
                <MappingSelect label="Description" value={mapping.description} options={columns} onChange={(v) => onMappingChange({description: v})} />
                <MappingSelect label="Identifier (Opt)" value={mapping.id} options={columns} onChange={(v) => onMappingChange({id: v})} />
             </div>
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Health Trace Results</p>
             <div className="space-y-3">
               {data.checks.map((c: any, i: number) => (
                  <div key={i} className="flex items-start text-[11px] font-bold text-gray-600 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                     {c.status === 'PASS' ? <CheckCircle2 className="w-4 h-4 text-green-500 mr-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 mr-4 shrink-0 shadow-sm" />}
                     {c.message}
                  </div>
               ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function MappingSelect({ label, value, options, onChange }: any) {
   return (
      <div className="space-y-2">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</p>
         <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold text-gray-700 outline-none focus:border-black transition-all cursor-pointer"
         >
            <option value="">Unmapped</option>
            {options.map((opt: string) => (
               <option key={opt} value={opt}>{opt}</option>
            ))}
         </select>
      </div>
   );
}

function ConfigInput({ label, value, onChange, unit, min, max, step = 1 }: any) {
   return (
      <div className="space-y-3">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
         <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <input
               type="number"
               value={value}
               onChange={(e) => onChange(Number(e.target.value))}
               min={min} max={max} step={step}
               className="bg-transparent border-none outline-none text-sm font-black w-20 tabular-nums"
            />
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{unit}</span>
         </div>
      </div>
   );
}

function ProfileTab({ label, active, onClick }: any) {
   return (
      <button
         onClick={onClick}
         className={clsx(
            "flex-1 py-2 text-[9px] font-black rounded-xl transition-all",
            active ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
         )}
      >
         {label}
      </button>
   );
}

function StatMini({ label, value }: any) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">{label}</p>
      <p className="text-xl font-black text-gray-900 truncate tracking-tight uppercase italic">{value}</p>
    </div>
  );
}

function SafetyRule({ label }: { label: string }) {
  return (
    <div className="flex items-center space-x-3">
       <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
       <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{label}</span>
    </div>
  );
}

function StepIndicator({ current }: any) {
  return (
    <div className="flex items-center space-x-6">
       <Step num={1} label="Context Ingestion" active={current >= 1} />
       <div className="w-6 h-px bg-gray-100" />
       <Step num={2} label="Readiness Audit" active={current >= 3} />
       <div className="w-6 h-px bg-gray-100" />
       <Step num={3} label="Engine Execution" active={false} />
    </div>
  );
}

function Step({ num, label, active }: any) {
  return (
    <div className={clsx("flex items-center space-x-3 transition-all duration-500", active ? 'opacity-100' : 'opacity-20')}>
       <div className={clsx(
          "w-6 h-6 rounded-lg font-black text-[10px] flex items-center justify-center shadow-sm",
          active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
       )}>{num}</div>
       <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
    </div>
  );
}

export default function NewReconciliation() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Controller Context...</div>}>
      <NewReconciliationContent />
    </Suspense>
  );
}
