import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Database, FileSpreadsheet, Upload, CheckCircle2, ShieldAlert, Users, Layers, Building, HelpCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function DataMigrationHub() {
    const [activeTab, setActiveTab] = useState('products');
    const [csvFile, setCsvFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [responseMsg, setResponseMsg] = useState(null);

    const schemaTemplates = {
        users: {
            icon: Users,
            title: 'Staff Identity Roster Matrix',
            headers: ['Full Name', 'Email', 'Role', 'Default Password'],
            example: 'Alice Cherono,alice@orvella.com,pharmacist,SecurePass123!'
        },
        patients: {
            icon: Users,
            title: 'Patient Medical Profile Index',
            headers: ['Patient Name', 'Phone Number', 'Patient Number'],
            example: 'John Wesonga,+254711223344,PAT-2026-9041'
        },
        products: {
            icon: Layers,
            title: 'Medication Formulary Catalog',
            headers: ['Medication Name', 'Generic Formulation', 'Form Category', 'Safety Reorder Level', 'Requires Rx Script'],
            example: 'Amoxicillin 500mg,Amoxicillin,Capsule,100,true'
        },
        suppliers: {
            icon: Building,
            title: 'Wholesaler Creditor Portfolios',
            headers: ['Wholesaler Name', 'Contact Person', 'Telephone', 'Email Address', 'Physical Address'],
            example: 'Beta Healthcare,Dr. Evans,0722000111,info@beta.com,Mombasa Road Nairobi'
        }
    };

    const activeSchema = schemaTemplates[activeTab];

    /*const executeUploadMigration = (e) => {
        e.preventDefault();
        if (!csvFile) {
            alert("Validation Guard: Please map a valid formatted spreadsheet file structure first.");
            return;
        }

        setIsProcessing(true);
        setResponseMsg(null);

        const formBlob = new FormData();
        formPayload.append('import_type', activeTab);
        formPayload.append('csv_file', csvFile);

        axios.post('/api/admin/migration/import', formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            setResponseMsg({ type: 'success', text: res.data.message });
            setIsProcessing(false);
            setCsvFile(null);
            document.getElementById('hub_csv_file_node_input').value = '';
        })
        .catch(err => {
            setResponseMsg({ type: 'error', text: err.response?.data?.message || "Ingestion transaction aborted." });
            setIsProcessing(false);
        });
    };*

        const executeUploadMigration = (e) => {
        e.preventDefault();
        if (!csvFile) {
            alert("Validation Guard: Please map a valid formatted spreadsheet file structure first.");
            return;
        }

        setIsProcessing(true);
        setResponseMsg(null);

        // FIXED TYPO: Instantiated standard form data reference matching append targets
        const formPayload = new FormData();
        formPayload.append('import_type', activeTab);
        formPayload.append('csv_file', csvFile);

        axios.post('/api/admin/migration/import', formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            setResponseMsg({ type: 'success', text: res.data.message });
            setIsProcessing(false);
            setCsvFile(null);
            document.getElementById('hub_csv_file_node_input').value = '';
        })
        .catch(err => {
            setResponseMsg({ type: 'error', text: err.response?.data?.message || "Ingestion transaction aborted." });
            setIsProcessing(false);
        });
    };*/


        const executeUploadMigration = (e) => {
        e.preventDefault();
        if (!csvFile) {
            alert("Validation Guard: Please map a valid formatted spreadsheet file structure first.");
            return;
        }

        setIsProcessing(true);
        setResponseMsg(null);

        // BALANCED VARIABLE IDENTIFIERS
        const formPayload = new FormData();
        formPayload.append('import_type', activeTab);
        formPayload.append('csv_file', csvFile);

        axios.post('/api/admin/migration/import', formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            setResponseMsg({ type: 'success', text: res.data.message });
            setIsProcessing(false);
            setCsvFile(null);
            document.getElementById('hub_csv_file_node_input').value = '';
        })
        .catch(err => {
            setResponseMsg({ type: 'error', text: err.response?.data?.message || "Ingestion transaction aborted." });
            setIsProcessing(false);
        });
    };



    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2"><Database className="text-indigo-600"/> Centralized Bulk Data Migration Hub & Ingestion Console</h2>}
        >
            <Head title="Bulk Migration Hub" />

            <div className="py-6 bg-slate-100 min-h-screen">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 space-y-5">
                    
                    {responseMsg && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${responseMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {responseMsg.type === 'success' ? <CheckCircle2 className="text-emerald-600" size={18} /> : <ShieldAlert className="text-rose-600" size={18} />}
                            <span className="text-sm font-semibold">{responseMsg.text}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        
                        {/* TAB TARGET CONTROLLERS */}
                        <div className="flex border-b border-slate-200 bg-slate-50 text-center select-none text-xs font-black uppercase tracking-wider">
                            {Object.entries(schemaTemplates).map(([key, value]) => {
                                const Icon = value.icon;
                                return (
                                    <button key={key} type="button" onClick={() => { setActiveTab(key); setResponseMsg(null); }} className={`flex-1 py-3 border-b-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === key ? 'border-indigo-600 text-indigo-600 bg-white font-bold' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                                        <Icon size={14}/> {key}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 items-stretch">
                            
                            {/* LEFT INSIDE PANEL: TEMPLATE RULES & VISUAL COMPLIANCE CHECK INSTRUCTIONS */}
                            <div className="md:col-span-2 p-5 bg-slate-50/50 space-y-4 text-xs font-semibold">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2"><HelpCircle size={12}/> Structure Rules Manifest</h4>
                                    <p className="text-slate-500 font-medium leading-relaxed">Your spreadsheet document rows **must contain these column headers** exactly in Row #1. Spelled typography mapping faults will trigger a database rollover cancellation.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block">Required Header Layout Fields Sequence</label>
                                    <div className="bg-slate-900 text-indigo-300 font-mono text-[10px] p-2.5 rounded-lg border tracking-wide whitespace-pre-wrap select-all">
                                        {activeSchema.headers.join(', ')}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 block">Spreadsheet Row Context String Example (.CSV)</label>
                                    <div className="bg-white border text-slate-600 font-mono text-[10px] p-2.5 rounded-lg select-all">
                                        <p className="text-slate-300 border-b pb-1 mb-1 font-bold text-[9px] tracking-widest">HEADER & ROW DATA STRINGS</p>
                                        <p className="text-slate-400 italic">{activeSchema.headers.join(',')}</p>
                                        <p className="text-slate-800 font-bold mt-1">{activeSchema.example}</p>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT INSIDE PANEL: STREAM UPLOAD FORMS CONTROLS */}
                            <form onSubmit={executeUploadMigration} className="md:col-span-3 p-5 flex flex-col justify-between" encType="multipart/form-data">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5"><FileSpreadsheet className="text-emerald-500" size={14}/> Bulk Ingestion Engine Vector: {activeSchema.title}</h3>
                                    
                                    <div className="space-y-1 mt-6">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Map CSV Spreadsheet Document</label>
                                        <input id="hub_csv_file_node_input" type="file" required accept=".csv" disabled={isProcessing} className="w-full text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 focus:outline-none file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-900 file:text-white cursor-pointer" onChange={e => setCsvFile(e.target.files[0])} />
                                    </div>
                                </div>

                                <button type="submit" disabled={isProcessing || !csvFile} className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md flex justify-center items-center gap-2 cursor-pointer mt-8">
                                    {isProcessing ? <Loader2 size={13} className="animate-spin"/> : <Upload size={13}/>}
                                    {isProcessing ? "Processing Data Sheet Allocation Locks..." : `Finalize ${activeTab} Migration Ingestion`}
                                </button>
                            </form>

                        </div>

                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

