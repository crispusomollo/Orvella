import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link, usePage  } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Trash2, CreditCard, CheckCircle, AlertCircle, Plus, Minus, UserMinus, User, ChevronLeft, ChevronRight, FileText, Lock, Sparkles, LogOut, Loader2, DollarSign, UserCheck, Download } from 'lucide-react';
import axios from 'axios';

export default function Register({ productsData, shiftTotals, filters }) {
    // Core Layout Configuration States
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    // STEP 2 SYSTEMATIC REGISTRY: PULL ACTIVE BRANDING CONSTANTS OUT OF INERTIA INDICES
    const { props } = usePage();
    const corporateBranding = props.corporateBranding;

    const [localProducts, setLocalProducts] = useState(productsData.data);
    const [isSearchingInventory, setIsSearchingInventory] = useState(false);
    
    const [basket, setBasket] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [statusMessage, setStatusMessage] = useState(null);
    
    // Receipt Modal Print State Engines
    const [activeReceipt, setActiveReceipt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Live Prescriptions Queue States
    const [pendingScripts, setPendingScripts] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [mappedPrescriptionId, setMappedPrescriptionId] = useState(null);

    // NEW REAL-TIME PATIENT LOOKUP STATES
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [isSearchingPatients, setIsSearchingPatients] = useState(false);

    // Sales History Explorer States initialized safely with open boundaries
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [salesHistoryData, setSalesHistoryData] = useState([]);
    const [historyFilters, setHistoryFilters] = useState({ 
        query: '', 
        start_date: '', // Keeps inputs open for broad scanning on initial load
        end_date: '', 
        payment_method: '' 
    });
    const [isSearchingHistory, setIsSearchingHistory] = useState(false);


    // FIXED: Fully optimized asynchronous sales ledger stream mapper
    useEffect(() => {
        if (!isHistoryModalOpen) return;

        setIsSearchingHistory(true);

        // Build clean query payload objects dynamically
        const cleanParams = {};
        Object.entries(historyFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value.toString().trim() !== '') {
                cleanParams[key] = value.toString().trim();
            }
        });

        const params = new URLSearchParams(cleanParams).toString();

        const delayDebounceFn = setTimeout(() => {
            axios.get(`/api/pos/sales-history?${params}`)
                .then(res => {
                    // DEFENSIVE PAYLOAD UNWRAPPING: Safely intercept paginated data layers
                    if (res.data && res.data.data) {
                        setSalesHistoryData(res.data.data);
                    } else if (Array.isArray(res.data)) {
                        setSalesHistoryData(res.data);
                    } else {
                        setSalesHistoryData([]);
                    }
                    setIsSearchingHistory(false);
                })
                .catch(err => {
                    console.error("Ledger connection aborted or missing:", err);
                    setSalesHistoryData([]);
                    setIsSearchingHistory(false);
                });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [historyFilters, isHistoryModalOpen]);


    /*const handleReprintTrigger = (saleId) => {
        axios.get(`/api/pos/sales/${saleId}/reprint`)
            .then(res => {
                if (res.data.invoice) {
                    // Update active receipt context state structures
                    setActiveReceipt(res.data.invoice);
                    // Automatically populates the item lines list mapping back into memory
                    setBasket(res.data.invoice.items.map(item => ({
                        product_id: item.product_id,
                        name: item.product?.name,
                        quantity: item.quantity,
                        price: parseFloat(item.unit_price)
                    })));
                    setIsModalOpen(true); // Pops the printable receipt preview overlay
                }
            })
            .catch(err => alert("Reprint pipeline connection error."));
    };*/

        // FIXED: Maps relational backend items directly into the receipt overlay preview canvas
    const handleReprintTrigger = (saleId) => {
        axios.get(`/api/pos/sales/${saleId}/reprint`)
            .then(res => {
                if (res.data.invoice) {
                    const invoiceData = res.data.invoice;

                    // 1. Close history drawer console to keep workspace tidy
                    setIsHistoryModalOpen(false);

                    // 2. Set the active receipt context head record parameters
                    setActiveReceipt(invoiceData);

                    // 3. Populate basket matrix lines with loaded relational database properties
                    if (invoiceData.items && invoiceData.items.length > 0) {
                        setBasket(invoiceData.items.map(item => ({
                            product_id: item.product_id,
                            name: item.product?.name || 'Unknown Medication',
                            quantity: parseInt(item.quantity),
                            price: parseFloat(item.unit_price)
                        })));
                    } else {
                        setBasket([]);
                    }

                    // 4. Fire the modal print dialogue canvas open trigger
                    setIsModalOpen(true);
                }
            })
            .catch(err => {
                console.error("Reprint fetch failure:", err);
                alert("Reprint Pipeline Fault: Could not fetch structural invoice line details from the server.");
            });
    };


    // End of Shift Reconciliation Modal States
    const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
    const [reconcileForm, setReconcileForm] = useState({ actual_cash: '', actual_mpesa: '', actual_card: '', discrepancy_notes: '' });

    const [discount, setDiscount] = useState(0);
    const [isSplitPayment, setIsSplitPayment] = useState(false);
    const [splitAmounts, setSplitAmounts] = useState({
        'Cash': '',
        'M-Pesa': '',
        'Card': ''
    });

    useEffect(() => {
        fetchActivePrescriptionQueue();
    }, []);
    
    // Real-time inventory text lookup loop via asynchronous backend routes
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setLocalProducts(productsData.data);
            return;
        }
        
        setIsSearchingInventory(true);
        const delayDebounceFn = setTimeout(() => {
            axios.get(`/api/inventory-lookup?query=${searchQuery}`)
                .then(res => {
                    setLocalProducts(res.data);
                    setIsSearchingInventory(false);
                })
                .catch(err => {
                    console.error("Inventory fetch error:", err);
                    setIsSearchingInventory(false);
                });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, productsData.data]);

    // ASYNC PATIENT LOOKUP DEBOUNCED TRIGGER EFFECT
    useEffect(() => {
        if (patientSearchQuery.trim().length < 2) {
            setPatientSearchResults([]);
            return;
        }

        setIsSearchingPatients(true);
        const delayDebounceFn = setTimeout(() => {
            axios.get(`/api/patients-search?query=${patientSearchQuery}`)
                .then(res => {
                    setPatientSearchResults(res.data);
                    setIsSearchingPatients(false);
                })
                .catch(err => {
                    console.error("Patient query failure:", err);
                    setIsSearchingPatients(false);
                });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [patientSearchQuery]);
    const fetchActivePrescriptionQueue = () => {
        axios.get('/api/pos/active-scripts')
            .then(res => setPendingScripts(res.data))
            .catch(err => console.error("Error connecting script matrix queue:", err));
    };

    const pullScriptIntoCart = (scriptId) => {
        axios.get(`/api/pos/scripts/${scriptId}/load`)
            .then(res => {
                setSelectedPatient(res.data.patient);
                setBasket(res.data.items);
                setMappedPrescriptionId(scriptId);
                setStatusMessage({ type: 'success', text: `Prescription loaded for ${res.data.patient.name}. Items filled automatically.` });
            })
            .catch(err => console.error("Error loading prescription items:", err));
    };

    const addToBasket = (product) => {
        const existingItem = basket.find(item => item.product_id === product.id);
        const currentStock = parseInt(product.stock || 0);

        if (currentStock <= 0) {
            alert(`Stock Deficit: [${product.name}] is completely out of stock.`);
            return;
        }

        if (existingItem) {
            if (existingItem.quantity >= currentStock) {
                alert(`Allocation Cap: Cannot exceed current available lot balances.`);
                return;
            }
            setBasket(basket.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            const fallbackPrice = parseFloat(product.selling_price_fallback);
            if (isNaN(fallbackPrice) || fallbackPrice <= 0) {
                alert(`Pricing Guard: [${product.name}] has no valid batch price set. Cannot dispense.`);
                return;
            }

            setBasket([...basket, {
                product_id: product.id,
                name: product.name,
                sku: product.sku,
                quantity: 1,
                price: fallbackPrice,
                prescription_id: null
            }]);
        }
    };
    const updateQuantity = (productId, newQty, maxStock) => {
        const parsedQty = parseInt(newQty);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            setBasket(basket.filter(item => item.product_id !== productId));
            return;
        }
        if (parsedQty > maxStock) {
            alert(`Allocation Cap: Exceeds available stock capacity (${maxStock} units).`);
            return;
        }
        setBasket(basket.map(item => item.product_id === productId ? { ...item, quantity: parsedQty } : item));
    };

    //const calculateTotal = () => {
    //    return basket.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2);
    //};

    const calculateSubtotal = () => {
        return basket.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    };

    const calculateFinalTotal = () => {
        const sub = calculateSubtotal();
        const disc = parseFloat(discount) || 0;
        return Math.max(0, sub - disc).toFixed(2);
    };

    useEffect(() => {
        if (!isSplitPayment) {
            setSplitAmounts({ 'Cash': '', 'M-Pesa': '', 'Card': '' });
        } else {
            setSplitAmounts({
                'Cash': calculateFinalTotal(),
                'M-Pesa': '0.00',
                'Card': '0.00'
            });
        }
    }, [basket, discount, isSplitPayment]);

    const handleSplitChange = (method, val) => {
        setSplitAmounts({
            ...splitAmounts,
            [method]: val
        });
    };

    const handlePosExport = (format) => {
        const queryParams = new URLSearchParams({
            query: searchQuery,
            format: format
        }).toString();
        
        window.location.href = `/api/pos/inventory/export?${queryParams}`;
    };

    /*const submitCheckout = (e) => {
        e.preventDefault();
        if (basket.length === 0) return;

        const containsRxItem = basket.some(item => {
            const product = localProducts.find(p => p.id === item.product_id);
            return product?.requires_prescription;
        });

        if (containsRxItem && !selectedPatient) {
            alert("Compliance Lock: This order contains controlled 'Rx Only' molecules. You must attach a patient profile first.");
            return;
        }

        axios.post('/api/checkout', {
            patient_id: selectedPatient ? selectedPatient.id : null,
            prescription_id: mappedPrescriptionId,
            payment_method: paymentMethod,
            items: basket.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            }))
        })
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message || "Invoice finalized successfully!" });
            setBasket([]);
            setSelectedPatient(null);
            setMappedPrescriptionId(null);
            setPatientSearchQuery('');
            fetchActivePrescriptionQueue();

            if (res.data.invoice) {
                setActiveReceipt(res.data.invoice);
                setIsModalOpen(true);
            }

            router.reload({ preserveScroll: true, preserveState: true });
        })
        .catch(err => {
            alert(err.response?.data?.message || "Transaction aborted due to compliance lock errors.");
        });
    };*/

    /*const submitCheckout = (e) => {
        e.preventDefault();
        if (basket.length === 0) return;

        const containsRxItem = basket.some(item => {
            const product = localProducts.find(p => p.id === item.product_id);
            return product?.requires_prescription;
        });

        if (containsRxItem && !selectedPatient) {
            alert("Compliance Lock: This order contains controlled 'Rx Only' molecules. You must attach a patient profile first.");
            return;
        }

        const payload = {
            patient_id: selectedPatient ? selectedPatient.id : null,
            prescription_id: mappedPrescriptionId,
            discount: parseFloat(discount) || 0,
            is_split_payment: isSplitPayment,
            payment_method: paymentMethod,
            payment_splits: isSplitPayment ? splitAmounts : null,
            items: basket.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        axios.post('/api/checkout', payload)
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message || "Invoice finalized successfully!" });
            setBasket([]);
            setSelectedPatient(null);
            setMappedPrescriptionId(null);
            setPatientSearchQuery('');
            setDiscount(0);
            setIsSplitPayment(false);
            fetchActivePrescriptionQueue();

            if (res.data.invoice) {
                setActiveReceipt(res.data.invoice);
                setIsModalOpen(true);
            }

            router.reload({ preserveScroll: true, preserveState: true });
        })
        .catch(err => {
            alert(err.response?.data?.message || "Transaction aborted due to compliance lock errors.");
        });
    };*/


    const submitCheckout = (e) => {
        e.preventDefault();
        if (basket.length === 0) return;

        const containsRxItem = basket.some(item => {
            const product = localProducts.find(p => p.id === item.product_id);
            return product?.requires_prescription;
        });

        if (containsRxItem && !selectedPatient) {
            alert("Compliance Lock: This order contains controlled 'Rx Only' molecules. You must attach a patient profile first.");
            return;
        }

        // FIXED: Enforce clean variable isolation depending on split configurations state
        const payload = {
            patient_id: selectedPatient ? selectedPatient.id : null,
            prescription_id: mappedPrescriptionId,
            discount: parseFloat(discount) || 0,
            is_split_payment: isSplitPayment,
            // Pass standard select dropdown value if false, else assign structural literal string 'Split'
            payment_method: isSplitPayment ? 'Split' : paymentMethod,
            // FIXED CORE MAPPING: Force clean null object parameters if toggle remains false
            payment_splits: isSplitPayment ? splitAmounts : null,
            items: basket.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            }))
        };

        axios.post('/api/checkout', payload)
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message || "Invoice finalized successfully!" });
            setBasket([]);
            setSelectedPatient(null);
            setMappedPrescriptionId(null);
            setPatientSearchQuery('');
            setDiscount(0);
            setIsSplitPayment(false);
            fetchActivePrescriptionQueue();

            if (res.data.invoice) {
                setActiveReceipt(res.data.invoice);
                setIsModalOpen(true);
            }

            router.reload({ preserveScroll: true, preserveState: true });
        })
        .catch(err => {
            alert(err.response?.data?.message || "Transaction aborted due to validation or lot capacity constraint locks.");
        });
    };


    //const handleShiftReconciliationSubmit = (e) => {
    //    e.preventDefault();
    //    axios.post('/api/pos/shift/reconcile', {
   //        ...shiftTotals,
    //        ...reconcileForm
    //    })
    //    .then(res => {
    //        setIsReconcileModalOpen(false);
    //        setReconcileForm({ actual_cash: '', actual_mpesa: '', actual_card: '', discrepancy_notes: '' });
    //        alert(res.data.message);
    //        router.reload();
    //    })
    //    .catch(err => alert(err.response?.data?.message || "Reconciliation failed."));
    //};

        
    const handleShiftReconciliationSubmit = (e) => {
        e.preventDefault();
        
        axios.post('/api/pos/shift/reconcile', {
            ...shiftTotals,
            ...reconcileForm
        })
        .then(res => {
            setIsReconcileModalOpen(false);
            
            // Inject a slight timeout to ensure the DOM updates with backend response calculations
            setTimeout(() => {
                // Execute a targeted print event on the window lifecycle
                window.print();
                
                // Reset form state parameters safely
                setReconcileForm({ actual_cash: '', actual_mpesa: '', actual_card: '', discrepancy_notes: '' });
                alert("Shift reconciliations processed and printed successfully. Terminating active security session window...");
                
                // Atomically log out of the application framework
                router.post(route('logout'));
            }, 500);
        })
        .catch(err => alert(err.response?.data?.message || "Reconciliation processing failed. Ensure calculations match."));
    };

    const handleLedgerCsvExport = () => {
        const cleanParams = {};
        Object.entries(historyFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value.toString().trim() !== '') {
                cleanParams[key] = value.toString().trim();
            }
        });
        const params = new URLSearchParams(cleanParams).toString();
        window.location.href = `/api/pos/sales-history/export?${params}`;
    };

    const handleBarcodeKeyDownIntercept = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Stop form submissions or view reloads
        const trimmedSku = searchQuery.trim();
        
        if (trimmedSku.length === 0) return;

        // Trace whether the product item exists inside your active local state products pool array
        const matchedProductBySku = localProducts.find(
            p => p.sku.toLowerCase() === trimmedSku.toLowerCase()
        );

        if (matchedProductBySku) {
            addToBasket(matchedProductBySku);
            setSearchQuery(''); // Flush input space so it's ready for the next scan
        } else {
            // If it isn't matched locally, make a quick backend check
            axios.get(`/api/inventory-lookup?query=${trimmedSku}`)
                .then(res => {
                    if (res.data && res.data.length > 0) {
                        // Scan for an exact SKU profile match inside return streams
                        const serverMatch = res.data.find(p => p.sku.toLowerCase() === trimmedSku.toLowerCase());
                        if (serverMatch) {
                            addToBasket(serverMatch);
                            setSearchQuery('');
                            return;
                        }
                    }
                    alert(`SKU Registry Mismatch: Product code [${trimmedSku}] not found.`);
                })
                .catch(() => console.error("Barcode connector pipeline error."));
        }
    }
};


    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="text-indigo-600"/> Scale-Optimised POS Register Desk
                    </h2>
                    
                    <button 
                        type="button" 
                        onClick={() => setIsReconcileModalOpen(true)}
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider px-3 py-2 rounded-xl shadow-md transition-colors"
                    >
                        <Lock size={13}/> End Operational Shift
                    </button>

                    <button 
    type="button" 
    onClick={() => setIsHistoryModalOpen(true)}
    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-[11px] uppercase tracking-wider px-3 py-2 rounded-xl shadow-xs transition-colors"
>
    <FileText size={13} className="text-slate-500"/> Review Bills Ledger
</button>

                </div>
            }
        >
            <Head title="POS Register" />

            

            <div className="py-4 bg-slate-100 min-h-screen space-y-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* LIVE CLINICAL PRESCRIPTIONS QUEUE RIBBON LOG TRACKER */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                            <FileText size={14} className="text-indigo-400" /> Pending Prescription Intake Billing Queue ({pendingScripts.length})
                        </div>
                        <div className="p-3 bg-slate-50 flex gap-3 overflow-x-auto min-h-[70px] items-center pr-4">
                            {pendingScripts.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic font-medium px-2">No active pending scripts waiting for dispensation processing.</p>
                            ) : (
                                pendingScripts.map(script => (
                                    <button
                                        key={script.id}
                                        type="button"
                                        onClick={() => pullScriptIntoCart(script.id)}
                                        className="inline-flex items-center gap-2 text-left bg-white border border-amber-200 hover:border-amber-400 text-xs font-semibold px-3 py-2 rounded-xl shadow-2xs text-amber-900 shrink-0 transition-all hover:scale-[1.02] ring-1 ring-amber-300/10"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                        <div>
                                            <p className="font-bold text-slate-800 leading-tight">{script.patient?.name}</p>
                                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">Code: {script.prescription_number}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    {/* SEARCH FILTER & EXPORT ACTION GATEWAY LAYOUT TOOLBAR */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Type drug name or scan barcode SKU to lookup items in real-time..."
                                className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleBarcodeKeyDownIntercept}
                            />
                            {isSearchingInventory && <Loader2 size={14} className="absolute right-3.5 top-3 text-indigo-500 animate-spin" />}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => handlePosExport('excel')} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs uppercase tracking-wider transition-colors"
                                title="Export Filtered Stock Sheets to Excel"
                            >
                                <FileText size={14}/> Excel
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handlePosExport('pdf')} 
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs uppercase tracking-wider transition-colors"
                                title="Download Full Catalog PDF Print Document"
                            >
                                <Download size={14}/> PDF
                            </button>
                        </div>
                    </div>

                    {/* TWO-COLUMN POS WORKSPACE WORKFLOW MATRIX GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                        {/* LEFT COLUMN: ACTIVE DISPENSARY PRODUCT STOCK LOOKUPS (COL-SPAN 3) */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {localProducts.length === 0 ? (
                                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 col-span-2 text-xs font-medium">
                                        No active matching products found in stock channels.
                                    </div>
                                ) : (
                                    localProducts.map(prod => (
                                        <div key={prod.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-colors">
                                            <div>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-slate-800 text-xs leading-tight truncate">{prod.name}</h4>
                                                    {prod.requires_prescription && (
                                                        <span className="bg-purple-50 text-purple-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-purple-100 whitespace-nowrap">Rx Only</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {prod.sku}</p>
                                            </div>
                                            <div className="mt-3 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Stock Available</p>
                                                    <p className="text-xs font-black text-slate-700 font-mono">{prod.stock ?? 0} Units</p>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => addToBasket(prod)} 
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-2xs uppercase tracking-wider"
                                                >
                                                    Dispense
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* TOP 10 PER PAGE PAGINATION CONTROL BLOCKS */}
                            {searchQuery.trim() === '' && productsData.last_page > 1 && (
                                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-medium">
                                    <span className="text-slate-400 font-mono">Page {productsData.current_page} of {productsData.last_page}</span>
                                    <div className="flex items-center gap-1">
                                        {productsData.links.map((link, idx) => (
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
                        {/* RIGHT COLUMN: CURRENT TRANSACTIONS RECEIPT PROFILE */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                                <h3 className="font-bold text-sm flex items-center gap-2"><ShoppingCart className="text-indigo-400"/> Current Customer Receipt</h3>
                                <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono">{basket.length} lines</span>
                            </div>

                            {/* COMPLIANCE REAL-TIME PATIENT ATTACHMENT WIDGET */}
                            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
                                {!selectedPatient ? (
                                    <div className="relative">
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search patient registry to link profile..."
                                                className="w-full pl-8 pr-8 py-2 bg-white rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                                                value={patientSearchQuery}
                                                onChange={(e) => setPatientSearchQuery(e.target.value)}
                                            />
                                            {isSearchingPatients && <Loader2 size={12} className="absolute right-2.5 top-2.5 text-indigo-500 animate-spin" />}
                                        </div>

                                        {/* DROPDOWN INTERCEPT LIST FLOATING MATRIX */}
                                        {patientSearchResults.length > 0 && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50 divide-y divide-slate-100">
                                                {patientSearchResults.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPatient(p);
                                                            setPatientSearchResults([]);
                                                            setPatientSearchQuery('');
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between transition-colors"
                                                    >
                                                        <span className="font-bold text-slate-700">{p.name}</span>
                                                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border">{p.patient_number}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* COMPLIANCE PATIENT ATTACHMENT SELECTED ROW CARD */
                                    <div className="bg-indigo-50 border border-indigo-200/60 p-2.5 rounded-xl flex justify-between items-center text-xs text-indigo-900 animate-slide-down">
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={16} className="text-indigo-600" />
                                            <div>
                                                <p className="font-bold">{selectedPatient.name}</p>
                                                <p className="text-[10px] text-indigo-400 font-mono font-semibold">Chart: {selectedPatient.patient_number}</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => { setSelectedPatient(null); setMappedPrescriptionId(null); setBasket([]); }} 
                                            className="text-slate-400 hover:text-rose-600 p-1 bg-white rounded-lg border border-slate-200 transition-colors"
                                            title="Unlink Patient Profile"
                                        >
                                            <UserMinus size={13}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* INVOICE BASKET ROWS DISPLAY CONTAINER */}
                            <div className="p-4 divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white flex-grow min-h-[160px]">
                                {basket.length === 0 ? (
                                    <div className="text-center text-slate-400 py-10">
                                        <ShoppingCart className="mx-auto h-8 w-8 stroke-1 mb-2 text-slate-200"/>
                                        <p className="text-[11px]">Invoice shopping basket empty.</p>
                                    </div>
                                ) : (
                                    basket.map(item => {
                                        const originalProduct = localProducts.find(p => p.id === item.product_id);
                                        const stockLimit = originalProduct ? parseInt(originalProduct.stock) : 999;
                                        
                                        return (
                                            <div key={item.product_id} className="py-2 flex justify-between items-center text-xs">
                                                <div className="space-y-px max-w-[55%]">
                                                    <h5 className="font-bold text-slate-800 truncate">{item.name}</h5>
                                                    <p className="text-[10px] text-slate-400 font-mono">KES {item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1, stockLimit)} className="p-1 rounded bg-slate-50 border border-slate-100 text-slate-600"><Minus size={10} /></button>
                                                    <span className="w-6 text-center font-bold font-mono text-slate-800">{item.quantity}</span>
                                                    <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1, stockLimit)} className="p-1 rounded bg-slate-50 border border-slate-100 text-slate-600"><Plus size={10} /></button>
                                                    <button type="button" onClick={() => setBasket(basket.filter(i => i.product_id !== item.product_id))} className="text-slate-300 hover:text-rose-600 p-1 ml-1"><Trash2 size={12} /></button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* ACCUMULATOR FOOTER ROW */}
                            {/* ACCUMULATOR FOOTER ROW */}
<div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
    {/* Gross Basket Subtotal */}
    <div className="flex justify-between items-center text-slate-500 text-xs font-mono">
        <span>Subtotal</span>
        <span>KES {calculateSubtotal().toFixed(2)}</span>
    </div>

    {/* Discount Input Block */}
    <div className="flex justify-between items-center text-slate-600 text-xs">
        <span className="font-bold text-slate-700">Apply Discount (KES)</span>
        <input 
            type="number" 
            min="0"
            max={calculateSubtotal()}
            className="w-24 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono p-1 text-right focus:ring-1 focus:ring-indigo-500"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
        />
    </div>

    {/* Split Payment System Toggle Checkbox */}
    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
        <input 
            type="checkbox" 
            id="split_payment_toggle"
            className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            checked={isSplitPayment}
            onChange={(e) => setIsSplitPayment(e.target.checked)}
        />
        <label htmlFor="split_payment_toggle" className="text-[11px] font-bold text-slate-600 uppercase tracking-wide cursor-pointer">
            Split Payment Between Modes
        </label>
    </div>

    {/* Conditional Billing Fields Interface Layout Switch */}
    {!isSplitPayment ? (
        <div className="flex justify-between items-center text-slate-600 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Payment Mode</span>
            <select 
                className="bg-white border border-slate-200 rounded-lg text-xs font-bold p-1 focus:ring-1 focus:ring-indigo-500" 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value)}
            >
                <option value="Cash">Cash Currency</option>
                <option value="M-Pesa">M-Pesa Money</option>
                <option value="Card">Visa / Mastercard</option>
            </select>
        </div>
    ) : (
        <div className="bg-slate-100/80 p-2 rounded-xl border border-slate-200 space-y-2 animate-fadeIn">
            <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Specify Split Values</p>
            {['Cash', 'M-Pesa', 'Card'].map(method => (
                <div key={method} className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-600 font-sans font-medium">{method}</span>
                    <input 
                        type="number"
                        placeholder="0.00"
                        className="w-28 bg-white border border-slate-200 rounded-lg p-1 text-right text-xs font-bold"
                        value={splitAmounts[method]}
                        onChange={(e) => handleSplitChange(method, e.target.value)}
                    />
                </div>
            ))}
        </div>
    )}

    {/* Net Final Accounting Totals Matrix */}
    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Due</span>
        <span className="text-md font-black text-emerald-700 font-mono">KES {calculateFinalTotal()}</span>
    </div>
    
    <button 
        type="button" 
        onClick={submitCheckout} 
        disabled={basket.length === 0} 
        className="w-full py-2 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 shadow-md"
    >
        Finalise Invoice
    </button>
</div>

                        </div>

                    </div> {/* Closes the overhauled layout grid safely */}
                </div>
            </div>

            {/* END OF SHIFT RECONCILIATION MODAL DRAWER OVERLAY */}
            {isReconcileModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleShiftReconciliationSubmit} className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Shift Closure Reconciliation</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">Tally register collections against system audit balances</p>
                            </div>
                        </div>
                        <div className="p-5 space-y-4 text-xs font-semibold">
                            
                            {/* EXPECTED METRICS TRACKED BY SYSTEM */}
                            {/* EXPECTED METRICS TRACKED BY SYSTEM */}
<div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-600">
    <div>
        <p className="text-[9px] font-sans font-black text-slate-400 uppercase">Sys Cash (Inc. Splits)</p>
        <p className="font-bold mt-0.5">KES {parseFloat(shiftTotals.expected_cash || 0).toFixed(2)}</p>
    </div>
    <div>
        <p className="text-[9px] font-sans font-black text-slate-400 uppercase">Sys M-Pesa (Inc. Splits)</p>
        <p className="font-bold mt-0.5">KES {parseFloat(shiftTotals.expected_mpesa || 0).toFixed(2)}</p>
    </div>
    <div>
        <p className="text-[9px] font-sans font-black text-slate-400 uppercase">Sys Card (Inc. Splits)</p>
        <p className="font-bold mt-0.5">KES {parseFloat(shiftTotals.expected_card || 0).toFixed(2)}</p>
    </div>
</div>


                            {/* DRAWER COUNT INPUT FIELDS */}
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actual Physical Cash Counted (KES)</label>
                                    <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={reconcileForm.actual_cash} onChange={e => setReconcileForm({...reconcileForm, actual_cash: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actual M-Pesa Statement Sum (KES)</label>
                                    <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={reconcileForm.actual_mpesa} onChange={e => setReconcileForm({...reconcileForm, actual_mpesa: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Actual Bank Terminal Card Slip Sum (KES)</label>
                                    <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-200 rounded-lg p-2 font-mono bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={reconcileForm.actual_card} onChange={e => setReconcileForm({...reconcileForm, actual_card: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Discrepancy Notes / Explanations</label>
                                    <textarea rows="2" placeholder="Document any variance justifications here..." className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 focus:ring-1 focus:ring-indigo-500" value={reconcileForm.discrepancy_notes} onChange={e => setReconcileForm({...reconcileForm, discrepancy_notes: e.target.value})}></textarea>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button type="button" onClick={() => setIsReconcileModalOpen(false)} className="w-1/3 border border-slate-200 hover:bg-slate-100 font-bold text-slate-600 rounded-xl py-2.5 transition-colors">Cancel</button>
                            <button type="submit" className="w-2/3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-md">Close & Tally Shift</button>
                        </div>
                    </form>
                </div>
            )}

            {/* INTERACTIVE COMPLIANCE INVOICE RECEIPT MODAL OVERLAY */}
{isModalOpen && activeReceipt && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 unique-pos-modal-container">
        
        {/* ABSOLUTE PRINT ISOLATION STYLE TAG */}
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                /* 1. Hide every single element inside the viewport root layout */
                body * {
                    visibility: hidden !important;
                    overflow: visible !important;
                }
                
                /* 2. Isolate only the receipt sheet canvas box area and its text elements */
                #pharma-printable-receipt, 
                #pharma-printable-receipt * {
                    visibility: visible !important;
                }
                
                /* 3. Extract the container card entirely out of its flex/overflow parent containers */
                #pharma-printable-receipt {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 76mm !important;
                    max-width: 76mm !important;
                    height: auto !important;
                    display: block !important;
                    padding: 4mm !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                    color: #000000 !important;
                    box-shadow: none !important;
                    border: none !important;
                    overflow: visible !important;
                }

                /* 4. Enforce clean page behavior adjustments */
                @page {
                    size: 80mm auto;
                    margin: 0mm !important;
                }
            }
        `}} />

        {/* The screen modal container remains unchanged with its layout properties */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden flex flex-col transform scale-100 transition-all">
            
            {/* HEADER PROFILE */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Transaction Finalised</h4>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Close</button>
            </div>

            {/* PHYSICAL PRINT RECORD CANVAS SHEET */}
            <div id="pharma-printable-receipt" className="p-6 bg-white text-slate-800">
    <div className="text-center pb-3 border-b border-dashed border-slate-200 mb-4 flex flex-col items-center">
        
        {/* LOGO OVERRIDE SYSTEM MATRIX */}
        {corporateBranding?.logo_path ? (
            <img 
                src={`/storage/${corporateBranding.logo_path}`} 
                alt="Receipt Header Logo" 
                className="h-10 max-w-[180px] object-contain mb-1.5"
            />
        ) : (
            <h3 
                style={{ color: corporateBranding?.primary_color_hex || '#4f46e5' }} 
                className="font-black text-sm tracking-wider uppercase"
            >
                {corporateBranding?.company_name || 'ORVELLA PHARMACY'}
            </h3>
        )}

        {/* FIXED: References corporateBranding context variables directly to eliminate the state error */}
        <p className="text-[10px] text-slate-400 font-medium">
            {corporateBranding?.address || 'Bungoma Town CBD'}
        </p>
        <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">
            {corporateBranding?.phone_number ? `TEL: ${corporateBranding.phone_number}` : 'SYSTEM WORKSPACE NODE'}
        </p>


                    <div className="text-[9px] text-slate-500 font-mono pt-2 text-left space-y-0.5 mt-2">
                        <p>INV NO: {activeReceipt.invoice_number}</p>
                        <p>DATE: {new Date(activeReceipt.created_at || new Date()).toLocaleString()}</p>
                        <p>CASHIER ID: #{activeReceipt.user_id || 1}</p>
                    </div>
                </div>

                {/* ITEMISED TRANSACTION LINES */}
                <div className="border-b border-dashed border-slate-200 pb-3 text-xs mb-4">
                    <div className="flex justify-between font-black text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                        <span>Description</span>
                        <span className="text-right">Total (KES)</span>
                    </div>
                    
                    {activeReceipt.items && activeReceipt.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start text-xs font-mono my-2">
                            <div className="max-w-[70%]">
                                <p className="font-bold text-slate-800 font-sans">{item.product?.name || 'Unknown Medication'}</p>
                                <p className="text-[10px] text-slate-400">{item.quantity} units x KES {parseFloat(item.unit_price).toFixed(2)}</p>
                            </div>
                            <span className="font-bold text-slate-700 text-right">
                                {parseFloat(item.subtotal || (item.quantity * item.unit_price)).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ACCOUNTING BREAKDOWN TRAIL BLOCK */}
                <div className="space-y-1.5 text-xs border-b border-dashed border-slate-200 pb-3 font-mono mb-4">
                    <div className="flex justify-between text-slate-600">
                        <span>Gross Subtotal:</span>
                        <span>KES {parseFloat(activeReceipt.subtotal_amount || activeReceipt.total_amount).toFixed(2)}</span>
                    </div>
                    
                    {parseFloat(activeReceipt.discount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                            <span>Discount Allowed:</span>
                            <span>- KES {parseFloat(activeReceipt.discount).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                        <span className="font-sans uppercase text-[10px] tracking-wider text-slate-500">Net Amount Paid:</span>
                        <span style={{ color: corporateBranding?.primary_color_hex || '#15803d' }} className="font-black text-emerald-700">
                            KES {parseFloat(activeReceipt.total_amount ?? (parseFloat(activeReceipt.subtotal_amount) - parseFloat(activeReceipt.discount))).toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* PAYMENT SETTLING SEGMENT BREAKDOWN */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 font-mono mb-4">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-sans mb-1.5">Settlement Analysis</p>
                    
                    {activeReceipt.payment_method !== 'Split' ? (
                        <div className="flex justify-between text-slate-700">
                            <span className="font-sans font-medium">Paid via {activeReceipt.payment_method}:</span>
                            <span className="font-bold">KES {parseFloat(activeReceipt.total_amount).toFixed(2)}</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {(() => {
                                const splits = typeof activeReceipt.payment_splits === 'string' 
                                    ? JSON.parse(activeReceipt.payment_splits) 
                                    : activeReceipt.payment_splits;

                                return splits && Object.entries(splits).map(([method, amount]) => (
                                    <div key={method} className="flex justify-between text-slate-700 text-[11px]">
                                        <span className="font-sans font-medium text-slate-500">{method} Share:</span>
                                        <span className="font-bold">KES {parseFloat(amount).toFixed(2)}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>

                {/* DYNAMIC THERMAL RECEIPT FOOTER MESSAGE */}
                <div className="text-center pt-2 text-[9px] text-slate-400 font-bold tracking-wider uppercase border-t border-dashed border-slate-200">
                    {corporateBranding?.receipt_footer_text || '*** Thank you for shopping with us ***'}
                </div>
            </div>

            {/* ACTION CONTROLS */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <button 
                    type="button"
                    onClick={() => window.print()}
                    style={{ backgroundColor: corporateBranding?.primary_color_hex || '#0f172a' }}
                    className="w-full hover:opacity-90 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm"
                >
                    Print Thermal Receipt
                </button>
            </div>

        </div>
    </div>
)}



        {/* RECONCILIATION & SHIFT ISOLATION PRINT MATRIX STYLE LAYER */}
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body * {
                    visibility: hidden !important;
                }
                
                /* If the receipt is present, isolate only the receipt */
                #pharma-printable-receipt, #pharma-printable-receipt * {
                    visibility: ${activeReceipt ? 'visible' : 'hidden'} !important;
                }
                
                /* If the reconciliation report is printed, isolate only the report block */
                #pharma-printable-shift-report, #pharma-printable-shift-report * {
                    visibility: ${!activeReceipt ? 'visible' : 'hidden'} !important;
                }
                
                #pharma-printable-receipt {
                    position: absolute !important; left: 0 !important; top: 0 !important; width: 76mm !important; display: ${activeReceipt ? 'block' : 'none'} !important;
                }
                
                #pharma-printable-shift-report {
                    position: absolute !important; left: 0 !important; top: 0 !important; width: 76mm !important; display: ${!activeReceipt ? 'block' : 'none'} !important;
                    background: #ffffff !important; color: #000000 !important; font-family: monospace !important; padding: 4mm !important;
                }
                
                @page {
                    size: 80mm auto;
                    margin: 0mm !important;
                }
            }
        `}} />

        {/* HIDDEN INLINE OPERATIONAL REPORT CANVAS CANVAS */}
        <div id="pharma-printable-shift-report" className="hidden font-mono text-xs p-4 bg-white text-slate-900 space-y-3">
            <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h3 className="font-black text-sm uppercase">{corporateBranding?.company_name || 'ZACK CHEMISTS'}</h3>
                <p className="text-[10px] font-bold">END-OF-SHIFT AUDIT REPORT</p>
                <p className="text-[9px] text-slate-500 mt-1">PRINTED: {new Date().toLocaleString()}</p>
            </div>
            
            <div className="space-y-0.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                <p><strong>CASHIER NAME:</strong> {props.auth?.user?.name || 'Station Node #2'}</p>
                <p><strong>SHIFT CLOSED:</strong> {new Date().toLocaleDateString()}</p>
                <p><strong>STATUS:</strong> OPERATIONAL TERMINATED</p>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                <p className="font-bold border-b border-slate-100 pb-0.5 uppercase text-[9px] text-slate-400">System Expected Balances</p>
                <div className="flex justify-between"><span>Expected Cash:</span><span>KES {parseFloat(shiftTotals.expected_cash || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Expected M-Pesa:</span><span>KES {parseFloat(shiftTotals.expected_mpesa || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Expected Card:</span><span>KES {parseFloat(shiftTotals.expected_card || 0).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-0.5 border-t border-slate-100">
                    <span>Total Expected Value:</span>
                    <span>KES {(parseFloat(shiftTotals.expected_cash) + parseFloat(shiftTotals.expected_mpesa) + parseFloat(shiftTotals.expected_card)).toFixed(2)}</span>
                </div>
            </div>

            <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                <p className="font-bold border-b border-slate-100 pb-0.5 uppercase text-[9px] text-slate-400">Physical Drawer Declaration</p>
                <div className="flex justify-between"><span>Counted Cash:</span><span>KES {parseFloat(reconcileForm.actual_cash || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Counted M-Pesa:</span><span>KES {parseFloat(reconcileForm.actual_mpesa || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Counted Card:</span><span>KES {parseFloat(reconcileForm.actual_card || 0).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-0.5 border-t border-slate-100">
                    <span>Total Counted Value:</span>
                    <span>KES {(parseFloat(reconcileForm.actual_cash || 0) + parseFloat(reconcileForm.actual_mpesa || 0) + parseFloat(reconcileForm.actual_card || 0)).toFixed(2)}</span>
                </div>
            </div>

            {reconcileForm.discrepancy_notes && (
                <div className="text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                    <p className="font-bold uppercase text-[8px] text-slate-400">Auditor / Variance Justification Notes:</p>
                    <p className="italic text-slate-700 mt-0.5">{reconcileForm.discrepancy_notes}</p>
                </div>
            )}

            <div className="text-center pt-4 text-[9px] text-slate-400 border-t border-dashed border-slate-300">
                <p>===================================</p>
                <p className="uppercase font-bold tracking-wider mt-1">🔒 SESSION RECONCILED & LOCKED OUT</p>
                <p>PHARMACORE SYSTEM NODE AUDITING ENGINE</p>
            </div>
        </div>



        {/* HISTORICAL SALES SEARCH & AUDIT DRAWER OVERLAY */}
{isHistoryModalOpen && (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col transform scale-100 transition-all">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div>
                    <h4 className="font-bold text-sm uppercase tracking-wide text-indigo-400">Sales Ledger & Audit Directory</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Search invoices, track settlement distributions, and reprint copies</p>
                </div>
                <button type="button" onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">Close</button>
            </div>

            {/* Advanced Filtering Row Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase text-[9px]">Invoice / Patient Query</label>
                    <input 
                        type="text" 
                        placeholder="Type Invoice No or Client Name..."
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                        value={historyFilters.query}
                        onChange={e => setHistoryFilters({...historyFilters, query: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase text-[9px]">Start Date Timeline</label>
                    <input 
                        type="date" 
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                        value={historyFilters.start_date}
                        onChange={e => setHistoryFilters({...historyFilters, start_date: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
                    <label className="font-bold text-slate-500 uppercase text-[9px]">End Date Timeline</label>
                    <input 
                        type="date" 
                        className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                        value={historyFilters.end_date}
                        onChange={e => setHistoryFilters({...historyFilters, end_date: e.target.value})}
                    />
                </div>
                <div className="space-y-1">
        <label className="font-bold text-slate-500 uppercase text-[9px]">Settlement Channel</label>
        <select 
            className="w-full border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-indigo-500 font-bold"
            value={historyFilters.payment_method}
            onChange={e => setHistoryFilters({...historyFilters, payment_method: e.target.value})}
        >
            <option value="">All Methods</option>
            <option value="Cash">Cash Only</option>
            <option value="M-Pesa">M-Pesa Only</option>
            <option value="Card">Card Only</option>
            <option value="Split">Split Payments</option>
        </select>
    </div>

    {/* EXPORT ACTION CONNECTOR BUTTON BLOCK */}
    <div className="flex items-end shrink-0">
        <button
            type="button"
            onClick={handleLedgerCsvExport}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            title="Download accountant ledger spreadsheet summary"
        >
            <Download size={14}/> Export Sheet
        </button>
    </div>

            </div>

            {/* Invoices Directory Result List Table Grid */}
            <div className="p-4 overflow-y-auto flex-grow bg-white">
                {isSearchingHistory ? (
                    <div className="py-20 text-center text-slate-400 text-xs font-semibold flex flex-col items-center justify-center gap-2">
                        <Loader2 size={24} className="text-indigo-500 animate-spin" />
                        Scanning pharmacy ledger streams...
                    </div>
                ) : salesHistoryData.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 text-xs font-medium">
                        No transactions found matching the specified parameters.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                                    <th className="p-3">Timestamp</th>
                                    <th className="p-3">Invoice Number</th>
                                    <th className="p-3">Patient Profile</th>
                                    <th className="p-3">Payment Method</th>
                                    <th className="p-3 text-right">Net Collection</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                {salesHistoryData.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3 font-mono text-[11px] whitespace-nowrap">{new Date(sale.created_at).toLocaleString()}</td>
                                        <td className="p-3 font-bold font-mono text-indigo-600">{sale.invoice_number}</td>
                                        <td className="p-3">{sale.patient?.name || <span className="text-slate-400 italic">Walk-In Account</span>}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sale.payment_method === 'Split' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-700'}`}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono font-black text-right text-slate-900">KES {parseFloat(sale.total_amount).toFixed(2)}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                type="button"
                                                onClick={() => handleReprintTrigger(sale.id)}
                                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wide transition-colors inline-flex items-center gap-1"
                                            >
                                                <Download size={11}/> Reprint Copy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </div>
)}



        </AuthenticatedLayout>
    );
}
