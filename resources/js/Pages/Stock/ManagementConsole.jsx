import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Layers, Search, History, Settings, Edit3, Loader2, FileSpreadsheet, FileText, X } from 'lucide-react';
import axios from 'axios';

export default function ManagementConsole({ products, suppliers, filters }) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    
    // DRILL-DOWN ACCORDION DRAWER STATE CONTROLLERS
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [activeBatches, setActiveBatches] = useState([]);
    const [isBatchesLoading, setIsBatchesLoading] = useState(false);

    // MODAL WINDOW INTERACTION CONTROLLER TARGETS
    const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
    const [movementLogs, setMovementLogs] = useState(null);
    const [isMovementModalOpen, setIsMovementLogsModalOpen] = useState(false);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
    
    // DYNAMIC NEW PRODUCT REGISTRATION COMPONENT LOCAL HOOKS
    const [newProductForm, setNewProductForm] = useState({ name: '', generic_name: '', category: 'Tablet', reorder_level: '50', requires_prescription: false });
    const [adjustmentForm, setAdjustmentForm] = useState({ batch_id: '', quantity_delta: '', type: 'Correction', reason: '' });
    const [productBatchesForModal, setProductBatchesForModal] = useState([]);

    // Stream out direct filtered data matrices straight to Excel/PDF channels
    const handleCatalogExport = (format) => {
        if (format === 'excel') {
            window.location.href = route('products.export');
        } else {
            window.open(`/api/inventory/print-manifest?search=${encodeURIComponent(searchQuery)}`, '_blank');
        }
    };

    // Pull item movement chronology logs asynchronously
    const lookupProductMovement = (productId) => {
        axios.get(`/api/products/${productId}/movement`)
            .then(res => {
                setMovementLogs(res.data);
                setIsMovementLogsModalOpen(true);
            })
            .catch(err => alert("Failed to fetch movement trail histories."));
    };

    const toggleBatchInspectorDrawer = (productId) => {
        if (expandedProductId === productId) {
            setExpandedProductId(null);
            setActiveBatches([]);
            return;
        }
        setExpandedProductId(productId);
        setIsBatchesLoading(true);
        setActiveBatches([]);

        axios.get(`/api/products/${productId}/batches`)
            .then(res => {
                setActiveBatches(res.data);
                setIsBatchesLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsBatchesLoading(false);
            });
    };

    const handleRegisterProductSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/products/store', newProductForm)
            .then(res => {
                alert(res.data.message || "Medication catalogued successfully.");
                setNewProductForm({ name: '', generic_name: '', category: 'Tablet', reorder_level: '50', requires_prescription: false });
                router.reload({ preserveScroll: true });
            })
            .catch(err => alert(err.response?.data?.message || "Product allocation rejected."));
    };

    // REAL-TIME AUTO GENERATED SKU CODE PREVIEW LOGIC ENGINE
    const generateSkuPreview = () => {
        if (!newProductForm.name) return 'Awaiting Brand Name Input...';
        
        const cleanName = newProductForm.name.replace(/[^A-Za-z]/g, '');
        let prefix = cleanName.substring(0, 3).toUpperCase();
        while (prefix.length < 3) prefix += 'X';

        const categoryMap = {
            'Tablet': 'TAB',
            'Syrup': 'SYR',
            'Capsule': 'CAP',
            'Cream': 'CRM',
            'Lotion': 'LTN',
            'Powder': 'PWD',
            'Injectable': 'INJ'
        };
        const catAbbreviation = categoryMap[newProductForm.category] || 'GEN';

        return `${prefix}-${catAbbreviation}-XX (Auto-Assigned)`;
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Layers className="text-indigo-600"/> Medication Formulary Catalog & Inventory Console</h2>}
        >
            <Head title="Inventory Console" />

            <div className="py-6 bg-slate-100 min-h-screen space-y-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {/* SEARCH FILTER & EXPORT ACTION GATEWAY LAYOUT TOOLBAR */}
                    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-stretch">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Filter products by formulation name or barcode SKU..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    router.get(route('stock.management'), { search: e.target.value }, { preserveState: true, preserveScroll: true });
                                }}
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button type="button" onClick={() => handleCatalogExport('excel')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs uppercase tracking-wider transition-colors"><FileSpreadsheet size={14}/> Excel</button>
                            <button type="button" onClick={() => handleCatalogExport('pdf')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs uppercase tracking-wider transition-colors"><FileText size={14}/> PDF Manifest</button>
                        </div>
                    </div>

                                        {/* TWO-COLUMN MATRIX OVERLAY WORKSPACE GRIDS */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                        {/* LEFT COLUMN: ACTIVE DRUG CATALOG LEDGER LINES (COL-SPAN 3) */}
                        <div className="lg:col-span-3 space-y-3">
                            {products.data.length === 0 ? (
                                <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs font-medium">No registered drug formulations match active search conditions.</div>
                            ) : (
                                products.data.map(prod => {
                                    const isExpanded = expandedProductId === prod.id;
                                    return (
                                        <div key={prod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                                            <div onClick={() => toggleBatchInspectorDrawer(prod.id)} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer hover:bg-slate-50/50 select-none transition-colors">
                                                <div className="space-y-0.5 max-w-[60%]">
                                                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${parseInt(prod.stock) <= parseInt(prod.reorder_level) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                        {prod.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">SKU: {prod.sku} | Generic Name: {prod.generic_name || 'N/A'}</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-right sm:self-center">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Shelf Stock</p>
                                                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-black font-mono border ${parseInt(prod.stock) <= parseInt(prod.reorder_level) ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>{prod.stock} Units</span>
                                                    </div>
                                                    <span className="text-slate-300 font-bold font-mono text-xs hidden sm:inline">{isExpanded ? '▼' : '►'}</span>
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="bg-slate-50 border-t border-slate-200/60 p-4 space-y-4 animate-slide-down">
                                                    <div className="flex flex-wrap gap-2 pb-1 border-b border-slate-200/60">
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); lookupProductMovement(prod.id); }} className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-2xs uppercase tracking-wider transition-colors"><History size={12} className="text-slate-500" /> Stock Movement Logs</button>
                                                        <button 
    type="button" 
    onClick={(e) => { 
        e.stopPropagation(); 
        setProductBatchesForModal(activeBatches); // Inject currently compiled lot arrays into context 
        setAdjustmentForm({ batch_id: activeBatches[0]?.id || '', quantity_delta: '', type: 'Correction', reason: '' }); 
        setIsAdjustmentModalOpen(true); 
    }} 
    className="inline-flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-2xs uppercase tracking-wider transition-colors"
>
    <Settings size={12} className="text-slate-500" /> Batch Adjustments
</button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedProductForEdit(prod); }} className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-indigo-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg shadow-2xs uppercase tracking-wider transition-colors ml-auto"><Edit3 size={12} className="text-indigo-600" /> Edit Product Profile</button>
                                                    </div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 px-0.5"><Layers size={11} className="text-indigo-500" /> Active Component Batch Lots Breakdowns</h5>
                                                    {isBatchesLoading ? (
                                                        <div className="flex items-center justify-center py-6 text-slate-400 text-xs font-bold gap-2 font-mono"><Loader2 size={14} className="animate-spin text-indigo-500" /> Compiling live batch metrics...</div>
                                                    ) : activeBatches.length === 0 ? (
                                                        <p className="text-[11px] text-slate-400 italic font-medium py-2 px-1">No active, unexhausted batch layers currently provisioned for this formulation.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
                                                            <table className="w-full text-left text-xs border-collapse font-medium">
                                                                <thead className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                                                                    <tr><th className="p-3">Batch Number</th><th className="p-3 text-center">Remaining Quantity</th><th className="p-3 text-right">Unit Cost Price</th><th className="p-3 text-right">Retail Sell Price</th><th className="p-3 text-center">Expiration Tracking</th></tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100 text-slate-600">
                                                                    {activeBatches.map(batch => {
                                                                        const isExpired = new Date(batch.expiry_date) <= new Date();
                                                                        return (
                                                                            <tr key={batch.id} className="hover:bg-slate-50/40 transition-colors">
                                                                                <td className="p-3 font-mono font-bold text-slate-700">{batch.batch_number}</td>
                                                                                <td className="p-3 text-center font-mono font-bold text-slate-800">{batch.quantity_remaining} / {batch.quantity_received}</td>
                                                                                <td className="p-3 text-right font-mono text-slate-500">KES {parseFloat(batch.cost_price).toFixed(2)}</td>
                                                                                <td className="p-3 text-right font-mono font-bold text-slate-800">KES {parseFloat(batch.selling_price).toFixed(2)}</td>
                                                                                <td className="p-3 text-center whitespace-nowrap"><span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] border ${isExpired ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{isExpired ? 'LOT EXPIRED' : new Date(batch.expiry_date).toLocaleDateString()}</span></td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* RIGHT MATRIX PANEL: REGISTRATION & PRODUCT PROFILE UPDATE FORMS (COL-SPAN 2) */}
                        <div className="lg:col-span-2 space-y-4 sticky top-4">
                            {selectedProductForEdit ? (
                                <div className="bg-white rounded-xl border border-indigo-200 shadow-md overflow-hidden flex flex-col ring-1 ring-indigo-500/5 animate-scale-up">
                                    <div className="p-4 bg-indigo-900 text-white font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                                        <span>⚙️ Modify Formulation Profile</span>
                                        <button type="button" onClick={() => setSelectedProductForEdit(null)} className="text-indigo-300 hover:text-white font-bold text-[10px] uppercase font-mono">Cancel</button>
                                    </div>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        const formEl = e.target;
                                        axios.post('/api/products/update', {
                                            product_id: selectedProductForEdit.id,
                                            name: formEl.elements.edit_name.value,
                                            generic_name: formEl.elements.edit_generic.value,
                                            reorder_level: parseInt(formEl.elements.edit_reorder.value)
                                        })
                                        .then(res => {
                                            alert("Product layout adjustments saved cleanly.");
                                            setSelectedProductForEdit(null);
                                            router.reload({ preserveScroll: true });
                                        })
                                        .catch(err => alert("Profile update rejected."));
                                    }} className="p-5 space-y-4 text-xs font-semibold">
                                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Brand Name</label><input type="text" name="edit_name" required defaultValue={selectedProductForEdit.name} className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500" /></div>
                                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Generic Formulation</label><input type="text" name="edit_generic" required defaultValue={selectedProductForEdit.generic_name} className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500" /></div>
                                        <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Reorder Level Threshold</label><input type="number" name="edit_reorder" required defaultValue={selectedProductForEdit.reorder_level} className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono" /></div>
                                        <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">Commit Profile Overwrites</button>
                                    </form>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">➕ Register New Medication Formulation</div>
                                    <form onSubmit={handleRegisterProductSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-600">
                                        
                                        {/* READ-ONLY LIVE GENERATED SKU VISUALIZER FIELD */}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Generated SKU (Read-Only)</label>
                                            <input 
                                                type="text" 
                                                readOnly 
                                                className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-100 font-mono text-slate-500 font-bold select-none cursor-not-allowed" 
                                                value={generateSkuPreview()} 
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Brand / Commercial Name</label>
                                            <input type="text" required placeholder="e.g., Panadol Extra Tabs" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold" value={newProductForm.name} onChange={e => setNewProductForm({...newProductForm, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Medication Form Category</label>
                                            <select 
                                                required 
                                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold text-xs text-slate-700 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                                value={newProductForm.category}
                                                onChange={e => setNewProductForm({...newProductForm, category: e.target.value})}
                                            >
                                                <option value="Tablet">Tablet / Caplet (TAB)</option>
                                                <option value="Syrup">Syrup / Oral Suspension (SYR)</option>
                                                <option value="Capsule">Gel Capsule Medication (CAP)</option>
                                                <option value="Cream">Topical Application Cream (CRM)</option>
                                                <option value="Lotion">Dermatological Body Lotion (LTN)</option>
                                                <option value="Powder">Soluble Effervescent Powder (PWD)</option>
                                                <option value="Injectable">Intravenous Injectable (INJ)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chemical Generic Molecule Formulation</label>
                                            <input type="text" required placeholder="e.g., Paracetamol + Caffeine" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold" value={newProductForm.generic_name} onChange={e => setNewProductForm({...newProductForm, generic_name: e.target.value})} />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4 items-center">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reorder Limit Threshold</label>
                                                <input type="number" required placeholder="50" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 font-bold" value={newProductForm.reorder_level} onChange={e => setNewProductForm({...newProductForm, reorder_level: e.target.value})} />
                                            </div>
                                            <div className="flex items-center justify-between border border-slate-200 bg-slate-50 p-2.5 rounded-xl h-[38px] mt-4 select-none">
                                                <label htmlFor="rx_toggle" className="text-[10px] font-black uppercase text-slate-500 tracking-wider cursor-pointer">Requires Rx script?</label>
                                                <input id="rx_toggle" type="checkbox" className="rounded border-slate-300 text-indigo-600 h-4 w-4 focus:ring-indigo-500 cursor-pointer" checked={newProductForm.requires_prescription} onChange={e => setNewProductForm({...newProductForm, requires_prescription: e.target.checked})} />
                                            </div>
                                        </div>
                                        <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md text-center mt-2">Catalogue Medication Product Row</button>
                                    </form>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
            {/* MODAL WINDOWS FOR MOVEMENTS & ADJUSTMENTS */}
            {isMovementModalOpen && movementLogs && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Stock Mutation Flow Analysis Ledger</h4>
                                <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">Formulation Trace: {movementLogs.product}</p>
                            </div>
                            <button type="button" onClick={() => setIsMovementLogsModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={14}/></button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2 flex-grow bg-slate-50 text-xs">
                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                                {movementLogs.movement_ledger.length === 0 ? (
                                    <p className="p-6 text-center text-slate-400 font-medium">No logistical entries found on tracking logs.</p>
                                ) : (
                                    movementLogs.movement_ledger.map((log, idx) => (
                                        <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/50">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black font-mono border uppercase tracking-wider ${log.qty > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{log.type}</span>
                                                    <span className="text-[10px] font-mono text-slate-400 font-bold">{new Date(log.created_at_iso).toLocaleString()}</span>
                                                </div>
                                                <p className="text-slate-500 text-[10px] font-mono mt-1">Lot Balance Tag: {log.batch_number} | Source Ref: {log.description}</p>
                                            </div>
                                            <span className={`font-mono font-black text-xs ${log.qty > 0 ? 'text-emerald-600' : 'text-rose-700'}`}>{log.qty > 0 ? `+${log.qty}` : log.qty} Units</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* BATCH ADJUSTMENT MANIFEST */}
            {isAdjustmentModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        axios.post('/api/products/adjust-stock', adjustmentForm)
                            .then(res => {
                                alert(res.data.message || "Stock variance logged cleanly.");
                                setIsAdjustmentModalOpen(false);
                                setAdjustmentForm({ batch_id: '', quantity_delta: '', type: 'Correction', reason: '' });
                                router.reload({ preserveScroll: true });
                            })
                            .catch(err => alert(err.response?.data?.message || "Adjustment request rejected."));
                    }} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Log Batch Stock Adjustment</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Reconcile physical shelf inventory discrepancies manually</p>
                            </div>
                            <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="p-5 space-y-4 text-xs font-semibold">
                            <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-400">Target Product Batch Lot</label>
        {productBatchesForModal.length === 0 ? (
            <div className="w-full bg-amber-50 border border-amber-100 text-amber-800 text-[11px] p-2.5 rounded-lg font-medium">
                Warning: No active, unexhausted component batches loaded on layout memory. Close modal and expand product first.
            </div>
        ) : (
            <select 
                required 
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs font-mono font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                value={adjustmentForm.batch_id} 
                onChange={e => setAdjustmentForm({...adjustmentForm, batch_id: e.target.value})}
            >
                <option value="">-- Choose Batch Lot Layer --</option>
                {productBatchesForModal.map(batch => (
                    <option key={batch.id} value={batch.id}>
                        Lot: {batch.batch_number} (Rem: {batch.quantity_remaining} Units • Exp: {new Date(batch.expiry_date).toLocaleDateString()})
                    </option>
                ))}
            </select>
        )}
    </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Quantity Delta</label>
                                    <input type="number" required placeholder="e.g. -5 or 10" className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-mono text-xs focus:ring-1 focus:ring-indigo-500" value={adjustmentForm.quantity_delta} onChange={e => setAdjustmentForm({...adjustmentForm, quantity_delta: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400">Adjustment Type</label>
                                    <select className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500" value={adjustmentForm.type} onChange={e => setAdjustmentForm({...adjustmentForm, type: e.target.value})}>
                                        <option value="Correction">Correction</option>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Expired">Expired</option>
                                        <option value="Reconciliation">Reconciliation</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Justification Reason</label>
                                <input type="text" required placeholder="e.g. Broken ampoule during storage transit" className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 text-xs focus:ring-1 focus:ring-indigo-500" value={adjustmentForm.reason} onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="w-1/3 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl py-2.5 text-center transition-colors">Cancel</button>
                            <button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl text-center transition-all shadow-md">Post Adjustment Log</button>
                        </div>
                    </form>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
