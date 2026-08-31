"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, ShieldCheck, Activity, Search, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface CopilotProps {
  runId?: number;
  metrics?: any;
}

const Copilot: React.FC<CopilotProps> = ({ runId, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Analytical Assistant active. I'm grounded in your reconciliation data. What would you like to investigate?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        throw new Error("Query Layer Failure");
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Network interruption. Please check your backend connection."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-[2rem] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 group border-4 border-white"
      >
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[420px] h-[680px] bg-white rounded-[2.5rem] border border-gray-200 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] flex flex-col overflow-hidden z-50 animate-in slide-in-from-right-4 duration-300">
      <header className="bg-black text-white px-8 py-6 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <ShieldCheck className="w-20 h-20" />
        </div>
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <span className="block font-black text-sm tracking-tight">Analytical Copilot</span>
            <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Verified Knowledge</span>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors relative z-10">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/20">
        {messages.map((m: any, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] space-y-4`}>
              <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                m.role === 'user'
                  ? 'bg-black text-white rounded-tr-none font-bold'
                  : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 font-medium'
              }`}>
                {m.content}
              </div>

              {/* Specialized Data Views */}
              {m.facts && m.intent === 'HIGH_VALUE_UNRESOLVED' && (
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Prioritized Attention</span>
                  </div>
                  <div className="space-y-2">
                    {m.facts.map((f: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{f.description}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-0.5">{f.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600">₹{f.amount.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.facts && m.intent === 'EXCEPTION_SUMMARY' && (
                <div className="grid grid-cols-2 gap-3">
                  {m.facts.map((f: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-100 p-4 rounded-3xl shadow-sm text-center space-y-1 group hover:border-black transition-colors cursor-default">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{f.type.replace('_', ' ')}</p>
                      <p className="text-2xl font-black text-gray-900 tabular-nums">{f.count}</p>
                    </div>
                  ))}
                </div>
              )}

              {m.facts && m.intent === 'INVESTIGATION' && m.facts.bank_tx && (
                <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-lg shadow-black/[0.02]">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Evidence Trace</span>
                    <StatusBadge status={m.facts.status} />
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400 uppercase tracking-tight">System Probability</span>
                      <span className="font-black text-blue-600 text-lg">{(m.facts.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 relative">
                       <FileText className="absolute top-2 right-2 w-4 h-4 text-blue-200" />
                       <p className="text-[11px] text-blue-800 font-bold leading-relaxed italic">"{m.facts.explanation}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 px-5 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:0.8s]" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 border-t border-gray-100 bg-white">
        <div className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything..."
            className="w-full pl-6 pr-16 py-5 bg-gray-50 border-none rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-black/5 transition-all placeholder:text-gray-400 placeholder:font-black placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            className="absolute right-3 p-3 bg-black text-white rounded-2xl hover:bg-gray-800 disabled:opacity-20 transition-all shadow-xl shadow-black/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Rapid Suggestions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: 'Summary', icon: <Activity className="w-3 h-3" /> },
            { label: 'Exceptions', icon: <Search className="w-3 h-3" /> },
            { label: 'High Value', icon: <ChevronRight className="w-3 h-3" /> }
          ].map(tag => (
            <button
              key={tag.label}
              onClick={() => handleSend(tag.label)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:border-black hover:text-black transition-all flex items-center shadow-sm"
            >
              {tag.icon}
              <span className="ml-2">{tag.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Copilot;
