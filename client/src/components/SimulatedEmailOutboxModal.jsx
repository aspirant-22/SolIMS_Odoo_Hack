/**
 * @AUTHOR: Garima Mittal
 * @FILE: SimulatedEmailOutboxModal.jsx
 * @RESPONSIBILITY: Full interactive zero-config simulated email outbox drawer and HTML previewer with one-click magic login and hackathon demo triggers.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  Send,
  Sparkles,
  Key,
  ShieldCheck,
  UserCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { executeHttpRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SimulatedEmailOutboxModal = ({ isOpen, onClose, selectedEmailId = null }) => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [emails, setEmails] = useState([]);
  const [activeEmail, setActiveEmail] = useState(null);
  const [filterStage, setFilterStage] = useState('ALL'); // ALL | STAGE_1_INQUIRY | STAGE_2_ACTIVATION
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState('');
  const [isSendingDemo, setIsSendingDemo] = useState(false);

  const loadSimulatedEmails = async (preferredSelectId = null) => {
    setIsLoading(true);
    try {
      const response = await executeHttpRequest('/api/notifications/emails');
      if (response.success) {
        setEmails(response.emails || []);
        if (response.emails?.length > 0) {
          const target = preferredSelectId
            ? response.emails.find((e) => e._id === preferredSelectId) || response.emails[0]
            : activeEmail
            ? response.emails.find((e) => e._id === activeEmail._id) || response.emails[0]
            : response.emails[0];
          setActiveEmail(target);
        } else {
          setActiveEmail(null);
        }
      }
    } catch (err) {
      console.error('Failed to load simulated emails:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSimulatedEmails(selectedEmailId);
    }
  }, [isOpen, selectedEmailId]);

  if (!isOpen) return null;

  const filteredEmails = emails.filter((item) => {
    if (filterStage === 'ALL') return true;
    return item.stage === filterStage;
  });

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedStatus(label);
    setTimeout(() => setCopiedStatus(''), 2500);
  };

  const handleClearMailbox = async () => {
    if (!window.confirm('Clear all dispatched simulated emails?')) return;
    try {
      await executeHttpRequest('/api/notifications/emails', { method: 'DELETE' });
      setEmails([]);
      setActiveEmail(null);
    } catch (err) {
      console.error('Failed to clear emails:', err);
    }
  };

  const handleTriggerDemoEmail = async (stage) => {
    setIsSendingDemo(true);
    try {
      const response = await executeHttpRequest('/api/notifications/emails/test-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          stage,
          recipientEmail: stage === 'STAGE_2_ACTIVATION' ? 'priya.sharma@example.com' : 'rahul.verma@example.com',
          recipientName: stage === 'STAGE_2_ACTIVATION' ? 'Priya Sharma' : 'Rahul Verma'
        })
      });
      if (response.success && response.email) {
        await loadSimulatedEmails(response.email._id);
      }
    } catch (err) {
      console.error('Failed to dispatch test email:', err);
    } finally {
      setIsSendingDemo(false);
    }
  };

  // One-Click Login to Homeowner Portal as Customer
  const handleInstantCustomerLogin = async (emailObj) => {
    const creds = emailObj.credentials;
    const targetEmail = creds?.email || emailObj.to;
    const targetPassword = creds?.temporaryPassword || 'customer123';

    try {
      if (emailObj.magicLink && emailObj.magicLink.includes('magicToken=')) {
        const urlParams = new URLSearchParams(emailObj.magicLink.split('?')[1]);
        const magicToken = urlParams.get('magicToken');
        if (magicToken) {
          const authRes = await executeHttpRequest('/api/auth/magic-login', {
            method: 'POST',
            body: JSON.stringify({ magicToken })
          });
          if (authRes.success) {
            onClose();
            navigate('/my-solar');
            return;
          }
        }
      }

      await loginUser(targetEmail, targetPassword);
      onClose();
      navigate('/my-solar');
    } catch (err) {
      console.warn('Standard login fallback failed:', err);
      // Fallback: Persona switcher or direct navigation
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#0F291E] via-[#135D3B] to-[#0E462C] px-6 py-4 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Mail className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-lg text-white">
                  Zero-Config Simulated Email Outbox
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  100% Offline Hackathon Mode
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 font-medium">
                Simulates real-time customer onboarding emails without SMTP servers or external credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSimulatedEmails()}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-white/10 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              title="Refresh Outbox"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-emerald-100 hover:text-white transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action & Filter Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-full">
            <button
              onClick={() => setFilterStage('ALL')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterStage === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Outbox ({emails.length})
            </button>
            <button
              onClick={() => setFilterStage('STAGE_1_INQUIRY')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterStage === 'STAGE_1_INQUIRY'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stage 1: Assessment Intake
            </button>
            <button
              onClick={() => setFilterStage('STAGE_2_ACTIVATION')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterStage === 'STAGE_2_ACTIVATION'
                  ? 'bg-emerald-100 text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stage 2: Portal Activated
            </button>
          </div>

          {/* Quick Demo Triggers */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Test Trigger:</span>
            <button
              onClick={() => handleTriggerDemoEmail('STAGE_1_INQUIRY')}
              disabled={isSendingDemo}
              className="px-3 py-1 rounded-full bg-white hover:bg-amber-50 text-amber-900 font-bold border border-amber-300 shadow-2xs cursor-pointer text-[11px] flex items-center gap-1"
            >
              <Send className="w-3 h-3 text-amber-600" />
              <span>+ Stage 1 Email</span>
            </button>
            <button
              onClick={() => handleTriggerDemoEmail('STAGE_2_ACTIVATION')}
              disabled={isSendingDemo}
              className="px-3 py-1 rounded-full bg-white hover:bg-emerald-50 text-emerald-900 font-bold border border-emerald-300 shadow-2xs cursor-pointer text-[11px] flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>+ Stage 2 Email</span>
            </button>
            <button
              onClick={handleClearMailbox}
              className="p-1.5 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Clear Outbox"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Content: Split Master-Detail Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Email Dispatches List (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100 bg-slate-50/50">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-xs">No simulated emails found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Trigger an inquiry or test dispatch above to see emails here.
                </p>
              </div>
            ) : (
              filteredEmails.map((item) => {
                const isSelected = activeEmail?._id === item._id;
                const isStage2 = item.stage === 'STAGE_2_ACTIVATION';
                return (
                  <div
                    key={item._id}
                    onClick={() => setActiveEmail(item)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white border-l-4 border-[#135D3B] shadow-2xs'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          isStage2
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {isStage2 ? 'Stage 2 • Portal Active' : 'Stage 1 • Assessment'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 truncate">
                      {item.recipientName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate mb-1">
                      {item.to}
                    </div>
                    <div className="text-xs text-slate-700 font-medium truncate">
                      {item.subject}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Interactive Email HTML Viewer (8 cols) */}
          <div className="md:col-span-8 flex flex-col bg-white overflow-hidden">
            {activeEmail ? (
              <>
                {/* Email Header Toolbar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-black text-sm text-slate-900">
                        {activeEmail.subject}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-[#135D3B] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {activeEmail.emailReference}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong>To:</strong> {activeEmail.recipientName} &lt;{activeEmail.to}&gt;</span>
                      <span><strong>Date:</strong> {new Date(activeEmail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions depending on stage */}
                  <div className="flex items-center gap-2">
                    {activeEmail.stage === 'STAGE_2_ACTIVATION' ? (
                      <button
                        onClick={() => handleInstantCustomerLogin(activeEmail)}
                        className="px-4 py-2 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform transform hover:-translate-y-0.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                        <span>Instant Login As Customer ➔</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          if (activeEmail.relatedEntity?.referenceCode) {
                            navigate(`/?track=${activeEmail.relatedEntity.referenceCode}#track`);
                          }
                        }}
                        className="px-4 py-2 rounded-full bg-[#135D3B] hover:bg-[#0E462C] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
                        <span>Open Live Tracker ➔</span>
                      </button>
                    )}

                    {activeEmail.magicLink && (
                      <button
                        onClick={() => handleCopyText(activeEmail.magicLink, 'Magic link copied')}
                        className="px-3 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-300 shadow-2xs text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{copiedStatus === 'Magic link copied' ? 'Copied! ✓' : 'Copy Magic Link'}</span>
                      </button>
                    )}

                    {activeEmail.credentials?.temporaryPassword && (
                      <button
                        onClick={() => handleCopyText(activeEmail.credentials.temporaryPassword, 'Password copied')}
                        className="px-3 py-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 shadow-2xs text-xs flex items-center gap-1 cursor-pointer"
                        title="Copy Temporary Password"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>{copiedStatus === 'Password copied' ? 'Copied! ✓' : `Pass: ${activeEmail.credentials.temporaryPassword}`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rendered HTML Sandbox Preview */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
                  <div className="bg-white max-w-2xl mx-auto rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <iframe
                      title="Simulated Email Preview"
                      srcDoc={activeEmail.htmlContent}
                      className="w-full h-[600px] border-none"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                Select an email from the left pane to preview.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-2.5 text-center text-[11px] text-slate-500 font-medium">
          Zero-Config Progressive Customer Onboarding • SolIMS Solar ERP by Garima Mittal
        </div>
      </div>
    </div>
  );
};
