import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react'; // Injected Inertia useForm helper
import React, { useState, useEffect } from 'react';
import { Users, FileText, UserPlus, FilePlus, CheckCircle, AlertCircle, Eye, ShieldCheck, ShieldAlert, AlertTriangle, X, Search, Calendar, FileSpreadsheet, Download, Plus, Trash2, Upload, Printer } from 'lucide-react';
import axios from 'axios';

export default function PatientConsole({ patients, products, latestPrescriptions, filters }) {
    const [activeTab, setActiveTab] = useState('patient'); 
    const [statusMessage, setStatusMessage] = useState(null);
    const [expandedPatientId, setExpandedPatientId] = useState(null);
    const [selectedScriptDetails, setSelectedScriptDetails] = useState(null);
    const [isDetailsModalOpen, setIsModalOpen] = useState(false);

    // Omni-Search Filters Form Hooks
    const [searchName, setSearchName] = useState(filters.search_name || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Standard Patient State Form hook
    const [patientForm, setPatientForm] = useState({ name: '', phone: '', patient_number: '' });

    // NEW COMPLIANCE FORM CONTROLLER ENGINE supporting dynamic nested drug items and multi-part blobs
    const { data: scriptData, setData: setScriptData, post: postScript, reset: resetScript, processing: isUploading } = useForm({
        patient_id: '',
        prescription_number: '',
        doctor_name: '',
        date_issued: new Date().toISOString().split('T')[0],
        is_external: false,
        attachment_file: null,
        medications: [{ product_id: '', quantity_ordered: '', dosage_instructions: '' }] // Multiline items array row
    });

    // Inline row modifier helper to append another medication line into local state memory arrays
    const addNewMedicationLine = () => {
        setScriptData('medications', [
            ...scriptData.medications, 
            { product_id: '', quantity_ordered: '', dosage_instructions: '' }
        ]);
    };

    // Inline row modifier helper to strip a medication line from the array layout
    const removeMedicationLine = (idx) => {
        if (scriptData.medications.length === 1) return; // Retain at least one baseline line
        setScriptData('medications', scriptData.medications.filter((_, i) => i !== idx));
    };

    // Unified cell value dynamic modifier anchor
    const updateMedicationCell = (idx, field, value) => {
        const revised = scriptData.medications.map((item, i) => {
            if (i === idx) return { ...item, [field]: value };
            return item;
        });
        setScriptData('medications', revised);
    };
    const openPrescriptionInspectorModal = (scriptId) => {
        axios.get(`/api/prescriptions/${scriptId}`)
            .then(res => {
                setSelectedScriptDetails(res.data);
                setIsModalOpen(true);
            })
            .catch(err => console.error(err));
    };

    const handlePatientSubmit = (e) => {
        e.preventDefault();
        axios.post('/api/patients/store', patientForm)
            .then(res => {
                setStatusMessage({ type: 'success', text: res.data.message });
                setPatientForm({ name: '', phone: '', patient_number: '' });
                router.reload();
            }).catch(err => setStatusMessage({ type: 'error', text: err.response?.data?.message || "Storage error." }));
    };

    // UPGRADED MULTIPART SUBMISSION HANDLER Supporting Dynamic Arrays and Scanned Files
    const handleScriptSubmit = (e) => {
        e.preventDefault();
        
        if (scriptData.is_external && !scriptData.attachment_file) {
            alert("Compliance Verification Required: Please attach the file copy for foreign prescriptions.");
            return;
        }

        // Post natively via Inertia useForm to handle binary file data streams automatically
        postScript('/api/prescriptions/store', {
            forceFormData: true, // Guarantees backend receives array data as multi-part variables
            onSuccess: () => {
                setStatusMessage({ type: 'success', text: "Clinical prescription pipeline record queued successfully." });
                resetScript();
                router.reload();
            },
            onError: (errors) => {
                const message = Object.values(errors).join(' ');
                setStatusMessage({ type: 'error', text: message || "Failed to process prescription submission." });
            }
        });
    };

    // SINGLE SCRIPT PRINT WINDOW ROUTER TRIGGER
    const triggerSingleScriptPrint = (scriptId) => {
        window.open(`/api/prescriptions/${scriptId}/print`, '_blank', 'width=800,height=600');
    };

    const handleExport = (format) => {
        const queryParams = new URLSearchParams({
            search_name: searchName,
            start_date: startDate,
            end_date: endDate,
            format: format
        }).toString();
        
        window.location.href = `/api/prescriptions/export?${queryParams}`;
    };
    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Users className="text-indigo-600"/> Patient Care Registry & Clinical Script Queue</h2>}
        >
            <Head title="Patient Directory" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {statusMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    {/* OMNI-SEARCH FILTERS & ACTION MATRIX */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Search size={10}/> Search Patient / Script</label>
                            <input type="text" placeholder="Type keyword..." className="w-full border border-slate-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500" value={searchName} onChange={e => setSearchName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={10}/> Start Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={10}/> End Date</label>
                            <input type="date" className="w-full border border-slate-200 rounded-lg text-xs p-2 focus:ring-1 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => handleExport('excel')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs p-2 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs uppercase tracking-wider transition-colors"><FileSpreadsheet size={13}/> Excel</button>
                            <button type="button" onClick={() => handleExport('pdf')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-2 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs uppercase tracking-wider transition-colors"><Download size={13}/> PDF</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        
                        {/* LEFT COLUMN: ACTIVE PATIENT DIRECTORY & LATEST 5 PIPELINE LAYOUT */}
                        <div className="lg:col-span-3 space-y-5">
                            
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-indigo-400" /> Latest 5 Operational Prescriptions Pipeline Tracker
                                </div>
                                <div className="p-3 bg-slate-50 divide-y divide-slate-200/60 space-y-2">
                                    {latestPrescriptions.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic p-1">No recent clinical scripts registered in system records.</p>
                                    ) : (
                                        latestPrescriptions.map(rx => {
                                            const isPending = rx.status === 'Active';
                                            return (
                                                <div key={rx.id} className={`p-2.5 rounded-xl flex justify-between items-center text-xs transition-all border ${isPending ? 'bg-rose-50 border-rose-200 text-rose-900 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold flex items-center gap-1.5 text-slate-800">
                                                            Script: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px] font-bold">{rx.prescription_number}</span>
                                                            <span className="text-[10px] text-slate-400 font-normal">| Patient: {rx.patient?.name || 'Walk-In'}</span>
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-medium">Practitioner: {rx.doctor_name}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-2">
                                                        <div>
                                                            {isPending ? <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[9px] font-black rounded px-1.5 py-0.5 uppercase tracking-wider">Not Attended</span> : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-400 text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wider">Dispensed</span>}
                                                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{new Date(rx.date_issued).toLocaleDateString()}</p>
                                                        </div>
                                                        <button type="button" onClick={() => triggerSingleScriptPrint(rx.id)} className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-500 border-slate-200" title="Print Hardcopy Medical Script"><Printer size={12}/></button>
                                                        <button type="button" onClick={() => openPrescriptionInspectorModal(rx.id)} className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${isPending ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'}`}><Eye size={12}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            {/* MASTER PATIENT REGISTRY DIRECTORY LIST */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 pl-1">
                                    <Users size={12}/> Registered Patient Ledger Profile Index
                                </h3>
                                
                                {patients.length === 0 ? (
                                    <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 font-medium text-xs">
                                        No patients match the search conditions.
                                    </div>
                                ) : (
                                    patients.map(p => {
                                        const isExpanded = expandedPatientId === p.id;
                                        return (
                                            <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                                                {/* Patient Row Header - Clickable Action Anchor */}
                                                <div 
                                                    onClick={() => setExpandedPatientId(isExpanded ? null : p.id)}
                                                    className="p-4 bg-white hover:bg-slate-50/50 cursor-pointer flex justify-between items-center transition-colors select-none"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                            {p.name}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                            Chart ID: {p.patient_number} | Contact: {p.phone || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-xl font-black font-mono text-[10px] transition-all border ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                        {p.prescriptions.length} Records {isExpanded ? '▼' : '►'}
                                                    </span>
                                                </div>

                                                {/* Hidden Drill-down script logs drawer panel */}
                                                {isExpanded && (
                                                    <div className="p-3 bg-slate-50 border-t border-slate-100 divide-y divide-slate-200/60 space-y-2 animate-slide-down">
                                                        {p.prescriptions.length === 0 ? (
                                                            <p className="text-[11px] text-slate-400 italic p-1">No clinical scripts raised against this patient chart file.</p>
                                                        ) : (
                                                            p.prescriptions.map(rx => (
                                                                <div key={rx.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-xs">
                                                                    <div className="space-y-0.5">
                                                                        <p className="font-bold text-slate-800">
                                                                            Script Code: <span className="font-mono text-indigo-600">{rx.prescription_number}</span>
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400">Practitioner: {rx.doctor_name} | Issued: {new Date(rx.date_issued).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wider ${rx.status === 'Active' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400'}`}>
                                                                            {rx.status === 'Active' ? 'Active Queue' : 'Dispensed'}
                                                                        </span>
                                                                        <button type="button" onClick={() => triggerSingleScriptPrint(rx.id)} className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-500 border-slate-200" title="Print Hardcopy Medical Script"><Printer size={12}/></button>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => openPrescriptionInspectorModal(rx.id)}
                                                                            className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-600 border-slate-200"
                                                                        >
                                                                            <Eye size={12}/>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        {/* RIGHT COLUMN: WORKSPACE DATA ENTRY LAYER FORMS */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="flex border-b border-slate-200 bg-slate-50">
                                <button type="button" onClick={() => setActiveTab('patient')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 ${activeTab === 'patient' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><UserPlus size={14}/> Add Patient</button>
                                <button type="button" onClick={() => setActiveTab('script')} className={`flex-1 py-3 text-xs font-black uppercase tracking-wider border-b-2 flex items-center justify-center gap-2 ${activeTab === 'script' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}><FilePlus size={14}/> Raise Script</button>
                            </div>

                            <div className="p-5">
                                {/* TAB A: PATIENT FORM */}
{activeTab === 'patient' && (
    <form onSubmit={handlePatientSubmit} className="space-y-4">
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Patient Full Name</label>
            <input type="text" required placeholder="e.g., Alice Kamau" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={patientForm.name} onChange={e => setPatientForm({...patientForm, name: e.target.value})} />
        </div>
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chart/Patient Reference Number</label>
                <span className="text-[9px] bg-slate-100 text-slate-500 border rounded px-1.5 py-0.5 font-bold uppercase tracking-wide">Auto-Generated Fallback</span>
            </div>
            <input type="text" placeholder="Leave blank to assign next available PAT reference code..." className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50/50" value={patientForm.patient_number} onChange={e => setPatientForm({...patientForm, patient_number: e.target.value})} />
        </div>
        <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary Telephone Contact</label>
            <input type="text" required placeholder="e.g., +254712345678" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-mono" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} />
        </div>
        <button type="submit" className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md">Enroll Patient File</button>
    </form>
)}


                                {/* TAB B: UPGRADED RAISE SCRIPT ORDER FORM */}
                                {activeTab === 'script' && (
                                    <form onSubmit={handleScriptSubmit} className="space-y-4" encType="multipart/form-data">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Target Patient Chart</label>
                                            <select required className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-medium" value={scriptData.patient_id} onChange={e => setScriptData('patient_id', e.target.value)}>
                                                <option value="">-- Choose Patient File --</option>
                                                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.patient_number})</option>)}
                                            </select>
                                        </div>
                                        <div class="grid grid-cols-2 gap-4">
    <div className="space-y-1">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prescription Ref Code</label>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Auto-Fill</span>
        </div>
        <input type="text" placeholder="Leave blank for auto RX code..." className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500 font-mono bg-slate-50/50" value={scriptData.prescription_number} onChange={e => setScriptData('prescription_number', e.target.value)} />
    </div>
    <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Prescribing Doctor</label>
        <input type="text" required placeholder="e.g., Dr. Omondi" className="w-full border border-slate-200 rounded-lg text-xs p-2.5 focus:ring-1 focus:ring-indigo-500" value={scriptData.doctor_name} onChange={e => setScriptData('doctor_name', e.target.value)} />
    </div>
</div>

                                        {/* COMPLIANCE ATTACHMENT MANAGER WIDGET */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5"><Upload size={12}/> External Pharmacy Prescription?</label>
                                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" checked={scriptData.is_external} onChange={e => setScriptData('is_external', e.target.checked)} />
                                            </div>
                                            {scriptData.is_external && (
                                                <div className="space-y-1 animate-slide-down">
                                                    <label className="text-[9px] font-bold text-rose-700 uppercase tracking-wider block">Upload Scanned Hardcopy Document (PDF/Image)</label>
                                                    <input type="file" accept="image/*,application/pdf" className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-900 file:text-white file:cursor-pointer bg-white p-1 rounded-lg border border-dashed border-slate-300" onChange={e => setScriptData('attachment_file', e.target.files[0])} />
                                                </div>
                                            )}
                                        </div>

                                        {/* MULTI-ITEM DRUG MATRIX LOG CONTAINER */}
                                        <div className="border-t border-slate-200/60 pt-3 space-y-3">
                                            <div className="flex justify-between items-center px-0.5">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Authorized Formulations Array</label>
                                                <button type="button" onClick={addNewMedicationLine} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800"><Plus size={12}/> Add Drug Row</button>
                                            </div>

                                                                                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                                                {scriptData.medications.map((med, idx) => (
                                                    <div key={idx} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200 space-y-2 relative">
                                                        {scriptData.medications.length > 1 && (
                                                            <button type="button" onClick={() => removeMedicationLine(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={13}/></button>
                                                        )}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="col-span-2 space-y-0.5">
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Medication</label>
                                                                <select required className="w-full border border-slate-200 rounded-md text-xs p-1.5 bg-white" value={med.product_id} onChange={e => updateMedicationCell(idx, 'product_id', e.target.value)}>
                                                                    <option value="">-- Choose Drug --</option>
                                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <label className="text-[9px] font-bold text-slate-400 uppercase">Qty</label>
                                                                <input type="number" required placeholder="30" className="w-full border border-slate-200 rounded-md text-xs p-1.5 bg-white font-mono" value={med.quantity_ordered} onChange={e => updateMedicationCell(idx, 'quantity_ordered', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <label className="text-[9px] font-bold text-slate-400 uppercase">Clinical Dosage Instructions (Sig)</label>
                                                            <input type="text" required placeholder="e.g., 1 tab x3 daily for 5 days" className="w-full border border-slate-200 rounded-md text-xs p-1.5 bg-white" value={med.dosage_instructions} onChange={e => updateMedicationCell(idx, 'dosage_instructions', e.target.value)} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button type="submit" disabled={isUploading} className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-md flex justify-center items-center gap-2">
                                            {isUploading ? "Uploading Document..." : "Queue Multi-Script to Billing"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL SHEET: ITEMISED CLINICAL PRESCRIPTION DETAIL INSPECTOR */}
            {isDetailsModalOpen && selectedScriptDetails && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col animate-scale-up">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Script Audit Detail Record</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {selectedScriptDetails.prescription_number}</p>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 bg-slate-800 rounded-lg"><X size={16}/></button>
                        </div>
                        <div className="p-5 space-y-4 text-xs font-medium">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1.5 text-slate-600">
                                <p className="flex justify-between"><span>Patient Account:</span> <span className="font-bold text-slate-800">{selectedScriptDetails.patient?.name}</span></p>
                                <p className="flex justify-between"><span>Chart Number:</span> <span className="font-mono text-slate-800">{selectedScriptDetails.patient?.patient_number}</span></p>
                                <p className="flex justify-between"><span>Issuing Practitioner:</span> <span className="text-slate-800">{selectedScriptDetails.doctor_name}</span></p>
                                <p className="flex justify-between"><span>Authorization Status:</span> <span className={`font-bold uppercase ${selectedScriptDetails.status === 'Active' ? 'text-amber-600' : 'text-slate-400'}`}>{selectedScriptDetails.status}</span></p>
                                {selectedScriptDetails.external_attachment_path && (
                                    <p className="flex justify-between text-rose-700 font-bold border-t border-dashed border-slate-200 pt-1.5 mt-1">
                                        <span>Document Scan:</span>
                                        <a href={`/storage/${selectedScriptDetails.external_attachment_path}`} target="_blank" rel="noreferrer" className="underline hover:text-rose-900">View Script File</a>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-black text-[10px] uppercase text-slate-400 tracking-wider">Authorized Medication Line Matrix</h5>
                                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                                    {selectedScriptDetails.items?.map(item => (
                                        <div key={item.id} className="p-3 bg-white flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-slate-800">{item.product?.name}</p>
                                                <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100/40 px-1.5 py-0.5 rounded-md mt-1 w-max">Sig: {item.dosage_instructions}</p>
                                            </div>
                                            <span className="font-mono font-black text-slate-700 bg-slate-100 px-2 py-1 rounded border text-xs">{item.quantity_ordered} Units</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
