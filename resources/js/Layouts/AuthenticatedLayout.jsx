import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, ShoppingCart, Users, Layers, AlertTriangle, 
    ShoppingBag, Building, Landmark, Scale, BarChart3, Receipt, 
    ShieldAlert, Settings, UserCheck, Activity, Database, CalendarX, 
    ClipboardList, ChevronDown, ChevronRight, Menu, LogOut, X, Bell, Cpu  
} from 'lucide-react';
import axios from 'axios';

export default function AuthenticatedLayout({ header, children }) {
    const { props } = usePage();
    const corporateBranding = props.corporateBranding;

    const sessionAuth = props.auth;
    const currentUser = sessionAuth?.user;
    const userRole = currentUser?.role || 'cashier';

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [expandedFolders, setExpandedFolders] = useState({
        operations: true,
        supply: true,
        analytics: true,
        system: true
    });

    // NEW LOGISTICS HUB STATES: Track notification aggregates asynchronously
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationDropdownOpen, setIsNotifDropdownOpen] = useState(false);

    const toggleFolder = (folderKey) => {
        setExpandedFolders(prev => ({ ...prev, [folderKey]: !prev[folderKey] }));
    };

    // Polling Routine: Intercepts active product reorder alerts and short lots
    const fetchSystemNotificationsFeed = () => {
        axios.get('/api/live-notifications')
            .then(res => {
                setNotifications(res.data.feed || []);
                setUnreadCount(res.data.count || 0);
            })
            .catch(() => console.error("Notification pipeline sync dropped."));
    };

    useEffect(() => {
        fetchSystemNotificationsFeed();
        const intervalRegistryTimer = setInterval(fetchSystemNotificationsFeed, 60000); 
        return () => clearInterval(intervalRegistryTimer);
    }, []);
    const navigationRegistry = [
        {
            key: 'operations',
            title: 'Core Operations',
            icon: Activity,
            roles: ['admin', 'pharmacist', 'cashier'],
            links: [
                { name: 'Operations Dashboard', route: 'dashboard', icon: LayoutDashboard },
                { name: 'POS Register Desk', route: 'pos.index', icon: ShoppingCart },
                { name: 'Patient Registry', route: 'patient.management', icon: Users }
            ]
        },
        {
            key: 'supply',
            title: 'Inventory & Supply',
            icon: Layers,
            roles: ['admin', 'pharmacist'],
            links: [
                { name: 'Inventory Console', route: 'stock.management', icon: Layers },
                { name: 'Low Stock Reorder Desk', route: 'stock.reorder_console', icon: AlertTriangle },
                { name: 'Batch Expiry Alerts', route: 'admin.expiry_alerts', icon: CalendarX },
                { name: 'Inward Purchases', route: 'purchase.consignment', icon: ShoppingBag },
                { name: 'Wholesaler Portals', route: 'supplier.management', icon: Building },
                { name: 'Wholesaler Liabilities', route: 'supplier.debt', icon: Landmark }
            ]
        }
    ];

    const administrativeRegistry = [
        {
            key: 'analytics',
            title: 'Business Intelligence',
            icon: BarChart3,
            roles: ['admin', 'pharmacist'],
            links: [
                { name: 'P&L Statements', route: 'financial.reporting', icon: Scale },
                { name: 'Executive Analytics BI', route: 'admin.executive_analytics', icon: BarChart3 },
                { name: 'Facility Overheads Ledger', route: 'admin.expenses_index', icon: Receipt },
                { name: 'Controlled Substance Logs', route: 'reports.controlled_substances', icon: ShieldAlert }
            ]
        },
        {
            key: 'system',
            title: 'System Administration',
            icon: Settings,
            roles: ['admin'],
            links: [
                { name: 'Corporate Layout Settings', route: 'admin.settings_index', icon: Settings },
                { name: 'Bulk Data Migration Hub', route: 'admin.migration_hub', icon: Database },
                { name: 'Security Audit Trails', route: 'audit.logs', icon: ClipboardList },
                { name: 'User Management Console', route: 'admin.users_index', icon: UserCheck },
                { name: 'Infrastructure Telemetry', route: 'admin.system_health', icon: Activity },
                { name: 'Disaster Recovery Vault', route: 'admin.backups_index', icon: Database },
                { name: 'System Maintenance Desk', route: 'admin.maintenance_index', icon: Cpu },
                { name: 'Terminal IP Security Desk', route: 'admin.terminal_security', icon: ShieldAlert },
                { name: 'Database Session Overlord', route: 'admin.process_killer', icon: ShieldAlert },
                
            ]
        }
    ];

    const masterRegistry = [...navigationRegistry, ...administrativeRegistry];
    return (
        <div className="min-h-screen bg-slate-100 flex">
            
            {/* DESKTOP SIDEBAR */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col shrink-0 hidden md:flex">
                <div className="p-4 border-b border-slate-800 flex items-center gap-2 min-h-[57px]">
                    {corporateBranding?.logo_path ? (
                        <div className="w-full flex items-center justify-start overflow-hidden">
                            <img 
                                src={`/storage/${corporateBranding.logo_path}`} 
                                alt={corporateBranding?.company_name || 'Brand Logo'} 
                                className="h-10 max-h-11 w-auto max-w-[95%] object-contain block"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallbackText = document.getElementById('sidebar-text-fallback');
                                    if (fallbackText) fallbackText.style.display = 'flex';
                                }}
                            />
                            <div id="sidebar-text-fallback" className="hidden items-center gap-2">
                                <Activity style={{ color: corporateBranding?.primary_color_hex || '#4f46e5' }} strokeWidth={2.5} size={20} />
                                <span className="text-sm font-black text-white uppercase tracking-wider truncate">{corporateBranding?.company_name || 'ORVELLAE PHARMACY'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Activity 
                                style={{ color: corporateBranding?.primary_color_hex || '#4f46e5' }} 
                                strokeWidth={2.5} 
                                size={20} 
                            />
                            <span className="text-sm font-black text-white uppercase tracking-wider truncate">
                                {corporateBranding?.company_name || 'ORVELLAE PHARMACY'}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto px-3 py-4 space-y-4 select-none">
                    {masterRegistry.map((folder) => {
                        if (!folder.roles.includes(userRole)) return null;
                        const isFolderOpen = expandedFolders[folder.key];
                        const FolderIcon = folder.icon;

                        return (
                            <div key={folder.key} className="space-y-1">
                                <div 
                                    onClick={() => toggleFolder(folder.key)}
                                    className="flex items-center justify-between px-2.5 py-2 text-[10px] font-black uppercase text-slate-500 tracking-wider hover:text-slate-200 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <FolderIcon size={12} className="text-slate-600 shrink-0" />
                                        <span>{folder.title}</span>
                                    </div>
                                    {isFolderOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                </div>

                                {isFolderOpen && (
                                    <div className="space-y-0.5 pl-2 border-l border-slate-800/80 ml-2 animate-slide-down">
                                        {folder.links.map((link) => {
                                            const isActive = route().current(link.route);
                                            const LinkIcon = link.icon;
                                            const brandColor = corporateBranding?.primary_color_hex || '#4f46e5';

                                            return (
                                                <Link
                                                    key={link.name}
                                                    href={route(link.route)}
                                                    style={isActive ? { 
                                                        backgroundColor: `${brandColor}15`, 
                                                        borderColor: `${brandColor}30`,
                                                        color: brandColor
                                                    } : {}}
                                                    className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all border ${
                                                        isActive ? 'font-bold' : 'border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                                    }`}
                                                >
                                                    <LinkIcon size={14} style={isActive ? { color: brandColor } : {}} className={isActive ? "" : "text-slate-500 group-hover:text-slate-400"} />
                                                    <span className="truncate">{link.name}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-xs font-semibold flex items-center justify-between">
                    <div className="truncate max-w-[70%]">
                        <p className="text-slate-200 font-bold truncate">{currentUser?.name || 'Operator'}</p>
                        <p className="text-[9px] font-mono text-slate-500 uppercase font-black tracking-widest">{userRole}</p>
                    </div>
                    <Link method="post" href={route('logout')} as="button" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors">
                        <LogOut size={14}/>
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-grow flex flex-col min-w-0">
                <header className="bg-white border-b border-slate-200 h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 shadow-2xs z-40">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg md:hidden">
                            <Menu size={18}/>
                        </button>
                        {header && <div className="hidden sm:block">{header}</div>}
                    </div>

                    <div className="flex items-center gap-4">
                        
                        {/* DATA-DRIVEN INTERACTIVE NOTIFICATION HUB OVERLAY */}
                        <div className="relative">
                            <button 
                                type="button" 
                                onClick={() => setIsNotifDropdownOpen(!isNotificationDropdownOpen)}
                                className="relative cursor-pointer text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
                            >
                                <Bell size={16}/>
                                {unreadCount > 0 && (
                                    <>
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                    </>
                                )}
                            </button>

                            {isNotificationDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-xs animate-scale-up">
                                    <div className="p-3 bg-slate-900 text-white font-bold flex justify-between items-center text-[11px] uppercase tracking-wider">
                                        <span>System Notification Hub</span>
                                        <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-black font-mono">{unreadCount} Alerts</span>
                                    </div>
                                    
                                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 bg-white">
                                        {notifications.length === 0 ? (
                                            <p className="p-4 text-center text-slate-400 font-medium italic">All inventory parameters maintain safe margins.</p>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div key={notif.id} className="p-3 hover:bg-slate-50/60 transition-colors space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`font-black text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                                                            notif.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-amber-50 border-amber-100 text-amber-700'
                                                        }`}>
                                                            {notif.title}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium font-mono">{notif.timestamp}</span>
                                                    </div>
                                                    <p className="text-slate-600 font-medium leading-relaxed">{notif.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    
                                    <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                        <button 
                                            type="button" 
                                            onClick={() => { setIsNotifDropdownOpen(false); router.get(route('dashboard')); }}
                                            className="w-full text-center text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 py-1"
                                        >
                                            Review System Command Center
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 h-6 text-xs font-bold text-slate-700">
                            <span className="hidden sm:inline font-sans">{currentUser?.name || 'User'}</span>
                            <div className="h-7 w-7 rounded-full bg-slate-900 border text-white text-[10px] font-black uppercase flex items-center justify-center select-none shadow-2xs">
                                {currentUser?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>
                {/* MOBILE VIEW DRAWER */}
                {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMobileSidebarOpen(false)}></div>
                        <aside className="relative w-64 max-w-xs bg-slate-900 text-slate-400 flex flex-col p-4 space-y-4 shadow-2xl h-full">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <span className="text-sm font-black text-white uppercase tracking-wider">PHARMACORE OS</span>
                                <button type="button" onClick={() => setIsMobileSidebarOpen(false)} className="text-slate-400 hover:text-white p-1"><X size={16}/></button>
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-4 pr-1 text-xs font-bold">
                                {masterRegistry.map((folder) => {
                                    if (!folder.roles.includes(userRole)) return null;
                                    return (
                                        <div key={folder.key} className="space-y-1">
                                            <p 
                                                onClick={() => toggleFolder(folder.key)}
                                                className="text-[9px] font-black uppercase tracking-wider text-slate-500 px-2 py-1 cursor-pointer hover:text-slate-300"
                                            >
                                                {folder.title}
                                            </p>
                                            {expandedFolders[folder.key] && (
                                                <div className="space-y-0.5 pl-2 border-l border-slate-800">
                                                    {folder.links.map(link => (
                                                        <Link key={link.name} href={route(link.route)} onClick={() => setIsMobileSidebarOpen(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${route().current(link.route) ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}>
                                                            <link.icon size={13} /><span>{link.name}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </aside>
                    </div>
                )}

                <main className="flex-grow overflow-y-auto p-4 sm:p-6 bg-slate-100 z-10">
                    {header && <div className="sm:hidden mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">{header}</div>}
                    {children}
                </main>
            </div>
        </div>
    );
}
