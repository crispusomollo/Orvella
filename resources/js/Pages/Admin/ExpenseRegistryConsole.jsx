import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Receipt, Plus, Wallet, FileText, Calendar, Tag, Loader2, CheckCircle2, X } from 'lucide-react';
import axios from 'axios';

export default function ExpenseRegistryConsole({ expenseLedger, totalOverheads }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial expense parameters state hook configurations
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        category: 'Utilities',
        amount: '',
        date_incurred: new Date().toISOString().split('T')[0],
        description: ''
    });

    const handleExpenseFormSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        axios.post('/api/admin/expenses/store', expenseForm)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                setIsAddModalOpen(false);
                setIsSubmitting(false);
                setExpenseForm({ title: '', category: 'Utilities', amount: '', date_incurred: new Date().toISOString().split('T')[0], description: '' });
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Expense logging request rejected.");
                setIsSubmitting(false);
            });
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Receipt className="text-indigo-600"/> Operational Expenditures & Corporate Overheads Ledger</h2>}
        >
            <Head title="Expense Registry Console" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* OVERHEAD EXPENDITURE RUNNING AGGREGATE SUMMARY BANNER */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex justify-between items-center relative overflow-hidden">
                        <div className="space-y-1 z-10">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Cumulative Life-Time Operational Overheads</p>
                            <h3 className="text-3xl font-black font-mono text-emerald-400">KES {totalOverheads.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-slate-500">Itemised outlays subtracted dynamically inside your P&L statement panels.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-colors z-10"
                        >
                            <Plus size={13}/> Log Cash Outlay
                        </button>
                    </div>

                    {/* ITEMIZED EXPENDITURE TRANSACTION MATRIX SHEET */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4">Date Incurred</th>
                                        <th className="p-4">Expense Title Heading</th>
                                        <th className="p-4">Cost Category</th>
                                        <th className="p-4">Justification Summary Description</th>
                                        <th className="p-4 text-right">Amount Outlay (KES)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                                    {expenseLedger.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-12 text-center text-slate-400 italic">
                                                Zero documented operational overhead expense outlays found inside financial ledgers.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenseLedger.data.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                                                    {new Date(row.date_incurred).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                </td>
                                                <td className="p-4 font-bold text-slate-800">{row.title}</td>
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                                        row.category === 'Rent' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        row.category === 'Utilities' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        row.category === 'Salaries' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-slate-50 text-slate-700 border-slate-100'
                                                    }`}>
                                                        <Tag size={10} /> {row.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500 font-medium max-w-xs truncate" title={row.description}>
                                                    {row.description || <span className="text-slate-300 italic">No description logged.</span>}
                                                </td>
                                                <td className="p-4 text-right font-black font-mono text-slate-900 bg-slate-50/30">
                                                    KES {parseFloat(row.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* INTERACTIVE PAGINATION NAVIGATION FOOTER BLOCK */}
                        {expenseLedger.last_page > 1 && (
                            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs font-medium text-slate-400">
                                <span className="font-mono">Page {expenseLedger.current_page} of {expenseLedger.last_page}</span>
                                <div className="flex items-center gap-1">
                                    {expenseLedger.links.map((link, idx) => (
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
            {/* OVERHEAD EXPENDITURE LOGGING FLOATING OVERLAY MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleExpenseFormSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Log New Facility Expenditure</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Record operational overhead outlays atomically</p>
                            </div>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={16}/></button>
                        </div>
                        
                        <div className="p-5 space-y-4 text-xs font-semibold">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Expense Title Heading / Payee</label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="text" required placeholder="e.g. Kenya Power Bill Oct 2026" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-medium" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount Paid Out</label>
                                    <div className="relative">
                                        <Wallet size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 font-mono bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Date Settled</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input type="date" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 text-xs font-mono focus:ring-1 focus:ring-indigo-500" value={expenseForm.date_incurred} onChange={e => setSettingsForm ? setSettingsForm({...expenseForm, date_incurred: e.target.value}) : setExpenseForm({...expenseForm, date_incurred: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cost Category Allocation</label>
                                <select className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-bold uppercase tracking-wider text-slate-700" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                    <option value="Rent">Rent / Facility Lease</option>
                                    <option value="Utilities">Utilities (Power, Water, Net)</option>
                                    <option value="Salaries">Staff Salaries / Wages</option>
                                    <option value="Logistics">Logistics / Sourcing Freight</option>
                                    <option value="Licensing">Regulatory Licensing Fees</option>
                                    <option value="Disposal">Hazardous Waste Disposal</option>
                                    <option value="Other">Other Operational Expenses</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Justification Reason Description</label>
                                <textarea rows="2" placeholder="Provide extra auditing notes regarding this cash outlay..." className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-medium text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}></textarea>
                            </div>
                        </div>

                        {/* FORM ACTION CONTROLS DISPATCH FOOTER */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-1/3 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl py-2.5 text-center transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="w-2/3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl text-center transition-all shadow-md flex items-center justify-center gap-1.5">
                                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                                Commit Cash Outlay
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </AuthenticatedLayout>
    );
}

