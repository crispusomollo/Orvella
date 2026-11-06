import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileSpreadsheet, Calendar, TrendingUp, DollarSign, Percent, ArrowUpRight, ArrowDownRight, Activity, Wallet } from 'lucide-react';

export default function ProfitLossHub({ metrics, timeline_data, filters }) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);

    // Dynamic listener function to update query range windows
    const filterTimelineRange = () => {
        router.get(route('financial.reporting'), { start_date: startDate, end_date: endDate }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><FileSpreadsheet className="text-indigo-600"/> Executive Profit & Loss Accounting Workspace Hub</h2>}
        >
            <Head title="P&L Reporting Hub" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* TIMEFRAME INTERVAL SELECTOR WIDGET */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-end gap-4">
                        <div className="space-y-1 w-full sm:w-1/3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={11}/> Financial Opening Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg text-xs p-2 bg-slate-50 font-mono" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1 w-full sm:w-1/3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={11}/> Financial Closing Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg text-xs p-2 bg-slate-50 font-mono" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <button type="button" onClick={filterTimelineRange} className="w-full sm:w-1/3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md transition-all text-center">
                            Compute Ledger Statements
                        </button>
                    </div>

                    {/* ACCOUNTING METRICS RIBBON (ROW 1) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gross Revenue (Top Line)</p>
                                <h3 className="text-xl font-black font-mono text-slate-800 mt-1">KES {metrics.gross_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><DollarSign size={20}/></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cost of Goods Sold (COGS)</p>
                                <h3 className="text-xl font-black font-mono text-slate-600 mt-1">KES {metrics.total_cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-3 bg-slate-100 rounded-xl text-slate-500"><Wallet size={20}/></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between ring-1 ring-indigo-500/5">
                            <div>
                                <div className="flex items-center gap-1.5"><p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Gross Profit Margin</p><span className="text-[10px] font-black font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{metrics.gross_margin_percentage}%</span></div>
                                <h3 className="text-xl font-black font-mono text-indigo-600 mt-1">KES {metrics.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-3 bg-indigo-600 rounded-xl text-white"><ArrowUpRight size={20}/></div>
                        </div>
                    </div>
                    {/* OVERHEAD COSTS & NET INCOME MARGINS RIBBON (ROW 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Operating Expenses (Overheads)</p>
                                <h3 className="text-xl font-black font-mono text-slate-800 mt-1">KES {metrics.operating_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><ArrowDownRight size={20}/></div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm flex items-center justify-between ring-1 ring-emerald-500/10">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Net Profit Yield</p>
                                    <span className="text-[10px] font-black font-mono bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">{metrics.net_margin_percentage}%</span>
                                </div>
                                <h3 className="text-xl font-black font-mono text-emerald-600 mt-1">KES {metrics.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            </div>
                            <div className="p-3 bg-emerald-600 rounded-xl text-white"><TrendingUp size={20}/></div>
                        </div>
                    </div>

                    {/* DYNAMIC TIMELINE PERFORMANCE GRAPH EMBED */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <Activity size={12} className="text-indigo-500"/> Financial Performance Timeline Trend Grid
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeline_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => [`KES ${parseFloat(value).toLocaleString()}`]} />
                                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                    
                                    <Line type="monotone" name="Gross Sales" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                                    <Line type="monotone" name="Cost of Goods (COGS)" dataKey="cogs" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                    <Line type="monotone" name="Operating Expenses" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" name="Net Income Profit" dataKey="net_profit" stroke="#10b981" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    {/* DYNAMIC ITEMIZED DAILY PERFORMANCE MATRIX TABLE */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                📋 Itemised Statement Accounting Matrix Ledger
                            </h4>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-100 text-slate-500 font-black border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-3">Financial Date Interval</th>
                                        <th className="p-3 text-right">Gross Sales (Revenues)</th>
                                        <th className="p-3 text-right">Inventory Costs (COGS)</th>
                                        <th className="p-3 text-right">Overhead Expenses</th>
                                        <th className="p-3 text-right bg-slate-50/50">Net Margin Net Yield</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                                    {timeline_data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-400 italic">
                                                No accounting transactions tracked across this query calendar window.
                                            </td>
                                        </tr>
                                    ) : (
                                        // Reverse rows to display latest dates first in ledger sheets
                                        [...timeline_data].reverse().map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 font-bold text-slate-800 font-mono">{row.date}</td>
                                                <td className="p-3 text-right font-mono text-indigo-600">KES {row.revenue.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono text-slate-500">KES {row.cogs.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono text-rose-600">KES {row.expenses.toFixed(2)}</td>
                                                <td className={`p-3 text-right font-black font-mono bg-slate-50/30 ${row.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-700 bg-rose-50/20'}`}>
                                                    KES {row.net_profit.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
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
