import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Database, Download, CloudLightning, Loader2, CheckCircle2, AlertTriangle, ShieldAlert, Clock, User, HardDrive } from 'lucide-react';
import axios from 'axios';

export default function BackupRecoveryConsole({ backupHistory }) {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Dispatches a hot-backup command straight to the pg_dump stream pipeline
    const triggerSnapshotBackup = () => {
        setIsBackingUp(true);
        setStatusMessage(null);

        axios.post('/api/admin/backups/trigger')
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                setIsBackingUp(false);
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                setStatusMessage({ type: 'error', text: err.response?.data?.message || "Hot snapshot execution aborted." });
                setIsBackingUp(false);
                router.reload({ preserveScroll: true });
            });
    };

    const downloadBackupAsset = (id) => {
        window.location.href = `/admin/backups/${id}/download`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <Database className="text-indigo-600"/> Structural Database Backup, Disaster Recovery & WAL Archives
                    </h2>
                    <button 
                        type="button" 
                        disabled={isBackingUp}
                        onClick={triggerSnapshotBackup}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all"
                    >
                        {isBackingUp ? <Loader2 size={13} className="animate-spin" /> : <CloudLightning size={13} />}
                        {isBackingUp ? "Compiling Dump File..." : "Trigger Hot Backup Snapshot"}
                    </button>
                </div>
            }
        >
            <Head title="Database Backup Vault" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {statusMessage.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <ShieldAlert size={18} className="text-rose-600" />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* STATUTORY REGULATORY SECURITY WARNING NOTE BANNER */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 items-start text-xs text-amber-900">
                        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h5 className="font-black uppercase tracking-wide">Enterprise Cold-Backup Recovery Policies Notice</h5>
                            <p className="font-medium text-amber-800/90">
                                Snapshots are executed as multi-version concurrency hot-dumps using standard PostgreSQL page boundaries. To preserve transactional atomicity across intense dispensing shifts, do not modify database structural lot configurations while backup dumping operations are actively polling the storage volumes.
                            </p>
                        </div>
                    </div>

                    {/* HISTORICAL COMPILATION TRACK MATRIX LEDGER SHEET */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} className="text-slate-400" /> Historical Snapshot Archive Footprints Tracing Logs
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4">Snapshot Archive Filename</th>
                                        <th className="p-4">FileSystem Disk Path Location</th>
                                        <th className="p-4 text-center">Payload Size</th>
                                        <th className="p-4">Trigger Authority</th>
                                        <th className="p-4 text-center">Status Mode</th>
                                        <th className="p-4 text-right">Binary Downloads</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                                    {backupHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                                                Zero localized hot-backup binary snapshots compiled within database registries.
                                            </td>
                                        </tr>
                                    ) : (
                                        backupHistory.map((archive) => {
                                            const isSuccess = archive.status === 'SUCCESS';
                                            return (
                                                <tr key={archive.id} className={`hover:bg-slate-50/50 transition-colors border-l-2 ${isSuccess ? 'border-transparent' : 'border-l-rose-500 bg-rose-50/10'}`}>
                                                    <td className="p-4 font-mono font-bold text-slate-700 truncate max-w-xs">{archive.filename}</td>
                                                    <td className="p-4 font-mono text-slate-400 truncate max-w-xs" title={archive.disk_path}>{archive.disk_path}</td>
                                                    <td className="p-4 text-center font-mono font-black text-slate-700 bg-slate-50/30">{archive.file_size}</td>
                                                    <td className="p-4 font-bold text-slate-700 whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5"><User size={12} className="text-slate-400"/> {archive.operator_name || 'System Worker'}</span>
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                            {archive.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right whitespace-nowrap">
                                                        <button 
                                                            type="button" 
                                                            disabled={!isSuccess}
                                                            onClick={() => downloadBackupAsset(archive.id)}
                                                            className="inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:text-slate-300 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-2xs border border-slate-200 text-slate-700 transition-colors"
                                                        >
                                                            <Download size={11}/> Save SQL Zip
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

