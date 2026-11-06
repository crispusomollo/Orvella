import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Activity, Cpu, HardDrive, Database, Terminal, RefreshCw, Layers, Server, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

export default function SystemHealthConsole({ telemetry }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshMetricsData = () => {
        setIsRefreshing(true);
        router.reload({
            preserveScroll: true,
            onFinish: () => setIsRefreshing(false)
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <Activity className="text-emerald-500 animate-pulse"/> Infrastructure Health, System Status & Core Telemetry
                    </h2>
                    <button 
                        type="button" 
                        disabled={isRefreshing}
                        onClick={refreshMetricsData}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md transition-all"
                    >
                        <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} /> 
                        {isRefreshing ? "Polling Nodes..." : "Refresh Live Metrics"}
                    </button>
                </div>
            }
        >
            <Head title="System Health Diagnostics" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* HARDWARE SYSTEMS RAW HARDWARE GAUGE METERS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        {/* DISK VOLUME SPACE CAPACITY ALLOCATION TRACKER */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Storage Volume Balance</p>
                                    <h3 className="text-2xl font-black font-mono text-slate-800">{telemetry.disk.used} GB / {telemetry.disk.total} GB</h3>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600"><HardDrive size={18}/></div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                    <div className="bg-slate-900 h-2 rounded-full transition-all duration-500" style={{ width: `${telemetry.disk.percentage}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                                    <span>VOLUME UTILISATION RATE</span>
                                    <span className="text-slate-700">{telemetry.disk.percentage}%</span>
                                </div>
                            </div>
                        </div>

                        {/* HARDWARE MEMORY RAM CAPACITY SPLITS METER */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active System RAM load</p>
                                    <h3 className="text-2xl font-black font-mono text-slate-800">{telemetry.memory.used} GB / {telemetry.memory.total} GB</h3>
                                </div>
                                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600"><Server size={18}/></div>
                            </div>
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${telemetry.memory.percentage}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 font-mono">
                                    <span>RAM MEMORY CONSUMPTION</span>
                                    <span className="text-indigo-600">{telemetry.memory.percentage}%</span>
                                </div>
                            </div>
                        </div>


                        {/* CPU INFRASTRUCTURE LOAD AVERAGE METRICS */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">WSL CPU Load Average</p>
                                    {/* FIXED: Added array index mapping to prevent toFixed crashes on array parameters */}
                                    <h3 className="text-2xl font-black font-mono text-slate-800">
                                        {Array.isArray(telemetry.cpu_load_1min) ? telemetry.cpu_load_1min[0].toFixed(2) : '0.00'}
                                    </h3>
                                </div>
                                <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600"><Cpu size={18}/></div>
                            </div>
                            <div className="mt-4 flex gap-4 text-center font-mono text-[10px] font-bold text-slate-400">
                                <div className="flex-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <p className="text-slate-700 font-black text-xs">
                                        {Array.isArray(telemetry.cpu_load_1min) ? telemetry.cpu_load_1min[0].toFixed(2) : '0.00'}
                                    </p>
                                    <p className="text-[8px] uppercase tracking-wide mt-0.5">1 Min</p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <p className="text-slate-500">
                                        {Array.isArray(telemetry.cpu_load_1min) ? telemetry.cpu_load_1min[1].toFixed(2) : '0.00'}
                                    </p>
                                    <p className="text-[8px] uppercase tracking-wide mt-0.5">5 Min</p>
                                </div>
                                <div className="flex-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <p className="text-slate-500">
                                        {Array.isArray(telemetry.cpu_load_1min) ? telemetry.cpu_load_1min[2].toFixed(2) : '0.00'}
                                    </p>
                                    <p className="text-[8px] uppercase tracking-wide mt-0.5">15 Min</p>
                                </div>
                            </div>
                        </div>


                    </div>
                    {/* SOFTWARE ENGINE PARAMETERS & CONFIGURATION SCHEMAS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">JavaScript Engine Environment</p>
                            <p className="text-xs font-black text-slate-800">{telemetry.js_runtime}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PostgreSQL Server Version</p>
                            <p className="text-xs font-black text-slate-800 font-mono">v{telemetry.postgres_version}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Write-Ahead Logging (WAL) Mode</p>
                            <p className="text-xs font-black text-indigo-600 font-mono">{telemetry.wal_level_mode}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Active Parallel Pools Pool Connections</p>
                            <p className="text-xs font-black text-emerald-600 font-mono">{telemetry.db_connections} Open Handles</p>
                        </div>
                    </div>

                    {/* POSTGRES ACTIVE RUNNING PROCESS LOOPS TABLE LEDGER CONTAINER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal size={14} className="text-slate-400" /> Active Running Process Queries & Scheduled Workloads
                            </h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4 w-16">PID</th>
                                        <th className="p-4 w-24">State Node</th>
                                        <th className="p-4">Active SQL Query String Statement Execution Thread</th>
                                        <th className="p-4 text-right">Running Runtime</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                                    {telemetry.active_queries.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-400 italic font-medium">
                                                Zero high-overhead background transactional tasks executing on the engine.
                                            </td>
                                        </tr>
                                    ) : (
                                        telemetry.active_queries.map((q, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-mono font-bold text-slate-500">{q.pid}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                        {q.state}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-800 font-mono text-[11px] max-w-lg truncate break-all">
                                                    {q.query}
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-500 font-sans whitespace-nowrap">
                                                    {q.runtime}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

