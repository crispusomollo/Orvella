import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShieldAlert, Plus, Terminal, Cpu, Info, CheckCircle2, ShieldCheck, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function TerminalSecurityConsole({ terminals, current_device_ip }) {
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({ terminal_name: '', ip_address: '', admin_notes: '' });

    const handleAuthorizeTerminalSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);

        axios.post('/api/admin/terminal-security/store', form)
            .then(res => {
                alert(res.data.message);
                setIsSaving(false);
                setForm({ terminal_name: '', ip_address: '', admin_notes: '' });
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Security registry allocation rejected.");
                setIsSaving(false);
            });
    };

    const handleToggleActiveStateRule = (id) => {
        axios.post(`/api/admin/terminal-security/${id}/toggle`)
            .then(res => {
                alert(res.data.message);
                router.reload({ preserveScroll: true });
            })
            .catch(err => alert(err.response?.data?.message || "Operation failed."));
    };

    const handlePurgeTerminalLockRule = (id, label) => {
        if (!confirm(`Are you absolutely sure you want to permanently revoke system authorization keys for terminal: [${label}]? This device will be instantly locked out if other active whitelist constraints exist.`)) return;

        axios.delete(`/api/admin/terminal-security/${id}/purge`)
            .then(res => {
                alert(res.data.message);
                router.reload({ preserveScroll: true });
            })
            .catch(err => alert(err.response?.data?.message || "Purge request rejected."));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><ShieldAlert className="text-rose-600 animate-pulse"/> Multi-Terminal Workplace IP Whitelisting Desk</h2>}
        >
            <Head title="Terminal Whitelist Security" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* CURRENT MACHINE FOOTPRINT ASSIGNMENT INFO HELPER CARD */}
                    <div className="bg-indigo-950 text-indigo-100 p-4 rounded-xl border border-indigo-900 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <Info size={18} className="text-indigo-400 shrink-0"/>
                            <span className="text-xs font-semibold">Your current hardware network terminal connection footprint identifier coordinates are logged as: <span className="font-mono bg-indigo-900/60 border border-indigo-800 px-2 py-0.5 rounded font-black text-white">{current_device_ip}</span></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* REGISTRY LINES SHOW SHEETS LEDGER */}
                        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-3.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                <Terminal size={14} className="text-emerald-400"/> Authorized Active Workplace Station Terminals
                            </div>
                            <div className="p-4 space-y-2 max-h-96 overflow-y-auto bg-slate-50/30 divide-y divide-slate-100">
                                {terminals.length === 0 ? (
                                    <p className="text-center py-8 text-slate-400 font-medium italic text-xs">All network devices currently permitted. Add rules to restrict access bounds.</p>
                                ) : (
                                    terminals.map(term => (
                                        <div key={term.id} className="p-3.5 bg-white border rounded-xl border-slate-200 shadow-3xs flex items-center justify-between text-xs font-semibold hover:border-slate-300 transition-all">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${term.is_active ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                                    {term.terminal_name}
                                                </h4>
                                                <p className="text-[10px] text-slate-400 font-mono">Assigned Network IP: <span className="text-slate-600 font-bold font-mono">{term.ip_address}</span></p>
                                                {term.admin_notes && <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">Notes: {term.admin_notes}</p>}
                                            </div>
                                            
                                            {/* INTERACTIVE CONTROLS DESK STRIP */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="flex items-center gap-1.5">
                                                    <input 
                                                        type="checkbox" 
                                                        id={`toggle_rule_${term.id}`}
                                                        className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                                        checked={term.is_active}
                                                        onChange={() => handleToggleActiveStateRule(term.id)}
                                                    />
                                                    <label htmlFor={`toggle_rule_${term.id}`} className="text-[10px] font-black uppercase text-slate-400 tracking-wide cursor-pointer select-none">
                                                        {term.is_active ? 'Active' : 'Suspended'}
                                                    </label>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handlePurgeTerminalLockRule(term.id, term.terminal_name)}
                                                    className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                                    title="Permanently Revoke Terminal Authorization"
                                                >
                                                    <Trash2 size={13}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* REGISTRATION DATA ENTRY FORM INPUTS PANEL */}
                        <form onSubmit={handleAuthorizeTerminalSubmit} className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="p-3.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                                Whitelist New Physical Workstation Terminal
                            </div>
                            <div className="p-4 space-y-4 text-xs font-semibold text-slate-600">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Terminal Operational Identifier Label</label>
                                    <input type="text" required placeholder="e.g. Front Counter Checkout Desk Node #2" className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-700" value={form.terminal_name} onChange={e => setForm({...form, terminal_name: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Unique Network IP Coordinate Address</label>
                                    <input type="text" required placeholder="e.g. 192.168.1.42" className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-700" value={form.ip_address} onChange={e => setForm({...form, ip_address: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Administrative Authorization Notes</label>
                                    <textarea rows="2" placeholder="Document device usage authorization boundaries..." className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-700" value={form.admin_notes} onChange={e => setForm({...form, admin_notes: e.target.value})}></textarea>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-md transition-all">
                                    {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12}/>}
                                    Authorize Machine Node
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
