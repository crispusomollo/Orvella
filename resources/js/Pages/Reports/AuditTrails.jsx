import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import React from 'react';
import { ClipboardList, User, ShieldAlert, Key, HelpCircle } from 'lucide-react';

export default function AuditTrails({ logs }) {
    
    // Dynamically assign badges depending on action metrics types
    const getActionBadgeStyle = (action) => {
        if (action.includes('CREATED')) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        if (action.includes('DELETED')) return 'bg-rose-50 border-rose-200 text-rose-700';
        if (action.includes('SECURITY') || action.includes('FAILED')) return 'bg-purple-50 border-purple-200 text-purple-700 animate-pulse font-bold';
        return 'bg-amber-50 border-amber-200 text-amber-700'; // Default Modified state
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><ClipboardList className="text-slate-700"/> Regulatory Security & System Audit Trails</h2>}
        >
            <Head title="System Audit Logs" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-900 text-slate-200 font-bold">
                                    <tr>
                                        <th className="p-4">Timestamp</th>
                                        <th className="p-4">Executed By</th>
                                        <th className="p-4">Action Label</th>
                                        <th className="p-4">Target Identity</th>
                                        <th className="p-4">Modified Data Parameter Difference Mapping</th>
                                        <th className="p-4">IP Sourced</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {logs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-400">No activity trail footprints recorded inside database registers yet.</td>
                                        </tr>
                                    ) : (
                                        logs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-slate-700 font-medium whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={14} className="text-slate-400"/>
                                                        {log.user ? log.user.name : <span className="text-slate-400 italic">Anonymous Terminal</span>}
                                                    </span>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 text-xs border rounded-full font-medium ${getActionBadgeStyle(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-slate-600 font-mono whitespace-nowrap">
                                                    {log.auditable_type.split('\\').pop()} #{log.auditable_id}
                                                </td>
                                                <td className="p-4 text-xs max-w-xs md:max-w-md overflow-hidden">
                                                    {log.old_values || log.new_values ? (
                                                        <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono max-h-24 overflow-y-auto">
                                                            {log.old_values && (
                                                                <p className="text-rose-600"><span className="font-bold text-slate-400">Before:</span> {JSON.stringify(log.old_values)}</p>
                                                            )}
                                                            {log.new_values && (
                                                                <p className="text-emerald-600"><span className="font-bold text-slate-400">After:</span> {JSON.stringify(log.new_values)}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">No value transitions documented</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                                                    {log.ip_address}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* INTERACTIVE PAGINATION LINK NAV BLOCK */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500 font-medium font-mono">Showing entries {logs.from}-{logs.to} out of {logs.total} logs footprint points</span>
                        <div className="flex items-center gap-1.5">
                            {logs.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1.5 text-xs rounded-lg transition-all font-semibold border ${link.active ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'} ${!link.url ? 'text-slate-300 pointer-events-none border-slate-100' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

