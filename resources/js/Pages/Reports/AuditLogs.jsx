import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShieldCheck, Search, ShieldAlert, Terminal, Clock, User, Eye } from 'lucide-react';

export default function AuditLogs({ logsData, distinctTypes, filters }) {
    const [searchTerm, setSearchQuery] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.event_type || '');

    const runLogsSearchFilter = () => {
        router.get(route('audit.logs'), { search: searchTerm, event_type: selectedType }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><ShieldCheck className="text-rose-600"/> Corporate Security Registry & Operations Audit Trails</h2>}
        >
            <Head title="System Audit Logs" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {/* SYSTEM LOGS FILTERS TOOLBAR */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Audit Description Keyword Match</label>
                            <input type="text" placeholder="Filter audit text logs statement strings..." className="w-full border border-slate-200 rounded-lg text-xs p-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={searchTerm} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="space-y-1 w-full md:w-1/4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Event Vector Group</label>
                            <select className="w-full border border-slate-200 rounded-lg text-xs p-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                                <option value="">-- All Event Vectors --</option>
                                {distinctTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={runLogsSearchFilter} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-colors text-center">Query Trails</button>
                    </div>

                    {/* SYSTEM LOG MATRIX LEDGER SHEET */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal size={14} className="text-slate-400" /> Chronological Operations Log Track Ledger
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-100 text-slate-500 font-black border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-3">Logged Date / Time</th>
                                        <th className="p-3">Event Vector Class</th>
                                        <th className="p-3">Action Trace Audit Statement String</th>
                                        <th className="p-3">Operator User</th>
                                        <th className="p-3 text-right">Terminal IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                                    {logsData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400 italic font-medium">
                                                Zero security mutation log traces found matching current query bounds.
                                            </td>
                                        </tr>
                                    ) : (
                                        logsData.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="p-3 whitespace-nowrap">
                                                    <span className="bg-slate-100 border text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                        {log.event_type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-800 font-medium max-w-sm break-words">
                                                    {log.description}
                                                </td>
                                                <td className="p-3 font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5 mt-2.5">
                                                    <User size={12} className="text-slate-400" />
                                                    {log.operator_name || 'System Loop Worker'}
                                                </td>
                                                <td className="p-3 text-right font-mono text-slate-400 whitespace-nowrap">
                                                    {log.ip_address || '127.0.0.1'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION LAYOUT FLOW BLOCKS */}
                        {logsData.last_page > 1 && (
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-400">
                                <span className="font-mono">Page {logsData.current_page} of {logsData.last_page}</span>
                                <div className="flex items-center gap-1">
                                    {logsData.links.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-2 py-0.5 text-xs rounded border transition-all font-semibold ${link.active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'} ${!link.url ? 'text-slate-300 pointer-events-none border-slate-100' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
