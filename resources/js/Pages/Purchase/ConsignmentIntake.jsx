import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShoppingBag, Truck, Calendar, Layers, Clock, CheckCircle2, Eye, Loader2, ArrowUpRight, ArrowDown, FileSpreadsheet, Plus, Upload } from 'lucide-react';
import axios from 'axios';

// DUAL-MODE COMPONENT EXTENSION: BULK DATA IMPORT WIDGET LAYER
function BulkInventoryImporterWidget({ suppliers, onImportSuccess }) {
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImportSubmit = (e) => {
        e.preventDefault();
        if (!selectedSupplier || !csvFile) {
            alert("Validation Guard: Please select a sourcing wholesaler and attach a formatted CSV template sheet.");
            return;
        }

        setIsUploading(true);
        const payload = new FormData();
        payload.append('supplier_id', selectedSupplier);
        payload.append('delivery_date', deliveryDate);
        payload.append('csv_file', csvFile);

        axios.post('/api/purchases/import-csv', payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            alert(res.data.message);
            setCsvFile(null);
            setIsUploading(false);
            document.getElementById('bulk_csv_file_input_node').value = '';
            if (onImportSuccess) onImportSuccess();
        })
        .catch(err => {
            alert(err.response?.data?.message || "Spreadsheet upload rejected due to formatting constraint failures.");
            setIsUploading(false);
        });
    };

    return (
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs font-semibold text-slate-600 animate-slide-down">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Origin Wholesaler Distributor</label>
                <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 font-medium text-slate-800" value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                    <option value="">-- Choose Sourcing Partner --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Delivery Inward Date</label>
                <input type="date" required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-slate-50 font-mono text-slate-800" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Attach Populated Data Template Sheet (.CSV)</label>
                <input id="bulk_csv_file_input_node" type="file" required accept=".csv" className="w-full text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-300" onChange={e => setCsvFile(e.target.files[0])} />
            </div>
            <button type="submit" disabled={isUploading} className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
                {isUploading ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
                {isUploading ? "Parsing Spreadsheet Data..." : "Execute Bulk Stock Import"}
            </button>
        </form>
    );
}

export default function ConsignmentIntake({ purchases, suppliers }) {
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [activePoItems, setActivePoItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic right panel controller layout state tracking
    const [rightPanelConsoleMode, setRightPanelConsoleMode] = useState('import'); 

    const viewPurchaseDetails = (purchase) => {
        setRightPanelConsoleMode('inspect');
        setSelectedPurchase(purchase);
        setIsDetailLoading(true);
        setActivePoItems([]);

        axios.get(`/api/purchases/${purchase.id}/items`)
            .then(res => {
                setActivePoItems(res.data);
                setIsDetailLoading(false);
            })
            .catch(() => {
                setIsDetailLoading(false);
                alert("Failed to pull consignment item descriptions.");
            });
    };

    const pendingDeliveriesQueue = purchases.filter(p => p.status === 'Pending_Delivery');
    const completedDeliveriesHistory = purchases.filter(p => p.status === 'Received');

    const handleConfirmStagedArrivalCheckIn = (purchaseId) => {
        if (!confirm("Confirm bulk delivery check-in? This action increments your stock balances and appends supplier account liabilities.")) return;
        
        setIsSubmitting(true);
        axios.post(`/api/purchases/${purchaseId}/bulk-receive-staged`)
            .then(res => {
                alert(res.data.message);
                setIsSubmitting(false);
                setSelectedPurchase(null);
                setRightPanelConsoleMode('import');
                router.reload({ preserveScroll: true });
            })
            .catch(err => {
                alert(err.response?.data?.message || "Stock intake processing error.");
                setIsSubmitting(false);
            });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><ShoppingBag className="text-indigo-600"/> Inward Consignments & Supplier Requisitions Queue</h2>}
        >
            <Head title="Inward Purchases" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-5">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                                                {/* LEFT COLUMN: ACTIVE REQUISITIONS TRACKING DIRECTORY PIPELINES */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                                <div className="p-3.5 bg-amber-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14}/> Staged Predictive Procurement Orders Queue (Pending Intake)
                                </div>
                                <div className="p-4 space-y-2">
                                    {pendingDeliveriesQueue.length === 0 ? (
                                        <p className="text-center py-6 text-slate-400 font-medium text-xs italic">No open auto-drafted supplier purchase orders found.</p>
                                    ) : (
                                        pendingDeliveriesQueue.map(po => (
                                            <div key={po.id} className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl flex items-center justify-between transition-all cursor-pointer" onClick={() => viewPurchaseDetails(po)}>
                                                <div className="space-y-1">
                                                    <p className="font-mono font-black text-slate-800 text-xs flex items-center gap-1.5">
                                                        <Truck size={13} className="text-amber-500"/> {po.purchase_order_number}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                        Wholesaler: <span className="text-slate-600">{po.supplier?.name || 'Linked Partner'}</span> | Lines: <span className="text-indigo-600 font-mono">{po.total_items_count || 0} Items</span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Cost Due</p>
                                                    <p className="font-mono font-black text-xs text-slate-900 mt-0.5">KES {parseFloat(po.grand_total).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-3.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                                    📦 Checked-In Historical Delivery Lot Manifests
                                </div>
                                <div className="divide-y divide-slate-100 bg-white max-h-96 overflow-y-auto">
                                    {completedDeliveriesHistory.length === 0 ? (
                                        <p className="p-8 text-center text-slate-400 text-xs font-medium italic">No historical stock intakes registered.</p>
                                    ) : (
                                        completedDeliveriesHistory.map(hist => (
                                            <div key={hist.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/40 cursor-pointer text-xs" onClick={() => viewPurchaseDetails(hist)}>
                                                <div className="space-y-0.5">
                                                    <p className="font-mono font-bold text-slate-700">{hist.purchase_order_number}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">{hist.supplier?.name} • Received: {hist.delivery_date}</p>
                                                </div>
                                                <span className="font-mono font-black text-slate-700">KES {parseFloat(hist.grand_total).toFixed(2)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: INTERACTIVE SWITCHING INGESTION CONSOLE */}
                        <div className="lg:col-span-2 sticky top-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="flex border-b border-slate-200 bg-slate-50 text-center">
                                                                <button type="button" onClick={() => setRightPanelConsoleMode('import')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all ${rightPanelConsoleMode === 'import' ? 'border-indigo-600 text-indigo-600 bg-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                                    <FileSpreadsheet size={14}/> Bulk Spreadsheet Import
                                </button>
                                <button type="button" disabled={!selectedPurchase} onClick={() => setRightPanelConsoleMode('inspect')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 transition-all ${rightPanelConsoleMode === 'inspect' ? 'border-indigo-600 text-indigo-600 bg-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed'}`}>
                                    <Eye size={14}/> Verify Staged PO
                                </button>
                            </div>

                            <div className="p-5 flex-grow">
                                {rightPanelConsoleMode === 'import' && (
                                    <BulkInventoryImporterWidget 
                                        suppliers={suppliers} 
                                        onImportSuccess={() => router.reload({ preserveScroll: true })} 
                                    />
                                )}

                                {rightPanelConsoleMode === 'inspect' && selectedPurchase && (
                                    <div className="space-y-4 animate-slide-down text-xs">
                                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 font-medium">
                                            <p className="flex justify-between text-[11px]"><span>Supplier Account:</span> <span className="font-bold text-slate-900">{selectedPurchase.supplier?.name}</span></p>
                                            <p className="flex justify-between"><span>Staging Time:</span> <span className="font-mono font-bold text-slate-600">{new Date(selectedPurchase.created_at).toLocaleString()}</span></p>
                                            <p className="flex justify-between border-t border-slate-100 pt-1.5 mt-1"><span>Current Status:</span> 
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${selectedPurchase.status === 'Pending_Delivery' ? 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                    {selectedPurchase.status}
                                                </span>
                                            </p>
                                        </div>

                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-0.5">Itemized Requisition Manifest Breakdown</h4>
                                        
                                        {isDetailLoading ? (
                                            <div className="flex items-center justify-center py-8 font-mono text-slate-400 font-bold gap-2"><Loader2 className="animate-spin text-indigo-500" size={14}/> Fetching lot lines...</div>
                                        ) : (
                                            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                                                {activePoItems.map((item, idx) => (
                                                    <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50/30">
                                                        <div className="space-y-0.5 max-w-[70%]">
                                                            <p className="font-bold text-slate-800 leading-tight">{item.product?.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">SKU: {item.product?.sku}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-slate-900 font-mono text-xs">× {item.qty_purchased} Units</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">@ KES {parseFloat(item.unit_cost).toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                {selectedPurchase.status === 'Pending_Delivery' && (
                                                    <div className="p-3 bg-slate-50 text-center">
                                                        <button 
                                                            type="button" 
                                                            disabled={isSubmitting}
                                                            onClick={() => handleConfirmStagedArrivalCheckIn(selectedPurchase.id)}
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>}
                                                            {isSubmitting ? "Receiving Delivery..." : "Accept Consignment Delivery Lot"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
