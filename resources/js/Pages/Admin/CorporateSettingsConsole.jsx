import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
    Settings, Building, Mail, Phone, MapPin, 
    BadgeDollarSign, MessageSquareCode, Palette, 
    Save, Loader2, CheckCircle2, Upload, ImageIcon 
} from 'lucide-react';
import axios from 'axios';

export default function CorporateSettingsConsole({ currentSettings }) {
    const [isSaving, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    // Staging previews for white-label image binaries dynamically
    const [logoPreview, setLogoPreview] = useState(
        currentSettings?.logo_path ? `/storage/${currentSettings.logo_path}` : null
    );
    const [selectedFile, setSelectedFile] = useState(null);

    // Bind current configurations parameters straight to state anchors
    const [settingsForm, setSettingsForm] = useState({
        company_name: currentSettings?.company_name || '',
        company_email: currentSettings?.company_email || '',
        phone_number: currentSettings?.phone_number || '',
        address: currentSettings?.address || '',
        currency_code: currentSettings?.currency_code || 'KES',
        receipt_footer_text: currentSettings?.receipt_footer_text || '',
        primary_color_hex: currentSettings?.primary_color_hex || '#4f46e5'
    });

    // Intercept image selections and compile local DataURL string streams
    const handleLogoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleSettingsUpdateSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatusMessage(null);

        // DATA PACKING MATRIX: Populate payload objects for multipart streams
        const dataPayload = new FormData();
        dataPayload.append('company_name', settingsForm.company_name);
        dataPayload.append('company_email', settingsForm.company_email);
        dataPayload.append('phone_number', settingsForm.phone_number);
        dataPayload.append('address', settingsForm.address);
        dataPayload.append('currency_code', settingsForm.currency_code);
        dataPayload.append('receipt_footer_text', settingsForm.receipt_footer_text);
        dataPayload.append('primary_color_hex', settingsForm.primary_color_hex);
        
        if (selectedFile) {
            dataPayload.append('logo_file', selectedFile);
        }

        axios.post('/api/admin/settings/update', dataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then(res => {
            setStatusMessage({ type: 'success', text: res.data.message });
            setIsSubmitting(false);
            router.reload({ preserveScroll: true });
        })
        .catch(err => {
            alert(err.response?.data?.message || "Configuration overwrite rejected.");
            setIsSubmitting(false);
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-bold leading-tight text-slate-800 flex items-center gap-2">
                    <Settings className="text-indigo-600"/> Corporate Profile, Custom Branding & White-Label Settings Console
                </h2>
            }
        >
            <Head title="System Config Settings" />
            <div className="py-6 bg-slate-100 min-h-screen space-y-4">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-4">
                    
                    {statusMessage && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 border ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            <span className="text-sm font-semibold">{statusMessage.text}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                        {/* LEFT MATRIX PANEL: CONFIGURATION PARAMETERS FORM INPUTS */}
                        <form onSubmit={handleSettingsUpdateSubmit} className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider">
                                Modify Operations Workspace Attributes
                            </div>
                            <div className="p-5 space-y-4 text-xs font-semibold">
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Legal Entity Corporate/Company Name</label>
                                    <div className="relative">
                                        <Building size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-medium text-slate-700" value={settingsForm.company_name} onChange={e => setSettingsForm({...settingsForm, company_name: e.target.value})} />
                                    </div>
                                </div>

                                {/* BRAND ASSET LOGO UPLOAD COMPONENT WIDGET */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Corporate Brand Identity Logo Graphic</label>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                                        <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Matrix Preview" className="h-full w-full object-contain" />
                                            ) : (
                                                <ImageIcon size={20} className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-grow space-y-1 text-center sm:text-left w-full">
                                            <p className="text-[11px] text-slate-500 font-bold">Upload dynamic logo image vector to override text banners across layout grids</p>
                                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg cursor-pointer text-[11px] font-bold text-slate-700 transition-all shadow-3xs">
                                                <Upload size={12} className="text-indigo-500" />
                                                Choose Image File
                                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                                            </label>
                                            <span className="text-[10px] text-slate-400 font-medium ml-2 block sm:inline truncate">{selectedFile ? selectedFile.name : 'No changes staged'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Corporate Support Email</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                            <input type="email" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-medium font-mono" value={settingsForm.company_email} onChange={e => setSettingsForm({...settingsForm, company_email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Customer Help Hotline Telephone Line</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                                            <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-medium font-mono" value={settingsForm.phone_number} onChange={e => setSettingsForm({...settingsForm, phone_number: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Physical Facility Address Location</label>
                                    <div className="relative">
                                        <MapPin size={14} className="absolute left-3 top-3.5 text-slate-400" />
                                        <textarea rows="2" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-medium text-slate-700" value={settingsForm.address} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})}></textarea>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Trading Currency Code</label>
                                        <div className="relative">
                                            <BadgeDollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                                            <input type="text" required maxLength="10" placeholder="e.g. KES" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-black font-mono text-slate-700 uppercase" value={settingsForm.currency_code} onChange={e => setSettingsForm({...settingsForm, currency_code: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Primary UI Branding Color Hex</label>
                                        <div className="flex gap-2 items-center">
                                            <div className="relative flex-grow">
                                                <Palette size={14} className="absolute left-3 top-3 text-slate-400" />
                                                <input type="text" required maxLength="7" placeholder="#4f46e5" className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-bold font-mono text-slate-700" value={settingsForm.primary_color_hex} onChange={e => setSettingsForm({...settingsForm, primary_color_hex: e.target.value})} />
                                            </div>
                                            <input type="color" className="w-10 h-[38px] p-0.5 border border-slate-200 bg-white rounded-lg cursor-pointer" value={settingsForm.primary_color_hex} onChange={e => setSettingsForm({...settingsForm, primary_color_hex: e.target.value})} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">POS Print Thermal Receipt Footer Text</label>
                                    <div className="relative">
                                        <MessageSquareCode size={14} className="absolute left-3 top-3 text-slate-400" />
                                        <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 pl-10 bg-slate-50 font-bold text-slate-700" value={settingsForm.receipt_footer_text} onChange={e => setSettingsForm({...settingsForm, receipt_footer_text: e.target.value})} />
                                    </div>
                                </div>

                            </div>

                            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-md transition-all"
                                >
                                    {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                    {isSaving ? "Re-Caching Core Parameters..." : "Save Configuration Matrix"}
                                </button>
                            </div>
                        </form>
                        {/* RIGHT MATRIX PANEL: HIGH-FIDELITY LIVE HARDCOPY RECEIPT PREVIEW */}
                        <div className="lg:col-span-2 space-y-3 sticky top-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Live Document Canvas Blueprint Preview</h4>
                            
                            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-6 text-slate-800 space-y-4 font-sans ring-1 ring-slate-900/5">
                                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-200 flex flex-col items-center">
                                    {/* DYNAMIC LOGO IMAGE OVERRIDE CANVAS INTERCEPTOR */}
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Dynamic Receipt Header" className="h-10 max-w-[160px] object-contain mb-1" />
                                    ) : (
                                        <h3 className="font-black text-md tracking-wider uppercase truncate" style={{ color: settingsForm.primary_color_hex }}>
                                            {settingsForm.company_name || 'PHARMACORE ECOSYSTEM'}
                                        </h3>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-medium truncate w-full">{settingsForm.address || 'Oginga Odinga St, Kisumu, Kenya'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold font-mono">TEL: {settingsForm.phone_number || '+254 700 112233'}</p>
                                    <p className="text-[9px] text-slate-400 font-medium font-mono truncate w-full">{settingsForm.company_email}</p>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-600 border-b border-dashed border-slate-200 pb-3 font-mono">
                                    <p className="flex justify-between"><span>Invoice Code:</span> <span className="font-bold text-slate-900">INV-20261027-0042</span></p>
                                    <p className="flex justify-between"><span>Dispenser ID:</span> <span className="text-slate-900">Pharmacist #1</span></p>
                                    <p className="flex justify-between"><span>Payment Mode:</span> <span className="font-bold text-slate-900">M-Pesa</span></p>
                                </div>

                                <div className="space-y-1 text-xs pt-1">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1">
                                        <span>Description</span>
                                        <span>Amount</span>
                                    </div>
                                    <div className="flex justify-between font-mono text-[11px] text-slate-700">
                                        <span>Amoxicillin 500mg × 30</span>
                                        <span>{settingsForm.currency_code} 1,200.00</span>
                                    </div>
                                    <div className="flex justify-between font-mono text-[11px] text-slate-700">
                                        <span>Paracetamol Tabs × 20</span>
                                        <span>{settingsForm.currency_code} 300.00</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center">
                                        <span className="font-black text-slate-900 text-[11px] uppercase tracking-wide">TOTAL CHARGED</span>
                                        <span className="font-black text-base font-mono text-slate-900">
                                            {settingsForm.currency_code} 1,500.00
                                        </span>
                                    </div>
                                </div>

                                <div className="text-center pt-4 text-[10px] text-slate-400 font-bold tracking-wider uppercase border-t border-dashed border-slate-200 break-words w-full">
                                    {settingsForm.receipt_footer_text || '*** Thank you for shopping with us ***'}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
