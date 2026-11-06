import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShieldAlert, ZapOff, Activity, RefreshCw, Terminal, Clock, User, HardDrive, Key, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function DatabaseSessionOverlord({ activeSessions }) {
    const [isPolling, setIsPolling] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Refresh the live background PostgreSQL process thread pool metrics
    const triggerProcessPollRefresh = () => {
        setIsPolling(true);
        router.reload({
            preserveScroll: true,
            onFinish: () => setIsPolling(false)
        });
    };

    // Sever a frozen or unindexed database session thread immediately via PID
    const killActiveDatabaseSessionThread = (pid) => {
        if (!confirm(`Are you sure you want to instantly sever connection thread PID #${pid}? Any uncommitted query transitions will be rolled back.`)) return;

        axios.post(`/api/admin/process-killer/${pid}/terminate`)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                triggerProcessPollRefresh();
            })
            .catch(err => {
                alert(err.response?.data?.message || "Process termination request rejected.");
            });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-amber-500 animate-pulse"/> Active Database Session Overlord & Long Query Interceptor
                    </h2>
                    <button 
                        type="button" 
                        disabled={isPolling}
                        onClick={triggerProcessPollRefresh}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md transition-all"
                    >
                        <RefreshCw size={13} className={isPolling ? "animate-spin" : ""} /> 
                        {isPolling ? "Interrogating Engine..." : "Poll Active Sessions"}
                    </button>
                </div>
            }
        >
            <Head title="Database Session Overlord" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* DANGEROUS SYSTEM OPERATIONS COMPLIANCE WARNING NOTE BANNER */}
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-3 items-start text-xs text-rose-900">
                        <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="font-black uppercase tracking-wide">High-Privilege Connection Termination Protocol</h5>
                            <p className="font-medium text-rose-800/90">
                                Severing database connection pipelines forces an atomic rollback on any uncommitted transactional operations. Use this control panel strictly to kill hanging lock contentions, unindexed heavy reporting tables, or deadlocked background processes. Avoid terminating active pool connections from verified checkout terminals.
                            </p>
                        </div>
                    </div>

                    {/* DATABASE PROCESS ENGINE DIRECTORY SHEET */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal size={14} className="text-slate-400" /> Live PostgreSQL Backend Connection Processing Pool
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4 w-14">PID</th>
                                        <th className="p-4">App Context</th>
                                        <th className="p-4">State Node</th>
                                        <th className="p-4 font-mono">Runtime Load</th>
                                        <th className="p-4">Active SQL Query / Transaction Statement Execution Thread</th>
                                        <th className="p-4 text-right">Kill Session</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                                    {activeSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                                                Zero active transactional threads or handles connected to the engine pool.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeSessions.map((session, idx) => {
                                            const isActive = session.state === 'active';
                                            return (
                                                <tr key={idx} className={`hover:bg-slate-50/50 transition-colors border-l-2 ${isActive ? 'border-l-amber-500 bg-amber-50/5' : 'border-transparent'}`}>
                                                    <td className="p-4 font-mono font-bold text-slate-500">{session.pid}</td>
                                                    <td className="p-4">
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-slate-800">{session.application}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">User: {session.db_user} | IP: {session.ip_address}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide font-mono ${isActive ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                            {session.state}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap font-mono text-slate-500">
                                                        <p className="font-bold text-slate-700">{session.query_runtime}</p>
                                                        <p className="text-[9px] text-slate-400 font-sans">Pool Age: {session.connection_time}</p>
                                                    </td>
                                                    <td className="p-4 max-w-sm md:max-w-md overflow-hidden font-mono text-[11px] text-slate-800 break-all bg-slate-50/30">
                                                        {session.query_string}
                                                    </td>
                                                    <td className="p-4 text-right whitespace-nowrap">
                                                        <button 
                                                            type="button"
                                                            onClick={() => killActiveDatabaseSessionThread(session.pid)}
                                                            className="inline-flex items-center justify-center gap-1 bg-white hover:bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-2xs border border-rose-200 transition-colors"
                                                            title="Sever connection thread immediately"
                                                        >
                                                            <ZapOff size={11}/> Sever Link
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
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

