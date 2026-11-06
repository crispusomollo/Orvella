import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShieldAlert, Search, FileSpreadsheet, Calendar, User, UserCheck, Stethoscope, Hash, Terminal } from 'lucide-react';

export default function ControlledSubstancesLedger({ ledgerData, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // Form search filter trigger execution query routing dispatch handler
    const handleLedgerSearch = (e) => {
        e.preventDefault();
        router.get(route('reports.controlled_substances'), { search: searchQuery }, { preserveState: true, preserveScroll: true });
    };

    // Download streaming CSV data file payload path mapping
    const triggerCsvExport = () => {
        window.location.href = `/api/reports/controlled/export?query=${searchQuery}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="text-rose-600 animate-pulse"/> Controlled Substance Dispensation Regulatory Ledger
                    </h2>
                </div>
            }
        >
            <Head title="Controlled Substances Ledger" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {/* TOOLBAR FILTER FORM COMPONENT WITH INTEGRATED EXCEL EXPORT LINK */}
                    <form onSubmit={handleLedgerSearch} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-3 items-stretch">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search by medication brand, generic molecule, patient profile name, or physician..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider px-5 py-2 rounded-xl shadow-md transition-colors text-center">
                            Filter Registry
                        </button>
                        <button 
                            type="button" 
                            onClick={triggerCsvExport} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs uppercase tracking-wider transition-colors"
                            title="Export Compliance Audit Log sheets to Excel"
                        >
                            <FileSpreadsheet size={14}/> Export Excel
                        </button>
                    </form>

                    {/* DYNAMIC REGULATORY ACCOUNTABILITY TRANSACTIONS GRID */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <Terminal size={14} className="text-slate-400" /> Statutory Dispensation Audit Record Rows
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-black border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-3">Dispense Date</th>
                                        <th className="p-3">Invoice Ref</th>
                                        <th className="p-3">Controlled Molecule Formulation</th>
                                        <th className="p-3">Batch Lot</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3">Linked Patient Chart</th>
                                        <th className="p-3">Prescribing Physician</th>
                                        <th className="p-3 text-right">Dispensing Authority</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                                    {ledgerData.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="p-12 text-center text-slate-400 italic font-medium">
                                                No heavily regulated controlled substance dispensing events recorded matching current criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        ledgerData.data.map((row) => (
                                            <tr key={row.id} className="hover:bg-rose-50/20 transition-colors border-l-2 border-transparent hover:border-l-rose-500">
                                                <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(row.created_at).toLocaleString()}
                                                </td>
                                                <td className="p-3 font-mono font-bold text-indigo-600 whitespace-nowrap">
                                                    {row.invoice_number}
                                                </td>
                                                <td className="p-3">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-800">{row.product_name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono truncate">{row.generic_name}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                                                    {row.batch_number}
                                                </td>
                                                <td className="p-3 text-center font-mono font-black text-rose-700 bg-rose-50/40">
                                                    {row.quantity}
                                                </td>
                                                <td className="p-3">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-700 flex items-center gap-1"><User size={11} className="text-slate-400"/> {row.patient_name || 'Walk-in Account'}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono font-semibold">Chart: {row.patient_number || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-700 flex items-center gap-1"><Stethoscope size={11} className="text-slate-400"/> Dr. {row.doctor_name || 'N/A'}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">Rx Code: {row.prescription_number || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right font-bold text-slate-700 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border text-slate-600 font-mono text-[10px]">
                                                        {row.dispenser_name}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* INTERACTIVE PAGINATION LINK NAV WORKSPACE BLOCK */}
                        {ledgerData.last_page > 1 && (
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-400">
                                <span className="font-mono">Page {ledgerData.current_page} of {ledgerData.last_page}</span>
                                <div className="flex items-center gap-1">
                                    {ledgerData.links.map((link, idx) => (
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
