import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { AlertTriangle, Sparkles, Loader2, Building, Layers, ShieldCheck, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

export default function LowStockReorderConsole({ lowStockItems, suppliers }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleTriggerAutoDraftEngine = () => {
        setIsGenerating(true);
        axios.post('/api/purchases/auto-draft-po')
            .then(res => {
                alert(res.data.message);
                setIsGenerating(false);
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Procurement execution pipeline error.");
                setIsGenerating(false);
            });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500 animate-pulse"/> Low Stock Threshold Replenishment Hub
                    </h2>
                    <button
                        type="button"
                        disabled={isGenerating || lowStockItems.length === 0}
                        onClick={handleTriggerAutoDraftEngine}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-all scale-100 hover:scale-[1.01]"
                    >
                        {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-amber-300 fill-amber-300" />}
                        {isGenerating ? "Analyzing Run Rates..." : "Run Predictive Replenishment"}
                    </button>
                </div>
            }
        >
            <Head title="Reorder Console" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* SYSTEM RISK ASSESSMENT METRIC WIDGETS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Breached Line Items</p>
                                <h3 className="text-2xl font-black font-mono text-rose-600 mt-1">{lowStockItems.length} Formulations</h3>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Layers size={20}/></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Linked Wholesalers</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">{suppliers.length} Indexed</h3>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-700"><Building size={20}/></div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide">System Automation Mode</p>
                                <h3 className="text-sm font-black text-emerald-700 flex items-center gap-1.5 mt-2.5 uppercase tracking-wide">
                                    <ShieldCheck size={16}/> FEFO Run-Rate Active
                                </h3>
                            </div>
                        </div>
                    </div>
                    {/* DEFICIT LIST SHEET OVERVIEW GRID */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                            <span>Formulation Rows Breaching Safety Margins</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{lowStockItems.length} Lines flagged</span>
                        </div>
                        
                        <div className="p-4 overflow-x-auto">
                            {lowStockItems.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-medium text-xs">
                                    All indexed formulation lot balances maintain safe operational margins. No restocks required.
                                </div>
                            ) : (
                                <div className="overflow-hidden border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                                <th className="p-3.5">Medication Nomenclature</th>
                                                <th className="p-3.5">SKU Barcode</th>
                                                <th className="p-3.5 text-center">Safety Reorder Point</th>
                                                <th className="p-3.5 text-center">Current Shelf Balance</th>
                                                <th className="p-3.5 text-right">Replenishment Target</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                                            {lowStockItems.map((item) => {
                                                const restockGoal = (parseInt(item.reorder_level) * 2) - parseInt(item.stock);
                                                return (
                                                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="p-3.5">
                                                            <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.generic_name || 'Generic Unclassified'}</p>
                                                        </td>
                                                        <td className="p-3.5 font-mono text-slate-500 font-semibold">{item.sku}</td>
                                                        <td className="p-3.5 text-center font-mono text-slate-400 font-bold">{item.reorder_level} Units</td>
                                                        <td className="p-3.5 text-center">
                                                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black font-mono border border-rose-100 text-[11px]">
                                                                {item.stock} Units left
                                                            </span>
                                                        </td>
                                                        <td className="p-3.5 text-right font-mono font-black text-indigo-600 text-xs">
                                                            <span className="inline-flex items-center gap-0.5">
                                                                +{restockGoal} <ArrowUpRight size={12} strokeWidth={2.5}/>
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
