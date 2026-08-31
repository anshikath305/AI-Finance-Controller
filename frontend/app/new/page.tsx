"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle2, ArrowRight, AlertCircle, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadFiles, startReconciliation } from '@/lib/api';

export default function NewReconciliation() {
  const router = useRouter();
  const [bankFile, setBankFile] = useState<File | null>(null);
  const [ledgerFile, setLedgerFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleStart = async () => {
    if (!bankFile || !ledgerFile) return;

    setIsProcessing(true);
    setError(null);
    setStatus('Uploading files...');

    try {
      const uploadData = await uploadFiles(bankFile, ledgerFile);
      const runId = uploadData.run_id;

      setStatus('Running reconciliation engine...');
      await startReconciliation(runId);

      setStatus('Finalizing results...');
      router.push(`/dashboard?runId=${runId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during reconciliation');
      setIsProcessing(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-finance-primary">
      {/* Header */}
      <header className="border-b border-gray-100 py-6 px-8 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold tracking-tight uppercase">New Reconciliation</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-20">
        <div className="mb-12">
          <h2 className="text-3xl font-black tracking-tight mb-2 text-gray-900">Configure Run</h2>
          <p className="text-gray-500 font-medium">Upload Bank and Ledger statements to begin the automated matching process.</p>
        </div>

        {error && (
          <div className="mb-10 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start text-red-700">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
            <div>
              <p className="text-sm font-bold uppercase tracking-tight mb-1">Upload Failed</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-12">
          <FileUploadZone
            label="Bank Statement (CSV)"
            step="1"
            file={bankFile}
            setFile={setBankFile}
            description="Required columns: Date, Description, Amount"
          />

          <FileUploadZone
            label="Internal Ledger (CSV)"
            step="2"
            file={ledgerFile}
            setFile={setLedgerFile}
            description="Required columns: Date, Description, Amount"
          />

          <div className="pt-8 border-t border-gray-100">
            <button
              disabled={!bankFile || !ledgerFile || isProcessing}
              onClick={handleStart}
              className={`w-full py-5 rounded-2xl font-bold text-white transition-all flex items-center justify-center shadow-2xl shadow-black/10 ${
                !bankFile || !ledgerFile || isProcessing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-black hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin w-5 h-5 mr-3" />
                  <span className="uppercase tracking-widest text-xs font-black">{status}</span>
                </div>
              ) : (
                <>
                  <span className="uppercase tracking-widest text-xs font-black">Start Reconciliation</span>
                  <ArrowRight className="w-4 h-4 ml-3" />
                </>
              )}
            </button>
            <p className="mt-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              By starting, you agree to treat this as a draft reconciliation for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileUploadZone({ label, step, file, setFile, description }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] flex items-center justify-center mr-3 font-black">{step}</span>
          {label}
        </h3>
        {file && <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">Ready</span>}
      </div>
      <div className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all group ${
        file ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-black hover:bg-gray-50/50'
      }`}>
        {file ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{file.name}</p>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={() => setFile(null)}
              className="mt-6 px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
            >
              Remove File
            </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white transition-colors shadow-sm">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1 tracking-tight uppercase tracking-widest">Select CSV File</p>
            <p className="text-xs text-gray-400 font-medium">{description}</p>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        )}
      </div>
    </div>
  );
}
