// Open resources/js/Pages/Reports/SupplierDebt.jsx and replace from your state hooks up to the metric widgets with Chunk 1:

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Landmark, ArrowUpRight, Scale, Clock, CheckCircle2, ShieldAlert, CreditCard, X, Calendar, DollarSign, Loader2, ListFilter, ArrowDown, ArrowUp } from 'lucide-react';
import axios from 'axios';

export default function SupplierDebt({ initialLedger, suppliers }) {
    const [ledger, setLedger] = useState(initialLedger);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    
    // NEW DRILL-DOWN ACCHORDION ROW TRACKERS
    const [expandedSupplierName, setExpandedSupplierName] = useState(null);
    const [supplierTransactions, setSupplierTransactions] = useState([]);
    const [isTxLoading, setIsTxLoading] = useState(false);

    // Settlement Form Object Hook
    const [paymentForm, setPaymentForm] = useState({
        supplier_id: '',
        amount_paid: '',
        payment_method: 'M-Pesa',
        reference_code: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    // Asynchronous lookup function to fetch transaction ledgers for clicked row
    const toggleSupplierTransactionDrawer = (supplierRow) => {
        // Find matching supplier database ID by text profile association name
        const match = suppliers.find(s => s.name === supplierRow.supplier_name);
        if (!match) return;

        if (expandedSupplierName === supplierRow.supplier_name) {
            setExpandedSupplierName(null);
            setSupplierTransactions([]);
            return;
        }

        setExpandedSupplierName(supplierRow.supplier_name);
        setIsTxLoading(true);
        setSupplierTransactions([]);

        axios.get(`/api/suppliers/${match.id}/transactions`)
            .then(res => {
                setSupplierTransactions(res.data);
                setIsTxLoading(false);
            })
            .catch(err => {
                console.error("Ledger acquisition failed:", err);
                setIsTxLoading(false);
            });
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/suppliers/settle-payment', paymentForm)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                setIsPaymentModalOpen(false);
                setPaymentForm({ supplier_id: '', amount_paid: '', payment_method: 'M-Pesa', reference_code: '', payment_date: new Date().toISOString().split('T')[0] });
                router.reload({ preserveScroll: true });
            })
            .catch(err => alert(err.response?.data?.message || "Liabilities payment remittance rejected."));
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Landmark className="text-indigo-600"/> Wholesaler Payables & Supplier Debt Aging Analysis</h2>}
        >
            <Head title="Supplier Debt Analysis" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CheckCircle2 size={18} />
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* PAYABLES SUMMARY METRIC WIDGET BLOCK */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex justify-between items-center relative overflow-hidden">
                        <div className="space-y-1 z-10">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding Portfolio Payables</p>
                            <h3 className="text-3xl font-black font-mono text-white">KES {parseFloat(ledger.total_portfolio_payables || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-slate-500">Real-time compilation balance based on verified supplier batch consignments.</p>
                        </div>
                        <Scale size={84} className="absolute -right-4 -bottom-4 text-slate-800/50 stroke-1 pointer-events-none" />
                    </div>

                    {/* LIABILITIES DISTRIBUTION TABLE GRID */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-1.5"><Clock size={16} className="text-slate-400"/> Aging Distribution Buckets Ledger</h4>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold font-mono text-slate-400 bg-white border border-slate-200 px-2.5 py-1.5 rounded-md hidden md:inline">As of: {ledger.generated_at}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-md transition-colors"
                                >
                                    <CreditCard size={13}/> Log Supplier Payment
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200/60 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Wholesaler Distributor</th>
                                        <th className="p-4 text-right">Current Dues</th>
                                        <th className="p-4 text-right">1 - 30 Days Overdue</th>
                                        <th className="p-4 text-right">31 - 60 Days Overdue</th>
                                        <th className="p-4 text-right">60+ Days Overdue</th>
                                        <th className="p-4 text-right bg-slate-50/50">Total Debt Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-xs font-semibold">
                                    {ledger.summary_ledger.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400">
                                                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 stroke-1 mb-2" />
                                                <p className="text-sm font-semibold text-slate-600">Accounts Clean: Zero outstanding liabilities logged.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        ledger.summary_ledger.map((row, idx) => {
                                            const isExpanded = expandedSupplierName === row.supplier_name;
                                            return (
                                                <React.Fragment key={idx}>
                                                    {/* Clicking this table row safely opens the detailed statement drawer logs below */}
                                                    <tr 
                                                        onClick={() => toggleSupplierTransactionDrawer(row)}
                                                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/40 hover:bg-indigo-50' : 'hover:bg-slate-50/60'}`}
                                                    >
                                                        <td className="p-4 font-bold text-indigo-900 flex items-center gap-2 whitespace-nowrap">
                                                            <span className="text-[10px] text-slate-400">{isExpanded ? '▼' : '►'}</span>
                                                            {row.supplier_name}
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-slate-600">{parseFloat(row.current_dues).toFixed(2)}</td>
                                                        <td className="p-4 text-right font-mono text-amber-600">{parseFloat(row.age_1_30_days).toFixed(2)}</td>
                                                        <td className="p-4 text-right font-mono text-orange-600">{parseFloat(row.age_31_60_days).toFixed(2)}</td>
                                                        <td className="p-4 text-right whitespace-nowrap">
                                                            {parseFloat(row.age_over_60_days) > 0 ? (
                                                                <span className="inline-flex items-center gap-1 font-black font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-xs">
                                                                    <ShieldAlert size={12}/> {parseFloat(row.age_over_60_days).toFixed(2)}
                                                                </span>
                                                            ) : (
                                                                <span className="font-semibold font-mono text-slate-400">0.00</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right font-black font-mono text-slate-900 bg-slate-50/50">KES {parseFloat(row.total_outstanding_debt).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>

                                                    {/* DRILL-DOWN CONTAINER INTERCEPT DRAWER SECTION */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="6" className="p-4 bg-slate-50 border-t border-b border-slate-200/60">

                                                                <div className="space-y-3 p-1 animate-slide-down">
                                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-0.5">
                                                                        <ListFilter size={12} className="text-indigo-600"/> Itemised Account Transaction & Allocation Trace History
                                                                    </h5>

                                                                    {isTxLoading ? (
                                                                        <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-bold gap-2 font-mono">
                                                                            <Loader2 size={14} className="animate-spin text-indigo-600" /> Pulling secure double-entry accounting records...
                                                                        </div>
                                                                    ) : supplierTransactions.length === 0 ? (
                                                                        <p className="text-[11px] text-slate-400 italic p-1">No transaction ledger lines documented on this wholesaler chart.</p>
                                                                    ) : (
                                                                        <div className="overflow-hidden border border-slate-200 rounded-xl shadow-2xs bg-white">
                                                                            <table className="w-full text-left text-xs border-collapse font-medium">
                                                                                <thead className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                                                                    <tr>
                                                                                        <th className="p-3">Timestamp Date</th>
                                                                                        <th className="p-3">Transaction Class</th>
                                                                                        <th className="p-3">Reference ID</th>
                                                                                        <th className="p-3">Itemised Formulation Lines / Description</th>
                                                                                        <th className="p-3 text-right">Debit (Payment KES)</th>
                                                                                        <th className="p-3 text-right">Credit (Purchase KES)</th>
                                                                                        <th className="p-3 text-right bg-slate-50/50">Running Debt Balance</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                                                                    {supplierTransactions.map(tx => {
                                                                                        const isPO = tx.type === 'CONSIGNMENT_INTAKE';
                                                                                        return (
                                                                                            <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                                                                                                <td className="p-3 font-mono font-medium text-slate-400 whitespace-nowrap">{tx.date}</td>
                                                                                                <td className="p-3 whitespace-nowrap">
                                                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${isPO ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                                                                        {isPO ? <ArrowUp size={10}/> : <ArrowDown size={10}/>}
                                                                                                        {isPO ? 'Stock PO' : 'Settle Paid'}
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">{tx.reference}</td>
                                                                                                <td className="p-3 text-slate-700 font-medium max-w-xs break-words">
                                                                                                    {isPO ? (
                                                                                                        <span className="text-slate-800 font-semibold">{tx.products_bought}</span>
                                                                                                    ) : (
                                                                                                        <span className="text-slate-400 italic">Liabilities account debt paid down via registry desk.</span>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td className="p-3 text-right font-mono font-bold text-emerald-600">{tx.debit > 0 ? `KES ${tx.debit.toFixed(2)}` : '0.00'}</td>
                                                                                                <td className="p-3 text-right font-mono font-bold text-amber-600">{tx.credit > 0 ? `KES ${tx.credit.toFixed(2)}` : '0.00'}</td>
                                                                                                <td className="p-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">KES {tx.running_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>

            {/* INTERACTIVE ASYNCHRONOUS DEBIT LIABILITIES REMITTANCE MODAL OVERLAY */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                                        <form onSubmit={handlePaymentSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Log Debt Remittance Payment</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Deduct outstanding credit account lines via active de-allocation</p>
                            </div>
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="p-5 space-y-4 text-xs font-semibold">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Creditor Wholesaler</label>
                                <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-medium" value={paymentForm.supplier_id} onChange={e => setPaymentForm({...paymentForm, supplier_id: e.target.value})}>
                                    <option value="">-- Choose Sourcing Partner --</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Remitted (KES)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 font-bold text-slate-400 font-mono">KES</span>
                                    <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 pl-12 font-mono bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={paymentForm.amount_paid} onChange={e => setPaymentForm({...paymentForm, amount_paid: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payment Mode</label>
                                    <select className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                                        <option value="M-Pesa">M-Pesa Money</option>
                                        <option value="Cash">Cash Vault</option>
                                        <option value="Bank Transfer">Bank Transfer / Cheque</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date Settled</label>
                                    <input type="date" required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">M-Pesa Ref / Cheque Reference Code</label>
                                <input type="text" required placeholder="e.g. KGA7XJ92N0" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 font-mono focus:ring-1 focus:ring-indigo-500 uppercase" value={paymentForm.reference_code} onChange={e => setPaymentForm({...paymentForm, reference_code: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="w-1/3 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl py-2.5 transition-colors">Cancel</button>
                            <button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-md">Post Debit Settlement</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
