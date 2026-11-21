/**
 * @AUTHOR: Garima Mittal
 * @FILE: SystemDiagnosticsView.jsx
 * @RESPONSIBILITY: Admin monospace diagnostics portal presenting server memory, uptime telemetry, DB health, and live audit stream.
 * @DEPENDENCIES: react, lucide-react, api.js, AuthContext.jsx
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Activity,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { executeHttpRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const SystemDiagnosticsView = () => {
  const { currentUser, setIsSystemProcessing } = useAuth();
  const [telemetry, setTelemetry] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTelemetryData = async () => {
    setIsRefreshing(true);
    try {
      const response = await executeHttpRequest('/api/diagnostics/telemetry');
      if (response.success) {
        setTelemetry(response.telemetry);
      }
    } catch (err) {
      console.error('Failed to load diagnostics telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetryData();
    const intervalTimer = setInterval(fetchTelemetryData, 10000);
    return () => clearInterval(intervalTimer);
  }, []);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-12 text-center text-rose-600 font-bold text-sm">
        Forbidden: System Diagnostics Portal requires Tier-1 Administrator Authorization.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#4A2545] rounded-xl p-6 text-white flex flex-wrap items-center justify-between gap-4 shadow-md border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Admin Live System Diagnostics & Server Telemetry</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1 font-mono">
            /admin/system-logs • Monospace Portal
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1.5 leading-relaxed font-medium">
            Real-time Node.js process memory metrics, heap allocations, MongoDB connection states, and atomic sequence health.
          </p>
        </div>

        <button
          onClick={fetchTelemetryData}
          disabled={isRefreshing}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50 border border-emerald-500"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {telemetry && (
        <>
          {/* Telemetry Hardware Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Server Uptime</span>
                <Server className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
                {telemetry.serverUptimeFormatted}
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium mt-1">
                {telemetry.serverUptimeSeconds}s total uptime
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>V8 Heap Used</span>
                <Cpu className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
                {telemetry.heapUsedMb} MB
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium mt-1">
                Total Allocated: {telemetry.heapTotalMb} MB
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>RSS Process Memory</span>
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
                {telemetry.rssMemoryMb} MB
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium mt-1">Resident Set Size</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>MongoDB Health</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-2 font-mono flex items-center gap-1.5 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{telemetry.mongoDbState}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono font-medium mt-1">
                DB: {telemetry.databaseName}
              </div>
            </div>
          </div>

          {/* Monospace Telemetry Terminal */}
          <div className="bg-slate-950 text-slate-100 rounded-2xl p-6 shadow-2xl font-mono text-xs space-y-4 border border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-slate-400 ml-2 font-bold">solims-core-daemon@production-node-2026</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">TELEMETRY_STREAM_ONLINE</span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="text-slate-500 font-semibold">// System Architecture Telemetry Summary</div>
              <div>[SYSTEM] Node Environment: <span className="text-amber-300 font-bold">{telemetry.nodeEnvironment}</span></div>
              <div>[SYSTEM] Local Telemetry Timestamp: <span className="text-blue-300 font-bold">{telemetry.timestamp}</span></div>
              <div>[DATABASE] MongoDB ReadyState: <span className="text-emerald-400 font-bold">{telemetry.mongoDbState} (Active Cluster)</span></div>
              <div>[DATABASE] Target Database: <span className="text-purple-300 font-bold">{telemetry.databaseName}</span></div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <div className="text-slate-500 font-semibold">// Live Mongoose Collection Document Counts</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-slate-300">
                <div>• users: <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.users}</span></div>
                <div>• leads (inquiries): <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.leads}</span></div>
                <div>• projectOrders: <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.projectOrders}</span></div>
                <div>• serialAssets: <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.serialAssets}</span></div>
                <div>• serviceTickets: <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.serviceTickets}</span></div>
                <div>• journalEntries: <span className="text-amber-300 font-extrabold">{telemetry.activeRecordCounts?.journalEntries}</span></div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-medium">
              <span>Security Tier: RBAC Enforced via HTTP-Only JWT Cookie & Zod Gates</span>
              <span className="text-emerald-400 font-bold">All Nodes Healthy</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
