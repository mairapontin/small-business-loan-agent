import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import {
  Send,
  Bot,
  User,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Terminal,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ChatConsoleProps {
  messages: ChatMessage[];
  loading: boolean;
  onSendMessage: (text: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onSelectSample: (loanId: string, promptText: string) => void;
}

export const ChatConsole: React.FC<ChatConsoleProps> = ({
  messages,
  loading,
  onSendMessage,
  onApprove,
  onReject,
  onSelectSample,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const lastMessage = messages[messages.length - 1];
  const waitingForApproval = lastMessage?.requiresApproval && !loading;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              Small Business Loan Orchestrator
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            </h2>
            <p className="text-[11px] text-slate-500">
              Gemini-powered ADK Multi-Agent System
            </p>
          </div>
        </div>

        {/* Quick action chips */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-02142', 'Process this loan application for SBL-2025-02142')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 transition-colors"
          >
            Happy Path (Complete)
          </button>
          <button
            type="button"
            onClick={() => onSelectSample('SBL-2025-00391', 'Process this application for SBL-2025-00391')}
            className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-700 text-slate-600 transition-colors"
          >
            Pause Flow (Incomplete)
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isAgent = msg.role === 'agent';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  isAgent
                    ? 'bg-slate-50 border border-slate-200/80 text-slate-800'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}
              >
                {/* Tool call timeline if any */}
                {isAgent && msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mb-3 pb-3 border-b border-slate-200/70 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Agent Tool Trajectory
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                            tc.status === 'success'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tc.status === 'halted'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : tc.status === 'error'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                          }`}
                        >
                          <Terminal className="w-3 h-3 opacity-70" />
                          {tc.tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* HITL interactive action prompt */}
                {isAgent && msg.requiresApproval && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onApprove}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve Loan
                    </button>
                    <button
                      type="button"
                      onClick={onReject}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Application
                    </button>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-1.5 ${
                    isAgent ? 'text-slate-400' : 'text-blue-100'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {!isAgent && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Coordinating sub-agents & checking Firestore state...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Try:
        </span>
        <button
          type="button"
          onClick={() => onSendMessage('Process this loan application for SBL-2025-02142')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Process SBL-2025-02142
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Process this application for SBL-2025-00391')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Process SBL-2025-00391 (Incomplete)
        </button>
        <button
          type="button"
          onClick={() => onSendMessage('Resume processing for SBL-2025-00391')}
          disabled={loading}
          className="shrink-0 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Resume SBL-2025-00391
        </button>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            waitingForApproval
              ? 'Type "yes" to approve or "no" to reject...'
              : 'Ask agent or enter "Process this loan application for SBL-..."'
          }
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
