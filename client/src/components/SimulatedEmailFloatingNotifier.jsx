/**
 * @AUTHOR: Garima Mittal
 * @FILE: SimulatedEmailFloatingNotifier.jsx
 * @RESPONSIBILITY: Floating real-time notification widget and toast for simulated email dispatches across all SolIMS views.
 * @DEPENDENCIES: react, lucide-react, socket.js, api.js, SimulatedEmailOutboxModal.jsx
 */

import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, X, ChevronRight } from 'lucide-react';
import { subscribeToErpEvent } from '../services/socket';
import { executeHttpRequest } from '../services/api';
import { SimulatedEmailOutboxModal } from './SimulatedEmailOutboxModal';

export const SimulatedEmailFloatingNotifier = () => {
  const [emailCount, setEmailCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);

  const fetchEmailCount = async () => {
    try {
      const response = await executeHttpRequest('/api/notifications/emails?limit=1');
      if (response.success) {
        setEmailCount(response.count || 0);
      }
    } catch {
      // Quiet fail if server is reloading
    }
  };

  useEffect(() => {
    fetchEmailCount();

    // Subscribe to real-time socket events for new dispatches
    const unsubscribe = subscribeToErpEvent('SIMULATED_EMAIL_DISPATCHED', (payload) => {
      if (payload && payload.email) {
        setEmailCount((prev) => prev + 1);
        setActiveToast(payload.email);

        // Auto-dismiss toast after 7 seconds
        setTimeout(() => {
          setActiveToast((current) => (current?._id === payload.email._id ? null : current));
        }, 7000);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleOpenEmailModal = (emailId = null) => {
    setSelectedEmailId(emailId);
    setActiveToast(null);
    setIsModalOpen(true);
  };

  return (
    <>
      {/* 1. Real-Time Floating Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-20 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/30 p-4 animate-slideUp">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  Simulated Email Dispatched
                </span>
                <h4 className="text-xs font-bold text-slate-100 mt-0.5 line-clamp-1">
                  {activeToast.subject}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 text-[11px] text-slate-300">
            To: <span className="font-mono text-emerald-300 font-medium">{activeToast.to}</span>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-800 pt-2.5">
            <button
              onClick={() => handleOpenEmailModal(activeToast._id)}
              className="px-3 py-1.5 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <span>Preview Dispatched Email</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Persistent Floating Quick Access Pill */}
      <aside aria-label="Simulated Mailbox" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenEmailModal()}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#0F291E] to-[#135D3B] text-white font-heading font-extrabold text-xs shadow-xl border border-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open Zero-Config Simulated Email Outbox"
        >
          <div className="relative">
            <Mail className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
            {emailCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-emerald-500 text-[9px] font-mono font-black text-slate-900 flex items-center justify-center border border-white">
                {emailCount}
              </span>
            )}
          </div>
          <span className="tracking-tight">Simulated Mailbox</span>
        </button>
      </aside>

      {/* 3. The Modal / Drawer */}
      <SimulatedEmailOutboxModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedEmailId={selectedEmailId}
      />
    </>
  );
};
