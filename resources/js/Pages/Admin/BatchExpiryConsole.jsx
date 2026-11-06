import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { CalendarX, AlertOctagon, AlertTriangle, Eye, ShieldAlert, Pill, Building, Search } from 'lucide-react';

export default function BatchExpiryConsole({ expiryBatches, summaryMetrics }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [riskFilter, setRiskFilter] = useState('ALL'); // ALL, CRITICAL, HIGH, WATCH

    // Filter collection via state selectors natively on the client for high velocity feedback loops
    const filteredBatches = expiryBatches.filter(b => {
        const matchesSearch = b.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              b.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              b.sku.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        if (riskFilter === 'CRITICAL') return b.days_remaining <= 30;
        if (riskFilter === 'HIGH') return b.days_remaining > 30 && b.days_remaining <= 60;
        if (riskFilter === 'WATCH') return b.days_remaining > 60 && b.days_remaining <= 90;
        return true;
    });

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><CalendarX className="text-rose-600 animate-pulse"/> Proactive Lot Expiry Forecasting Desk</h2>}
        >
            <Head title="Proactive Expiry Console" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {/* RISK HIGHLIGHT SEGMENT RIBBON BAR */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div onClick={() => setRiskFilter('ALL')} className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-all ${riskFilter === 'ALL' ? 'ring-2 ring-slate-900' : 'hover:bg-slate-50/50'}`}>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Impact Lots</p>
                            <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">{summaryMetrics.total_risk} Batches</h3>
                        </div>
                        {/* CRITICAL RISK FILTER BUTTON ACCORDION CARD (<30 DAYS) */}
                        <div onClick={() => setRiskFilter('CRITICAL')} className={`p-4 bg-white rounded-xl border border-rose-200 shadow-sm cursor-pointer transition-all relative overflow-hidden ${riskFilter === 'CRITICAL' ? 'ring-2 ring-rose-600 bg-rose-50/20' : 'hover:bg-slate-50/50'}`}>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                                <AlertOctagon size={11} className="animate-bounce" /> Critical Breach Risk
                            </p>
                            <h3 className="text-2xl font-black font-mono text-rose-700 mt-1">{summaryMetrics.critical_30} Batches</h3>
                            <p className="text-[9px] text-slate-400 font-medium">Expires in &le; 30 Days</p>
                        </div>

                        {/* HIGH RISK FILTER BUTTON ACCORDION CARD (31-60 DAYS) */}
                        <div onClick={() => setRiskFilter('HIGH')} className={`p-4 bg-white rounded-xl border border-amber-200 shadow-sm cursor-pointer transition-all relative overflow-hidden ${riskFilter === 'HIGH' ? 'ring-2 ring-amber-500 bg-amber-50/20' : 'hover:bg-slate-50/50'}`}>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle size={11} /> Elevating Vulnerability
                            </p>
                            <h3 className="text-2xl font-black font-mono text-amber-700 mt-1">{summaryMetrics.high_60} Batches</h3>
                            <p className="text-[9px] text-slate-400 font-medium">Expires in 31 - 60 Days</p>
                        </div>

                        {/* WATCH RISK FILTER BUTTON ACCORDION CARD (61-90 DAYS) */}
                        <div onClick={() => setRiskFilter('WATCH')} className={`p-4 bg-white rounded-xl border border-indigo-200 shadow-sm cursor-pointer transition-all relative overflow-hidden ${riskFilter === 'WATCH' ? 'ring-2 ring-indigo-600 bg-indigo-50/20' : 'hover:bg-slate-50/50'}`}>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                                <ShieldAlert size={11} /> Standard Watchlist
                            </p>
                            <h3 className="text-2xl font-black font-mono text-indigo-800 mt-1">{summaryMetrics.watch_90} Batches</h3>
                            <p className="text-[9px] text-slate-400 font-medium">Expires in 61 - 90 Days</p>
                        </div>
                    </div>

                    {/* SEARCH FILTERS AND REAL-TIME CONTROL WORKSPACE BAR */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full sm:max-w-md">
                            <Search size={14} className="absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search inventory lot name, generic molecular formulation, batch ID, or SKU number..."
                                className="w-full border border-slate-200 rounded-lg p-2.5 pl-9 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                            Showing <span className="text-slate-800 font-black">{filteredBatches.length}</span> entries against current filters
                        </div>
                    </div>

                    {/* BATCH MONITORING DATA SHEET */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4">Countdown Threshold Status</th>
                                        <th className="p-4">Product Inventory Item Details</th>
                                        <th className="p-4">Batch Identity Code</th>
                                        <th className="p-4">Origin Source Vendor</th>
                                        <th className="p-4 text-center">Remaining Stock Volume</th>
                                        <th className="p-4 text-right">Calendar Expiry Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                                    {filteredBatches.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                                                Zero documented warehouse batches match the chosen risk criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBatches.map((row) => {
                                            const remaining = parseInt(row.days_remaining);
                                            const isExpired = remaining <= 0;
                                            
                                            return (
                                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                    
                                                    {/* PROACTIVE RISK STATUS VECTOR BADGE SEGMENT */}
                                                    <td className="p-4 whitespace-nowrap">
                                                        {isExpired ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-rose-600 text-white border border-rose-700 animate-pulse">
                                                                <AlertOctagon size={10}/> EXPIRED CRITICAL
                                                            </span>
                                                        ) : remaining <= 30 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
                                                                <AlertOctagon size={10} className="text-rose-600"/> {remaining} Days Remain
                                                            </span>
                                                        ) : remaining <= 60 ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                                                                <AlertTriangle size={10} className="text-amber-500"/> {remaining} Days Remain
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                <ShieldAlert size={10} className="text-indigo-600"/> {remaining} Days Remain
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="p-4 max-w-xs">
                                                        <div className="flex items-center gap-2">
                                                            <Pill size={14} className="text-slate-400 shrink-0" />
                                                            <div className="truncate">
                                                                <p className="text-slate-900 font-black truncate">{row.product_name}</p>
                                                                <p className="text-[9px] text-slate-400 font-mono truncate">{row.generic_name} &bull; SKU {row.sku}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                                                        {row.batch_number}
                                                    </td>
                                                    <td className="p-4 max-w-[150px] truncate text-slate-500 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Building size={12} className="text-slate-400 shrink-0" />
                                                            <span className="truncate">{row.supplier_name || <span className="text-slate-300 italic">Direct Sourced</span>}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center font-mono font-black text-slate-900 bg-slate-50/30">
                                                        {parseInt(row.stock_qty).toLocaleString()} Units
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-500 whitespace-nowrap">
                                                        {new Date(row.expiry_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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

