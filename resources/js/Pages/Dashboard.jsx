import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AlertTriangle, Activity, ShieldAlert, TrendingUp, PackageCheck, Receipt, DollarSign, Percent, ShieldCheck } from 'lucide-react';

export default function Dashboard({ expiryAlerts, reorderAlerts, financialTrend, dispensingVolumes, kpis, recentGeneralSales, recentControlledSales }) {

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Activity className="text-emerald-600"/> Pharmacy Operations Command Center</h2>}
        >
            <Head title="Operations Dashboard" />

            <div className="py-6 bg-slate-50 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* EXECUTIVE CORE KPI RIBBON DISPLAY ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Today's Invoices</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">{kpis.invoice_count}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Receipt size={20}/></div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Gross Revenue</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">KES {kpis.gross_revenue}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><DollarSign size={20}/></div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Avg Invoice Value</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">KES {kpis.avg_ticket}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Percent size={20}/></div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase">Controlled Dispensed</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800 mt-1">{kpis.controlled_count} Units</h3>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><ShieldCheck size={20}/></div>
                        </div>
                    </div>
                    {/* SYSTEM ALERT LAYER GRID ELEMENTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                            <h3 className="text-md font-bold text-red-800 flex items-center gap-2 mb-3">
                                <AlertTriangle className="text-red-500 animate-pulse"/> Low Stock Threshold Violations ({reorderAlerts.length})
                            </h3>
                            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                {reorderAlerts.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-2">All product quantities maintain safe margins.</p>
                                ) : (
                                    reorderAlerts.map((prod) => (
                                        <div key={prod.id} className="flex justify-between items-center py-2.5 text-sm">
                                            <span className="font-medium text-slate-700">{prod.name}</span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 font-bold text-xs border border-red-100">
                                                Stock: {prod.total_stock} / Min: {prod.reorder_level}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm">
                            <h3 className="text-md font-bold text-amber-800 flex items-center gap-2 mb-3">
                                <ShieldAlert className="text-amber-500"/> Imminent Batch Expirations ({expiryAlerts.length})
                            </h3>
                            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                {expiryAlerts.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-2">No active batches are expiring within 90 days.</p>
                                ) : (
                                    expiryAlerts.map((batch) => (
                                        <div key={batch.id} className="flex justify-between items-center py-2.5 text-sm">
                                            <div>
                                                <p className="font-medium text-slate-700">{batch.product.name}</p>
                                                <p className="text-xs text-slate-400 font-mono">Batch: {batch.batch_number}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                    Expires: {new Date(batch.expiry_date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">{batch.quantity_remaining} Units Left</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    {/* GRAPH SEGMENTS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2">
                            <h3 className="text-md font-bold text-slate-700 flex items-center gap-2 mb-4">
                                <TrendingUp className="text-indigo-500"/> Weekly Financial Performance Stream (Sales vs Expenses vs Profits)
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financialTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value) => [`KES ${parseFloat(value).toLocaleString(undefined, {minimumFractionDigits: 2})}`]} />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        
                                        <Area type="monotone" name="Gross Revenues" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                                        <Area type="monotone" name="Operating Expenses" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                                        <Area type="monotone" name="Net Profit Margins" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
                                    </AreaChart> 
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                            <h3 className="text-md font-bold text-slate-700 flex items-center gap-2 mb-4">
                                <PackageCheck className="text-emerald-500"/> Top Dispensing Product Volumes
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dispensingVolumes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip formatter={(value) => [`${value} Units`]} />
                                        <Bar dataKey="qty" name="Units Dispensed" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    {/* NEW TWIN WIDGET GRID LAYOUT: GENERAL SHIFT SALES VS CONTROLLED LOGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* 1. RECENT GENERAL SALES LOG TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-800 text-white font-bold text-sm flex items-center gap-2">
                                <Receipt size={16} className="text-indigo-400" /> Recent Shift Sales Ledger (All Transactions)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3">Invoice</th>
                                            <th className="p-3">Customer Reference</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentGeneralSales.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-slate-400 italic">No sales processed during this operational shift.</td>
                                            </tr>
                                        ) : (
                                            recentGeneralSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-slate-700">{sale.invoice_number}</td>
                                                    <td className="p-3 text-slate-600 font-medium">
                                                        {sale.patient ? `${sale.patient.name}` : <span className="text-slate-400 italic">Walk-In Account</span>}
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-slate-800">KES {parseFloat(sale.total_amount).toFixed(2)}</td>
                                                    <td className="p-3 text-slate-500"><span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 border border-slate-200">{sale.payment_method}</span></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 2. REGULATORY COMPLIANCE TRACKING LOG TABLE */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-4 bg-slate-900 text-white font-bold text-sm flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" /> Controlled Substance Dispensation Log Trails (Auditing Only)
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-3">Invoice</th>
                                            <th className="p-3">Patient Account Reference</th>
                                            <th className="p-3">Total Charged</th>
                                            <th className="p-3">Timestamp Sourced</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentControlledSales.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="p-4 text-center text-slate-400 italic">No controlled substances dispensed during this operational cycle.</td>
                                            </tr>
                                        ) : (
                                            recentControlledSales.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-indigo-600">{sale.invoice_number}</td>
                                                    <td className="p-3 text-slate-700 font-medium">
                                                        {sale.patient ? `${sale.patient.name} (${sale.patient.patient_number})` : <span className="text-slate-400 italic">Walk-In Account</span>}
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-slate-800">KES {parseFloat(sale.total_amount).toFixed(2)}</td>
                                                    <td className="p-3 text-slate-500 font-mono text-[11px]">{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
