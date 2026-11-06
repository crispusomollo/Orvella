import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React from 'react';
import { TrendingUp, TrendingDown, Sparkles, BarChart3, LineChart, Calendar, Pill, Zap, ArrowUpRight, DollarSign } from 'lucide-react';

export default function ExecutiveAnalyticsDashboard({ biMetrics }) {
    const {
        current_revenue,
        prior_revenue,
        growth_percentage,
        projected_revenue,
        daily_average_velocity,
        seasonal_curves,
        chronological_trail
    } = biMetrics;

    const isPositiveGrowth = growth_percentage >= 0;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                    <BarChart3 className="text-indigo-600"/> Executive Business Intelligence & Predictive Analytics Dashboard
                </h2>
            }
        >
            <Head title="Executive BI Analytics" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {/* DYNAMIC TOP-LINE FORECASTING & MULTI-PERIOD RUN-RATE CORES */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* CURRENT 30-DAY VELOCITY RUN-RATE CARD */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="space-y-1 z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">30-Day Gross Run-Rate Revenue</p>
                                <h3 className="text-2xl font-black font-mono text-slate-900">
                                    KES {current_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black font-mono border ${isPositiveGrowth ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                        {isPositiveGrowth ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {growth_percentage > 0 ? `+${growth_percentage}` : growth_percentage}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">vs Prior Month Period</span>
                                </div>
                            </div>
                            <ArrowUpRight size={54} className="absolute -right-2 -bottom-2 text-slate-50 stroke-1 pointer-events-none" />
                        </div>
                        {/* 30-DAY FORWARD PREDICTIVE LINEAR REGRESSION FORECAST MODEL */}
                        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="space-y-1 z-10">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={10} className="animate-pulse" /> Algorithmic Next-30 Days Forecast
                                </p>
                                <h3 className="text-2xl font-black font-mono text-emerald-400">
                                    KES {projected_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium mt-2">
                                    Linear rolling-window calculation adjusted for momentum velocity shifts.
                                </p>
                            </div>
                            <LineChart size={54} className="absolute -right-2 -bottom-2 text-slate-800/40 stroke-1 pointer-events-none" />
                        </div>

                        {/* DAILY VELOCITY MOMENTUM TRACKER CAPACITY METER */}
                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="space-y-1 z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Average Daily Checkout Velocity</p>
                                <h3 className="text-2xl font-black font-mono text-slate-800">
                                    KES {daily_average_velocity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </h3>
                                <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-400 font-mono">
                                    <Zap size={11} className="text-amber-500 fill-amber-500"/>
                                    <span>STEADY INTRA-DAY INVOICE LIQUIDITY RUNNING</span>
                                </div>
                            </div>
                            <Calendar size={54} className="absolute -right-2 -bottom-2 text-slate-50 stroke-1 pointer-events-none" />
                        </div>

                    </div>

                    {/* TWO-COLUMN INTEL WORKSPACE LAYOUT PANELS */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* LEFT COLUMN: CHRONOLOGICAL MATRIX RUN-RATE VISUALIZATION (COL-SPAN 3) */}
                        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <LineChart size={14} className="text-indigo-600"/> 15-Day Intra-Day Liquidity Run-Rate Bars
                                </h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Real-Time Scaling</span>
                            </div>

                            {/* PURE TAILWIND GRAPH SCANCE WORKSPACE CANVAS */}
                            <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2 border-b border-slate-200">
                                {chronological_trail.map((day, idx) => {
                                    // Calculate relative vertical heights safely against global peaks
                                    const maxPeak = Math.max(...chronological_trail.map(d => d.revenue), 1);
                                    const heightPercentage = Math.min(100, Math.max(6, (day.revenue / maxPeak) * 100));
                                    
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                            
                                            {/* HOVER TOOLTIP POPOVER INDICATOR STATUS */}
                                            <div className="absolute bottom-full mb-2 bg-slate-900 text-white font-mono text-[9px] font-black p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30 whitespace-nowrap text-center">
                                                <p className="text-emerald-400">KES {day.revenue.toLocaleString()}</p>
                                                <p className="text-slate-400 text-[8px] mt-0.5">{day.transactions} Invoices Issued</p>
                                            </div>

                                            {/* LIVE CHART BAR COLUMN BLOCK */}
                                            <div 
                                                style={{ height: `${heightPercentage}%` }}
                                                className={`w-full rounded-t-sm transition-all duration-500 cursor-pointer ${
                                                    day.revenue === maxPeak ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-slate-300 group-hover:bg-slate-400'
                                                }`}
                                            ></div>
                                            
                                            {/* BOTTOM HORIZONTAL DATE AXIS LABEL ROW */}
                                            <span className="text-[8px] font-bold text-slate-400 font-mono mt-2 origin-center truncate w-full text-center">
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* RIGHT COLUMN: SEASONAL DEMAND CURVES & PRODUCT VELOCITY LEDGER (COL-SPAN 2) */}
                        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Pill size={14} className="text-rose-600"/> 6-Month Seasonal Molecule Demand Curve
                                </h4>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">High-velocity formulations with escalating consumption spikes.</p>
                            </div>

                            <div className="space-y-3">
                                {seasonal_curves.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Insufficient transaction history to map seasonal trends.</p>
                                ) : (
                                    seasonal_curves.map((curve, idx) => {
                                        // Dynamically isolate local peak constraints inside array maps safely
                                        const curvePeak = Math.max(...seasonal_curves.map(c => parseInt(c.total_volume_sold || 0)), 1);
                                        const progressWidth = Math.min(100, (parseInt(curve.total_volume_sold || 0) / curvePeak) * 100);

                                        return (
                                            <div key={idx} className="space-y-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 transition-colors">
                                                <div className="flex justify-between text-xs font-bold text-slate-700">
                                                    <div className="max-w-[70%] truncate">
                                                        <p className="text-slate-900 font-black truncate">{curve.product_name}</p>
                                                        <p className="text-[9px] text-slate-400 font-mono truncate">{curve.generic_name}</p>
                                                    </div>
                                                    <div className="text-right font-mono">
                                                        <p className="text-rose-700 font-black">{curve.total_volume_sold} Units</p>
                                                        <p className="text-[9px] text-slate-400 font-semibold">{curve.prescription_frequency_count} Scripts</p>
                                                    </div>
                                                </div>

                                                {/* INLINE COMPARATIVE DEMAND TREND SPARKLINE */}
                                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden border border-slate-300/30">
                                                    <div 
                                                        style={{ width: `${progressWidth}%` }} 
                                                        className="bg-rose-600 h-1.5 rounded-full transition-all duration-500"
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div> {/* Closes two-column layout intelligence grid safely */}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
