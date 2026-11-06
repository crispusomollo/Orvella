import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { ShoppingBag, Truck, Calendar, Layers, Receipt, Clock, CheckCircle2, Eye, Loader2, ArrowUpRight } from 'lucide-react';
import axios from 'axios';

export default function ConsignmentIntake({ purchases, suppliers }) {
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [activePoItems, setActivePoItems] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Async drill-down lookup to fetch individual line items for an open PO
    const viewPurchaseDetails = (purchase) => {
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

    // Filter purchase orders based on their completion status
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
                        
                        {/* LEFT COLUMN: ACTIVE REQUISITIONS TRACKING QUEUE */}
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

                        {/* RIGHT COLUMN: REQUISITION ITEM VERIFICATION CONSOLE */}
                        <div className="lg:col-span-2 sticky top-4">
                            {selectedPurchase ? (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col max-h-[85vh]">
                                    <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex justify-between items-center">
                                        <span>Inspection: {selectedPurchase.purchase_order_number}</span>
                                        <button type="button" onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-white font-mono font-bold">X</button>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-4 flex-grow text-xs bg-slate-50">
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5 font-medium shadow-3xs">
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
                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-3xs">
                                                {activePoItems.map((item, idx) => (
                                                    <div key={idx} className="p-3 flex justify-between items-center">
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
                                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                                                        >
                                                            {isSubmitting ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={14}/>}
                                                            {isSubmitting ? "Receiving Delivery..." : "Accept Consignment Delivery Lot"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-medium h-48 flex flex-col items-center justify-center gap-2">
                                    <ShoppingBag size={24} className="text-slate-300"/> Select an open requisition header file from the queue to verify line metrics.
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
