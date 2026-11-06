import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Settings, Cpu, Database, RefreshCw, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function MaintenanceConsole() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTask, setActiveTask] = useState('');

    const handleExecuteOptimization = (taskType) => {
        if (!confirm(`Execute database optimization task [${taskType.toUpperCase()}]? Your system tables may briefly lock during optimization rows mapping.`)) return;

        setIsProcessing(true);
        setActiveTask(taskType);

        axios.post('/api/admin/maintenance/optimize', { task_type: taskType })
            .then(res => {
                alert(res.data.message);
                setIsProcessing(false);
                setActiveTask('');
                router.reload();
            })
            .catch(err => {
                alert(err.response?.data?.message || "Maintenance operation pipeline failure.");
                setIsProcessing(false);
                setActiveTask('');
            });
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Cpu className="text-indigo-600"/> Infrastructure Maintenance Window & Performance Optimizer</h2>}
        >
            <Head title="System Maintenance" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                            Database Maintenance & Engine Refactoring Actions
                        </div>
                        <div className="p-5 space-y-4 text-xs font-semibold text-slate-600">
                            
                            {/* TASK 1: VACUUM CLEANER INTERFACE */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                                <div className="space-y-0.5 flex-grow">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><Database size={16} className="text-indigo-500"/> PostgreSQL Storage Vacuum Ingestor</h4>
                                    <p className="text-slate-500 font-medium">Reclaims dead storage cells left behind by deleted or modified entries, restructuring transaction tables safely.</p>
                                </div>
                                <button 
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleExecuteOptimization('vacuum')}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white px-4 py-2.5 rounded-xl uppercase tracking-wider font-black text-[10px] shadow-xs shrink-0 flex items-center gap-1"
                                >
                                    {isProcessing && activeTask === 'vacuum' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12}/>}
                                    Run Vacuum Clean
                                </button>
                            </div>

                            {/* TASK 2: REINDEX SYSTEM MATRIX */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
                                <div className="space-y-0.5 flex-grow">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5"><ShieldCheck size={16} className="text-emerald-500"/> Rebuild Core Database Indices</h4>
                                    <p className="text-slate-500 font-medium">Drops old index shards and re-maps all column parameters to maximize formulation searches and sales ledger query speeds.</p>
                                </div>
                                <button 
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleExecuteOptimization('reindex')}
                                    className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white px-4 py-2.5 rounded-xl uppercase tracking-wider font-black text-[10px] shadow-xs shrink-0 flex items-center gap-1"
                                >
                                    {isProcessing && activeTask === 'reindex' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12}/>}
                                    Reindex Database
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

