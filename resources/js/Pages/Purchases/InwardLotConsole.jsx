import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Layers, CheckCircle, AlertCircle, ShoppingBag, ClipboardCopy, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function InwardLotConsole({ suppliers, products }) {
    const [supplierId, setSupplierId] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);

    // NEW PREDICTIVE PROCUREMENT TRACKING BOUNDS
    const [stagedPoContext, setStagedPoContext] = useState(null);

    // Intercept dropdown changes to check for unreceived auto-draft orders
    useEffect(() => {
        if (!supplierId) {
            setStagedPoContext(null);
            return;
        }
        
        axios.get(`/api/purchases/supplier/${supplierId}/pending-po`)
            .then(res => {
                if (res.data.has_pending) {
                    setStagedPoContext(res.data);
                } else {
                    setStagedPoContext(null);
                }
            })
            .catch(() => setStagedPoContext(null));
    }, [supplierId]);

    const handleAutoloadStagedPoItems = () => {
        if (!stagedPoContext) return;
        setItems(stagedPoContext.items);
        setStatusMessage({
            type: 'success',
            text: `Loaded ${stagedPoContext.items.length} items from predictive procurement draft [${stagedPoContext.po_number}]. Please input physical Batch Numbers and Expiry Dates.`
        });
    };

    const addNewRowItem = () => {
        setItems([...items, {
            product_id: '',
            consignment_batch_number: '',
            qty_purchased: '',
            unit_cost: '',
            suggested_retail_price: '',
            batch_expiry_date: ''
        }]);
    };

    const removeRowItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItemRowField = (index, key, value) => {
        setItems(items.map((item, i) => i === index ? { ...item, [key]: value } : item));
    };
    const calculateGrandTotalPayable = () => {
        return items.reduce((acc, row) => {
            const cost = parseFloat(row.unit_cost || 0);
            const qty = parseInt(row.qty_purchased || 0);
            return acc + (cost * qty);
        }, 0).toFixed(2);
    };

    /*const handleProcurementSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert("Procurement Error: You must append at least one inventory lot row item.");
            return;
        }

        axios.post('/api/purchases/receive', {
            supplier_id: parseInt(supplierId),
            delivery_date: deliveryDate,
            items: items.map(i => ({
                ...i,
                product_id: parseInt(i.product_id),
                qty_purchased: parseInt(i.qty_purchased),
                unit_cost: parseFloat(i.unit_cost),
                suggested_retail_price: parseFloat(i.suggested_retail_price)
            }))
        })
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setItems([]);
            setSupplierId('');
            setStagedPoContext(null);
        })
        .catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Stock acquisition ingestion failed." }));
    };*/

    /*const handleProcurementSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert("Procurement Error: You must append at least one inventory lot row item.");
            return;
        }

        axios.post('/api/purchases/receive', {
            supplier_id: parseInt(supplierId),
            delivery_date: deliveryDate,
            // FIXED: Passes the active staged purchase primary key context to clear it from the queue
            purchase_id: stagedPoContext ? stagedPoContext.purchase_id : null, 
            items: items.map(i => ({
                ...i,
                product_id: parseInt(i.product_id),
                qty_purchased: parseInt(i.qty_purchased),
                unit_cost: parseFloat(i.unit_cost),
                suggested_retail_price: parseFloat(i.suggested_retail_price)
            }))
        })
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setItems([]);
            setSupplierId('');
            setStagedPoContext(null); // Clear context tracking memory
        })
        .catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Stock acquisition ingestion failed." }));
    };*/


    
    const handleProcurementSubmit = (e) => {
        e.preventDefault();
        if (items.length === 0) {
            alert("Procurement Error: You must append at least one inventory lot row item.");
            return;
        }

        axios.post('/api/purchases/receive', {
            supplier_id: parseInt(supplierId),
            delivery_date: deliveryDate,
            // FIXED: Passes the active staged purchase primary key context to clear it from the queue
            purchase_id: stagedPoContext ? stagedPoContext.purchase_id : null, 
            items: items.map(i => ({
                ...i,
                product_id: parseInt(i.product_id),
                qty_purchased: parseInt(i.qty_purchased),
                unit_cost: parseFloat(i.unit_cost),
                suggested_retail_price: parseFloat(i.suggested_retail_price)
            }))
        })
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setItems([]);
            setSupplierId('');
            setStagedPoContext(null); // Clear context tracking memory
        })
        .catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Stock acquisition ingestion failed." }));
    };



    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><ShoppingBag className="text-indigo-600"/> Inbound Purchase Orders & Supplier Consignment Intake Ledger</h2>}
        >
            <Head title="Supplier Stock Intake" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    
                    {statusMessage && (
                        <div className={`p-4 mb-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleProcurementSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                        
                        {/* HEADER INPUT CONTROLS + CONDITIONAL PO POPULATOR PROMPT */}
                        <div className="p-5 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-end justify-between">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow w-full">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Acquisition Consignment Supplier Wholesaler</label>
                                    <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-white focus:ring-1 focus:ring-indigo-500 font-medium" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                                        <option value="">-- Select Sourcing Wholesaler Partner --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Delivery Reception Date</label>
                                    <input type="date" required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 bg-white focus:ring-1 focus:ring-indigo-500 font-mono" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                                </div>
                            </div>

                            {/* PREDICTIVE LOADER ACTIONS SLIDE-IN PROMPT CONTAINER */}
                            {stagedPoContext && (
                                <button
                                    type="button"
                                    onClick={handleAutoloadStagedPoItems}
                                    className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all shrink-0 animate-pulse hover:animate-none"
                                >
                                    <ClipboardCopy size={13}/> Load Staged Auto-PO ({stagedPoContext.items.length} Lines)
                                </button>
                            )}
                        </div>
                        {/* SECTION 2: DYNAMIC LOT ROW MATRIX ENTRY LINES */}
                        <div className="p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Layers size={14}/> Inbound Consignment Item Array</h3>
                                <button type="button" onClick={addNewRowItem} className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors">
                                    <Plus size={14}/> Append Line Item
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl text-xs font-medium">
                                    No item lines appended yet. Click "Append Line Item" above to add rows.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((row, index) => (
                                        <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end relative">
                                            
                                            <div className="space-y-1 lg:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Target Product Formulation</label>
                                                <select required className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white" value={row.product_id} onChange={e => updateItemRowField(index, 'product_id', e.target.value)}>
                                                    <option value="">-- Choose Formulation --</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Batch Number</label>
                                                <input type="text" required placeholder="e.g. BNT-4402" className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white font-mono" value={row.consignment_batch_number} onChange={e => updateItemRowField(index, 'consignment_batch_number', e.target.value)} />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Qty Received</label>
                                                <input type="number" required placeholder="100" className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white font-mono" value={row.qty_purchased} onChange={e => updateItemRowField(index, 'qty_purchased', e.target.value)} />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Unit Cost (KES)</label>
                                                <input type="number" step="0.01" required placeholder="1.20" className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white font-mono" value={row.unit_cost} onChange={e => updateItemRowField(index, 'unit_cost', e.target.value)} />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Retail Price (KES)</label>
                                                <input type="number" step="0.01" required placeholder="2.50" className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white font-mono" value={row.suggested_retail_price} onChange={e => updateItemRowField(index, 'suggested_retail_price', e.target.value)} />
                                            </div>

                                            <div className="space-y-1 lg:col-span-2">
                                                <label className="text-[9px] font-black uppercase text-slate-400">Expiration Timeline Date</label>
                                                <input type="date" required className="w-full border border-slate-200 rounded-md text-xs p-2 bg-white font-mono" value={row.batch_expiry_date} onChange={e => updateItemRowField(index, 'batch_expiry_date', e.target.value)} />
                                            </div>

                                            <div className="lg:col-span-4 text-right">
                                                <button type="button" onClick={() => removeRowItem(index)} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg transition-colors">
                                                    <Trash2 size={12}/> Purge Line Row
                                                </button>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SECTION 3: CALCULATION SUMMARY ACCUMULATOR FOOTER */}
                        <div className="p-5 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Liabilities Total</p>
                                <h3 className="text-xl font-black text-slate-900 font-mono">KES {calculateGrandTotalPayable()}</h3>
                            </div>
                            <button type="submit" disabled={items.length === 0} className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-md transition-all text-center">
                                Ingest Inbound Consignment PO
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
