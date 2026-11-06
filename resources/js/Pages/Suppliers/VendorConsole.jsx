import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { Landmark, Building, Link2, PlusCircle, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import axios from 'axios';

export default function VendorConsole({ suppliers, products }) {
    const [activeTab, setActiveTab] = useState('vendor'); // vendor or link forms
    const [statusMessage, setStatusMessage] = useState(null);

    // Supplier Profile Payload State
    const [vendorForm, setVendorForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
    
    // Mapping Relationship Payload State
    const [linkForm, setLinkForm] = useState({ supplier_id: '', product_id: '', contract_cost_price: '' });

    const handleVendorSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/suppliers/store', vendorForm)
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setVendorForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
            window.location.reload();
        })
        .catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Supplier creation failed." }));
    };

    const handleLinkSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/suppliers/link-product', linkForm)
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setLinkForm({ supplier_id: '', product_id: '', contract_cost_price: '' });
            window.location.reload();
        })
        .catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Procurement mapping failed." }));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Building className="text-indigo-600"/> Wholesaler Partner Portals & Supply Catalog Matrix</h2>}
        >
            <Head title="Supplier Portals" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                        {/* LEFT COLUMN: ACTIVE SUPPLIER PORTFOLIO DIRECTORY */}
                        <div className="lg:col-span-3 space-y-4">
                            {suppliers.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 font-medium text-xs">
                                    No strategic wholesaler partners registered in directory networks.
                                </div>
                            ) : (
                                suppliers.map(sup => (
                                    <div key={sup.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-sm text-white flex items-center gap-2"><Building size={16} className="text-indigo-400"/> {sup.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Contact: {sup.contact_person || 'N/A'} | Tel: {sup.phone || 'N/A'}</p>
                                            </div>
                                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-black font-mono uppercase">{sup.products.length} Mapped Lines</span>
                                        </div>
                                        
                                        {/* SUITE OF EMBEDDED ELIGIBLE DRUG LINES */}
                                        <div className="p-3 bg-slate-50">
                                            {sup.products.length === 0 ? (
                                                <p className="text-[11px] text-slate-400 italic p-1">No formulation lines mapped to this vendor's procurement channel yet.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {sup.products.map(p => (
                                                        <span key={p.id} className="inline-flex items-center gap-1 text-[11px] font-bold bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg shadow-2xs font-mono">
                                                            <Briefcase size={12} className="text-slate-400" /> {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* RIGHT COLUMN: LINK FORMS INTENDED MATRIX CONTROLS */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex border-b border-slate-200 bg-slate-50">
                                <button onClick={() => setActiveTab('vendor')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 ${activeTab === 'vendor' ? 'border-indigo-600 text-indigo-600 bg-white font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><PlusCircle size={14}/> Add Supplier</button>
                                <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 ${activeTab === 'link' ? 'border-indigo-600 text-indigo-600 bg-white font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><Link2 size={14}/> Map Supply Lines</button>
                            </div>

                                                        <div className="p-5">
                                {activeTab === 'vendor' && (
                                    <form onSubmit={handleVendorSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Distributor Corporate Name</label>
                                            <input type="text" required placeholder="e.g., AstraPharma Distribution Ltd" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Contact Representative Person</label>
                                            <input type="text" required placeholder="e.g., Jane Koech" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={vendorForm.contact_person} onChange={e => setVendorForm({...vendorForm, contact_person: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Telephone Number Phone</label>
                                                <input type="text" required placeholder="e.g., +254711223344" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-mono" value={vendorForm.phone} onChange={e => setVendorForm({...vendorForm, phone: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Corporate Mailing Email</label>
                                                <input type="email" required placeholder="e.g., orders@astrapharma.co.ke" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Physical HQ Depots Address</label>
                                            <textarea rows="2" placeholder="e.g., Mombasa Road, Nairobi, Kenya" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={vendorForm.address} onChange={e => setVendorForm({...vendorForm, address: e.target.value})}></textarea>
                                        </div>
                                        <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">Catalogue Wholesaler Profile</button>
                                    </form>
                                )}

                                {activeTab === 'link' && (
                                    <form onSubmit={handleLinkSubmit} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Target Wholesaler Partner</label>
                                            <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-medium" value={linkForm.supplier_id} onChange={e => setLinkForm({...linkForm, supplier_id: e.target.value})}>
                                                <option value="">-- Choose Wholesaler --</option>
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Authorize Eligible Medication Formula</label>
                                            <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-medium" value={linkForm.product_id} onChange={e => setLinkForm({...linkForm, product_id: e.target.value})}>
                                                <option value="">-- Choose Formulation --</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Negotiated Contract Purchase Cost (Optional)</label>
                                            <input type="number" step="0.01" placeholder="e.g., 0.12" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-mono" value={linkForm.contract_cost_price} onChange={e => setLinkForm({...linkForm, contract_cost_price: e.target.value})} />
                                        </div>
                                        <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">Bind Supply Channel Contract</button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
