"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, ShieldCheck, Activity, Search, AlertCircle, FileText, ChevronRight, Brain } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { clsx } from 'clsx';

interface CopilotProps {
  runId?: number;
  metrics?: any;
}

const Copilot: React.FC<CopilotProps> = ({ runId, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Strategic Copilot active. I am grounded strictly in your current reconciliation data. How can I assist your investigation?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (overrideText?: string) => {
    const userMessage = overrideText || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/copilot/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          context: { runId, metrics }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          facts: data.facts,
          intent: data.intent
        }]);
      } else {
        throw new Error("Grounded Query Failure");
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Operational interruption. Ensure backend synchronization is active."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 bg-black text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group border-8 border-white"
      >
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-finance-accent rounded-full border-4 border-white shadow-sm animate-pulse" />
        <Brain className="w-8 h-8 group-hover:rotate-12 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-10 right-10 w-[460px] h-[740px] bg-white rounded-[3rem] border border-gray-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8 duration-500">
      <header className="bg-black text-white px-10 py-8 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none rotate-12">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <div className="flex items-center space-x-5 relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-xl">
            <Activity className="w-6 h-6 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
          </div>
          <div>
            <span className="block font-black text-lg tracking-tighter uppercase italic">Grounded Copilot</span>
            <span className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1 italic">Analytical Override Active</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white relative z-10">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-gray-50/20 custom-scrollbar">
        {messages.map((m: any, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={clsx(
                "px-6 py-5 rounded-[1.75rem] text-sm leading-relaxed shadow-sm",
                m.role === 'user'
                  ? 'bg-black text-white rounded-tr-none font-bold tracking-tight'
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 font-medium italic'
              )}>
                {m.content}
              </div>

              {/* Data Visualization Payloads */}
              {m.facts && m.intent === 'HIGH_VALUE_UNRESOLVED' && (
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-xl shadow-black/[0.02] space-y-6">
                  <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-2">
                    <Target className="w-3.5 h-3.5 text-red-500" />
                    <span>Prioritized Exposure</span>
                  </div>
                  <div className="space-y-3">
                    {m.facts.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl transition-all group cursor-pointer border border-transparent">
                        <div className="flex-1 min-w-0 mr-6">
                          <p className="text-xs font-black truncate uppercase tracking-tighter italic">{f.description}</p>
                          <p className="text-[9px] font-bold opacity-40 mt-1 tracking-widest">{f.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black tabular-nums">{formatCurrency(f.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.facts && m.intent === 'EXCEPTION_SUMMARY' && (
                <div className="grid grid-cols-2 gap-4">
                  {m.facts.map((f: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm text-center space-y-2 group hover:border-black transition-all cursor-default">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-black">{f.type.replace('_', ' ')}</p>
                      <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter italic">{f.count}</p>
                    </div>
                  ))}
                </div>
              )}

              {m.facts && m.intent === 'INVESTIGATION' && m.facts.bank_tx && (
                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-2xl shadow-black/[0.03]">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Decision Trace</span>
                    <StatusBadge status={m.facts.status} />
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Confidence calibration</span>
                      <span className="font-black text-finance-accent text-2xl tabular-nums italic">{(m.facts.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/30 relative overflow-hidden group/box">
                       <Brain className="absolute -top-2 -right-2 w-12 h-12 text-blue-100 opacity-50 group-hover/box:rotate-12 transition-transform" />
                       <p className="text-xs text-blue-900 font-bold leading-relaxed italic relative z-10">"{m.facts.explanation}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-6 py-4 rounded-[1.5rem] rounded-tl-none shadow-sm flex items-center space-x-3">
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:1s]" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-10 border-t border-gray-100 bg-white">
        <div className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Command investigation..."
            className="w-full pl-8 pr-20 py-6 bg-gray-50 border-none rounded-[2rem] text-sm font-black focus:ring-8 focus:ring-black/5 transition-all placeholder:text-gray-300 placeholder:font-black placeholder:uppercase placeholder:tracking-[0.3em] placeholder:text-[10px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            className="absolute right-4 p-4 bg-black text-white rounded-[1.5rem] hover:bg-gray-800 disabled:opacity-20 transition-all shadow-2xl shadow-black/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Tactical Command Chips */}
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { label: 'Operational Summary', icon: <Activity className="w-3.5 h-3.5" /> },
            { label: 'Macro Exceptions', icon: <Search className="w-3.5 h-3.5" /> },
            { label: 'High Value Risks', icon: <ChevronRight className="w-3.5 h-3.5" /> }
          ].map(tag => (
            <button
              key={tag.label}
              onClick={() => handleSend(tag.label)}
              className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center shadow-sm"
            >
              {tag.icon}
              <span className="ml-3">{tag.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Copilot;
