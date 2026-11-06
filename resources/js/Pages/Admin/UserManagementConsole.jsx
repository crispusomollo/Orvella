import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Users, UserPlus, Key, UserCheck, Shield, ShieldAlert, Mail, Lock, X, Loader2, CheckCircle2, UserX } from 'lucide-react';
import axios from 'axios';

export default function UserManagementConsole({ operators }) {
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial operator identity registration state parameters
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        role: 'cashier',
        password: ''
    });

    // Revoke or restore system access credentials instantaneously
    const handleToggleUserStatus = (operatorId) => {
        axios.post(`/api/admin/users/${operatorId}/toggle-status`)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Failed to alter operator status.");
            });
    };

    const handleCreateUserSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        axios.post('/api/admin/users/store', userForm)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                setIsAddUserModalOpen(false);
                setIsSubmitting(false);
                setUserForm({ name: '', email: '', role: 'cashier', password: '' });
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Identity registration rejected.");
                setIsSubmitting(false);
            });
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Users className="text-indigo-600"/> Identity Access Control & User Management Workspace</h2>}
        >
            

            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* IDENTITY TOTALS PROFILE METRIC RIBBON */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-800">Active Node Operator Registry</h3>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">Currently monitoring and governing {operators.length} allocated system credentials across regional workspace databases.</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setIsAddUserModalOpen(true)}
                            className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md transition-colors"
                        >
                            <UserPlus size={13}/> Enroll Fresh Employee
                        </button>
                    </div>

                    {/* OPERATOR DATA DIRECTORY TABLE LEDGER CONTAINER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs font-semibold">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                        <th className="p-4">Employee Full Name</th>
                                        <th className="p-4">Secure Corporate Email</th>
                                        <th className="p-4">Assigned Role Privilege</th>
                                        <th className="p-4">Account Creation Stamp</th>
                                        <th className="p-4 text-center">Status Flag</th>
                                        <th className="p-4 text-right">Access Governance Keys</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                                    {operators.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-400 italic">
                                                Zero assigned user credentials located inside database configuration tables.
                                            </td>
                                        </tr>
                                    ) : (
                                        operators.map((op) => {
                                            const isActive = Boolean(op.is_active);
                                            return (
                                                <tr key={op.id} className={`hover:bg-slate-50/50 transition-colors border-l-2 ${isActive ? 'border-transparent' : 'border-l-rose-500 bg-rose-50/10'}`}>
                                                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2.5">
                                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] uppercase border ${isActive ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                            {op.name.charAt(0)}
                                                        </div>
                                                        {op.name}
                                                    </td>
                                                    <td className="p-4 font-mono font-bold text-slate-500 flex items-center gap-1.5">
                                                        <Mail size={12} className="text-slate-300"/> {op.email}
                                                    </td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                                            op.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                                                            op.role === 'pharmacist' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                                                            'bg-slate-50 text-slate-700 border-slate-100'
                                                        }`}>
                                                            <Shield size={10} className="stroke-[2.5]" /> {op.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-400 whitespace-nowrap">
                                                        {new Date(op.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-4 text-center whitespace-nowrap">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                            {isActive ? 'ACTIVE' : 'SUSPENDED'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right whitespace-nowrap">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleToggleUserStatus(op.id)}
                                                            className={`inline-flex items-center justify-center gap-1 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-2xs border transition-colors ${
                                                                isActive 
                                                                    ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' 
                                                                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                                                            }`}
                                                        >
                                                            {isActive ? <UserX size={11}/> : <UserCheck size={11}/>}
                                                            {isActive ? 'Revoke Access' : 'Restore Keys'}
                                                        </button>
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

            {/* FRESH IDENTITY ENROLLMENT FLOATING OVERLAY MODAL */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateUserSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Enroll Fresh Workspace Operator</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Assign a new cryptographically hashed system credential</p>
                            </div>
                            <button type="button" onClick={() => setIsAddUserModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="p-5 space-y-4 text-xs font-semibold">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Employee Full Name</label>
                                <input type="text" required placeholder="e.g. John Doe" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-medium" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Secure Corporate Email</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                    <input type="email" required placeholder="name@pharm_os.com" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-medium" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Assigned Role RBAC</label>
                                    <select className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500 font-bold uppercase tracking-wider text-slate-700" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                                        <option value="cashier">Cashier</option>
                                        <option value="pharmacist">Pharmacist</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Access Security Key</label>
                                    <div className="relative">
                                        <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input type="password" required minLength="8" placeholder="••••••••" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 font-mono bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FORM DISPATCH ACTIONS FOOTER */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setIsAddUserModalOpen(false)} 
                                className="w-1/3 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl py-2.5 text-center transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-2/3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl text-center transition-all shadow-md flex items-center justify-center gap-1.5"
                            >
                                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                                Commit Identity Matrix
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </AuthenticatedLayout>
    );
}

