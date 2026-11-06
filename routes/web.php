<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PharmacyDashboardController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\InventoryExportController;
use App\Http\Controllers\SupplierDebtController;
use App\Http\Controllers\ReportingController;
use App\Http\Controllers\PurchaseController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

//Route::get('/dashboard', function () {
//    return Inertia::render('Dashboard');
//})->middleware(['auth', 'verified'])->name('dashboard');
Route::get('/dashboard', [PharmacyDashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Web view route to render the checkout interface page
    Route::get('/pos', function () {
        return Inertia::render('Pos/Register');
    })->name('pos.index');

    // API endpoints consumed by React in real-time
    Route::get('/api/inventory', [PosController::class, 'getActiveInventory']);
    Route::post('/api/checkout', [PosController::class, 'storeInvoice']);

    // Document export stream endpoint
    Route::get('/reports/inventory/export', [InventoryExportController::class, 'generateInventoryMarkdownReport'])->name('reports.inventory.export');

    // Audit trails UI web page display path
    Route::get('/audit-logs', [ReportingController::class, 'getAuditLogs'])->name('audit.logs');

    Route::get('/api/barcode/{sku}', [InventoryExportController::class, 'streamProductBarcode'])->name('barcode.stream');

    Route::get('/api/reports/supplier-aging', [\App\Http\Controllers\SupplierDebtController::class, 'getAgingAnalysisSummary'])->name('reports.supplier_aging');

    Route::get('/api/inventory/print-manifest', [App\Http\Controllers\InventoryExportController::class, 'streamCatalogPdfManifest'])->name('stock.print_manifest');

    Route::get('/api/live-notifications', [App\Http\Controllers\PharmacyDashboardController::class, 'getLiveNotificationFeed'])->name('api.live_notifications');

    Route::post('/api/purchases/{id}/bulk-receive-staged', [App\Http\Controllers\PurchaseController::class, 'processBulkStagedArrivalCheckout']);

    //Route::get('/inward-purchases', [App\Http\Controllers\PurchaseController::class, 'indexInwardPurchasesConsole'])->name('purchase.consignment');

    Route::get('/api/purchases/{id}/items', [App\Http\Controllers\PurchaseController::class, 'getPurchaseOrderItemsFeed']);

    //Route::get('/api/purchases/supplier/{supplierId}/pending-po', [App\Http\Controllers\PurchaseController::class, 'getPendingPoForSupplier']);

    Route::get('/api/purchases/supplier/{supplierId}/pending-po', [App\Http\Controllers\PurchaseController::class, 'getPendingPoForSupplier'])->name('api.supplier_pending_po');

    // Supplier credit analytics view page display path
    Route::get('/supplier-debt', function () {
        // Fetch aging json internally to pre-load data into Inertia page views
        $summary = app(\App\Http\Controllers\SupplierDebtController::class)->getAgingAnalysisSummary()->getData();
        return Inertia\Inertia::render('Reports/SupplierDebt', [
            'initialLedger' => $summary
        ]);
    })->name('supplier.debt');


    // --- CASHIER, PHARMACIST, & ADMIN SHARED SPACE ---
    /*Route::get('/pos', function () {
        return Inertia::render('Pos/Register');
    })->name('pos.index');*/

    // Upgraded view path passing active shift context and first page inventory
    Route::get('/pos', [PosController::class, 'showRegisterConsole'])->name('pos.index');
    
    // Asynchronous backend endpoints for the scaling register desk
    Route::get('/api/pos/active-scripts', [PosController::class, 'getPendingPrescriptionsQueue']);
    Route::get('/api/pos/scripts/{id}/load', [PosController::class, 'loadScriptIntoCart']);
    Route::post('/api/pos/shift/reconcile', [PosController::class, 'processShiftReconciliation']);

    // FIXED: Corrected spelling typo from PPosController to PosController
    Route::get('/api/pos/sales-history', [PosController::class, 'getSalesHistory']);
    Route::get('/api/pos/sales/{id}/reprint', [PosController::class, 'getInvoiceDetailsForReprint']);
    
    // ACCUMULATOR EXPORT ROADWAY: Exposes the streaming download pipe endpoint
    Route::get('/api/pos/sales-history/export', [PosController::class, 'exportSalesLedgerCsv']);


    // --- PHARMACIST & ADMIN ONLY DESKS ---
    Route::middleware(['role:admin,pharmacist'])->group(function () {
        Route::post('/api/checkout', [\App\Http\Controllers\PosController::class, 'storeInvoice']);
        // Direct checkout route to the authoritative transactional POS processor handler
        Route::post('/api/checkout', [App\Http\Controllers\PosController::class, 'processCheckout']);

        Route::post('/api/stock/receive', [PurchaseController::class, 'receiveSupplierStock']);

        
    });


       // --- ADMIN EXECUTIVE AUDITING ONLY DESKS ---
    Route::middleware(['role:admin'])->group(function () {
        
        // ADMINISTRATIVE IDENTITY DESK GROUP
        Route::get('/admin/users', [App\Http\Controllers\ReportingController::class, 'getUserManagementConsole'])->name('admin.users_index');
        Route::post('/api/admin/users/store', [App\Http\Controllers\ReportingController::class, 'registerSystemOperatorUser'])->name('admin.users_store');
        Route::post('/api/admin/users/{id}/toggle-status', [App\Http\Controllers\ReportingController::class, 'toggleOperatorAccessStatus'])->name('admin.users_toggle');

        // ADMINISTRATIVE TELEMETRY DESK GROUP
        Route::get('/admin/system-health', [App\Http\Controllers\ReportingController::class, 'getSystemHealthTelemetry'])->name('admin.system_health');

        // SYSTEM MAINTENANCE DESK (Single Clean Definition)
        Route::get('/admin/maintenance', [App\Http\Controllers\ReportingController::class, 'getMaintenanceConsoleIndex'])->name('admin.maintenance_index');
        Route::post('/api/admin/maintenance/optimize', [App\Http\Controllers\ReportingController::class, 'runDatabaseMaintenanceRoutine'])->name('admin.maintenance_run');

        // MULTI-TERMINAL IP SECURITY DESK (Single Clean Definition)
        Route::get('/admin/terminal-security', [App\Http\Controllers\ReportingController::class, 'getTerminalSecurityConsoleIndex'])->name('admin.terminal_security');
        Route::post('/api/admin/terminal-security/store', [App\Http\Controllers\ReportingController::class, 'authorizeNewTerminalIp'])->name('admin.terminal_store');
        Route::post('/api/admin/terminal-security/{id}/toggle', [App\Http\Controllers\ReportingController::class, 'toggleTerminalAuthorizationStatus'])->name('admin.terminal_toggle');
        Route::delete('/api/admin/terminal-security/{id}/purge', [App\Http\Controllers\ReportingController::class, 'revokeTerminalAuthorizationLock'])->name('admin.terminal_purge');

        // INSURANCE PORTFOLIO PATIENT COPAY ROUTE
        Route::get('/api/patients/{id}/policies', [App\Http\Controllers\InventoryExportController::class, 'getPatientPoliciesFeed'])->name('api.patient_policies');
        Route::post('/api/patients/policies/store', [App\Http\Controllers\InventoryExportController::class, 'linkNewInsurancePolicyToPatient'])->name('patients.policy_store');
        Route::get('/api/insurance-providers', [App\Http\Controllers\InventoryExportController::class, 'getActiveInsuranceProviders'])->name('api.insurance_providers');

        // ADMINISTRATIVE RECOVERY & BACKUP DESK GROUP
        Route::get('/admin/backups', [App\Http\Controllers\ReportingController::class, 'getBackupConsoleIndex'])->name('admin.backups_index');
        Route::post('/api/admin/backups/trigger', [App\Http\Controllers\ReportingController::class, 'triggerInstantDatabaseBackup'])->name('admin.backups_trigger');
        Route::get('/admin/backups/{id}/download', [App\Http\Controllers\ReportingController::class, 'downloadBackupBinarySnapshot'])->name('admin.backups_download');

        // ADMINISTRATIVE CONFIGURATION & WHITE-LABEL BRANDING GROUP
        Route::get('/admin/settings', [App\Http\Controllers\ReportingController::class, 'getSystemSettingsConsoleIndex'])->name('admin.settings_index');
        Route::post('/api/admin/settings/update', [App\Http\Controllers\ReportingController::class, 'updateSystemConfigurationSettings'])->name('admin.settings_update');

        // ADMINISTRATIVE SESSION OVERLORD & QUERY PERFORMANCE KILLER GROUP
        Route::get('/admin/process-killer', [App\Http\Controllers\ReportingController::class, 'getDatabaseSessionKillerIndex'])->name('admin.process_killer');
        Route::post('/api/admin/process-killer/{pid}/terminate', [App\Http\Controllers\ReportingController::class, 'terminateActiveDatabaseSession'])->name('admin.process_terminate');

        // EXECUTIVE BUSINESS INTELLIGENCE & ANALYTICS PIPELINE
        Route::get('/admin/executive-analytics', [App\Http\Controllers\ReportingController::class, 'getExecutiveAnalyticsDashboard'])->name('admin.executive_analytics');

        // ADMINISTRATIVE EXPENSES & OVERHEADS DESK GROUP
        Route::get('/admin/expenses', [App\Http\Controllers\ReportingController::class, 'getExpenseRegistryConsoleIndex'])->name('admin.expenses_index');
        Route::post('/api/admin/expenses/store', [App\Http\Controllers\ReportingController::class, 'storeNewOperationalExpenseRow'])->name('admin.expenses_store');

        // ADMINISTRATIVE BATCH EXPIRY PROACTIVE FORECASTING GROUP
        Route::get('/admin/expiry-alerts', [App\Http\Controllers\ReportingController::class, 'getBatchExpiryProactiveConsoleIndex'])->name('admin.expiry_alerts');

        Route::get('/audit-logs', [ReportingController::class, 'getAuditLogs'])->name('audit.logs');
        Route::get('/supplier-debt', function () {
            $summary = app(SupplierDebtController::class)->getAgingAnalysisSummary()->getData();
            return Inertia::render('Reports/SupplierDebt', ['initialLedger' => $summary]);
        })->name('supplier.debt');
    });

    Route::middleware(['auth', 'verified', 'terminal_ip_guard'])->group(function () {
    // All your active operational checkout, pos, and inventory routes are now tightly secured!
    });


    Route::get('/api/alert-counters', [App\Http\Controllers\PharmacyDashboardController::class, 'getAlertCounters']);

    Route::get('/api/patients-search', [App\Http\Controllers\PosController::class, 'searchPatients']);


    // --- USER INTERFACE MANAGEMENT PATHS ---
    /*Route::get('/stock-management', function () {
    // Pull products along with their real-time batch stock metrics
        $products = \App\Models\Product::select('id', 'name', 'sku', 'generic_name', 'requires_prescription')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'stock')
            ->get();
            
        $suppliers = \App\Models\Supplier::select('id', 'name')->get();

        // REPAIRED FROM Inertia\Inertia::render TO Inertia::render
        return Inertia::render('Stock/ManagementConsole', [
            'products' => $products,
            'suppliers' => $suppliers
        ]);
    })->name('stock.management');*/

    // Upgraded view path supporting server-side item lookups
    Route::get('/stock-management', function (\Illuminate\Http\Request $request) {
        $search = $request->get('search');
        
        $query = \App\Models\Product::select('id', 'name', 'sku', 'generic_name', 'requires_prescription', 'reorder_level')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'stock');

        if (!empty($search)) {
            $query->where('name', 'ILIKE', "%{$search}%")->orWhere('sku', 'LIKE', "%{$search}%");
        }

        $products = $query->paginate(10)->withQueryString();
        $suppliers = \App\Models\Supplier::select('id', 'name')->get();

        return Inertia::render('Stock/ManagementConsole', [
            'products' => $products,
            'suppliers' => $suppliers,
            'filters' => $request->only(['search'])
        ]);
    })->name('stock.management');

    // --- FORM BACKEND STORAGE ENDPOINTS ---
    Route::post('/api/products/store', [App\Http\Controllers\InventoryExportController::class, 'addNewProduct']);
    Route::post('/api/batches/store', [App\Http\Controllers\InventoryExportController::class, 'addNewBatch']);

    // --- EXTENDED ENTERPRISE ENDPOINTS ---
    Route::get('/api/products/export-csv', [InventoryExportController::class, 'exportCatalogCsv'])->name('products.export');
    Route::post('/api/products/adjust-stock', [InventoryExportController::class, 'adjustBatchStock']);
    Route::get('/api/products/{id}/movement', [InventoryExportController::class, 'getProductMovementLogs']);
    Route::get('/api/products/{id}/batches', function($id) {
        return response()->json(\App\Models\Batch::where('product_id', $id)->where('quantity_remaining', '>', 0)->get());
    });
    


    // --- SUPPLIER PORTAL DISPLAY ROUTE ---
    Route::get('/supplier-management', function () {
        $suppliers = \App\Models\Supplier::with('products:id,name,sku')->get();
        $products = \App\Models\Product::select('id', 'name', 'sku')->get();

        return Inertia::render('Suppliers/VendorConsole', [
            'suppliers' => $suppliers,
            'products' => $products
        ]);
    })->name('supplier.management');

    Route::post('/api/suppliers/settle-payment', [App\Http\Controllers\SupplierDebtController::class, 'settleSupplierPayment'])->name('suppliers.settle_payment');

    // --- SUPPLIER ACTIONS API SINK ENDPOINTS ---
    Route::post('/api/suppliers/store', [App\Http\Controllers\InventoryExportController::class, 'addNewSupplier']);
    Route::post('/api/suppliers/link-product', [App\Http\Controllers\InventoryExportController::class, 'linkProductToVendor']);

    // Supplier credit analytics view page display path
    Route::get('/supplier-debt', function () {
        // Fetch aging json internally to pre-load data into Inertia page views
        $summary = app(\App\Http\Controllers\SupplierDebtController::class)->getAgingAnalysisSummary()->getData();
        $suppliers = \App\Models\Supplier::select('id', 'name')->get(); // Fetch active list
    
        // FIXED: Cleaned up the double namespace typo from Inertia\Inertia to standard Inertia
        return Inertia::render('Reports/SupplierDebt', [
            'initialLedger' => $summary,
            'suppliers' => $suppliers 
        ]);
    })->name('supplier.debt');


    // --- PATIENTS SYSTEM PORTAL VIEW ---
    /*Route::get('/patient-management', function () {
        $patients = \App\Models\Patient::with(['prescriptions' => function($q) {
            $q->orderBy('created_at', 'desc');
        }])->get();

        return Inertia::render('Patients/PatientConsole', [
            'patients' => $patients
        ]);
    })->name('patient.management');*/

    // Upgraded view path eagerly loading patient prescription details
    /*Route::get('/patient-management', function () {
        $patients = \App\Models\Patient::with(['prescriptions.items.product'])->get();
        $products = \App\Models\Product::select('id', 'name', 'sku')->get();

        return Inertia::render('Patients/PatientConsole', [
            'patients' => $patients,
            'products' => $products
        ]);
    })->name('patient.management');*/

    Route::get('/patient-management', [App\Http\Controllers\InventoryExportController::class, 'showPatientConsole'])->name('patient.management');
    Route::get('/api/prescriptions/export', [App\Http\Controllers\InventoryExportController::class, 'exportPrescriptionsData'])->name('prescriptions.export');


    
    // --- PATIENTS ACTIONS API ENDPOINTS ---
    Route::post('/api/patients/store', [App\Http\Controllers\InventoryExportController::class, 'addNewPatient']);
    Route::post('/api/prescriptions/store', [App\Http\Controllers\InventoryExportController::class, 'addNewPrescription']);
    
    // POS live asynchronous patient dictionary feed
    Route::get('/api/patients-lookup', function() {
        return response()->json(\App\Models\Patient::select('id', 'name', 'patient_number')->get());
    });

    // Add this inside the Route::middleware(['auth', 'verified'])->group loop
    Route::get('/api/prescriptions/export', [App\Http\Controllers\PatientManagementController::class, 'exportPrescriptionsData'])->name('prescriptions.export');

    Route::post('/api/prescriptions/store', [App\Http\Controllers\InventoryExportController::class, 'addNewPrescription']);
    Route::get('/api/prescriptions/{id}/print', [App\Http\Controllers\InventoryExportController::class, 'printSinglePrescription'])->name('prescriptions.print_single');


    // Asynchronous endpoint to fetch a single script's itemized details instantly via modal popups
    Route::get('/api/prescriptions/{id}', function ($id) {
        return response()->json(\App\Models\Prescription::with('items.product', 'patient')->findOrFail($id));
    });


    // --- PROCUREMENT INWARD STOCK INTAKE ROUTE ---
    Route::get('/purchase-consignment', function () {
        $suppliers = \App\Models\Supplier::select('id', 'name')->get();
        $products = \App\Models\Product::select('id', 'name', 'sku')->get();

        return Inertia::render('Purchases/InwardLotConsole', [
            'suppliers' => $suppliers,
            'products' => $products
        ]);
    })->name('purchase.consignment');

    // --- FORM BACKEND STORAGE ENDPOINT CONNECTION ---
    Route::post('/api/purchases/receive', [\App\Http\Controllers\PurchaseController::class, 'receiveSupplierStock']);

    // --- EXECUTIVE PROFIT & LOSS STATEMENT WORKSPACE ROUTE ---
    //Route::get('/financial-reporting', function () {
    //    return Inertia::render('Reports/ProfitLossHub');
    //})->name('financial.reporting');
    
    // API endpoint consumed by our React date-picker filters dynamically
    Route::get('/api/reports/profit-loss', [\App\Http\Controllers\ReportingController::class, 'getProfitLossSummary']);

    Route::get('/financial-reporting', [App\Http\Controllers\ReportingController::class, 'getProfitLossSummary'])->name('financial.reporting');

    // Spreadsheet data export channel connection
    Route::get('/api/reports/financial/export-csv', [\App\Http\Controllers\ReportingController::class, 'exportFinancialCsv'])->name('reports.financial.csv');

    // Ensure these API endpoints are active inside your authenticated web group mapping:
    Route::get('/api/inventory-lookup', [App\Http\Controllers\PosController::class, 'getActiveInventory'])->name('api.inventory_lookup');
    Route::get('/api/patients-search', [App\Http\Controllers\PosController::class, 'searchPatients'])->name('api.patients_search');

    Route::get('/api/pos/inventory/export', [App\Http\Controllers\PosController::class, 'exportPosInventoryData'])->name('pos.inventory_export');

    Route::get('/api/suppliers/{id}/transactions', [App\Http\Controllers\SupplierDebtController::class, 'getSupplierTransactionHistory'])->name('suppliers.transactions_lookup');

    Route::post('/api/products/update', [App\Http\Controllers\InventoryExportController::class, 'updateProductProfile'])->name('products.update_profile');

    Route::get('/controlled-substances', [App\Http\Controllers\ReportingController::class, 'getControlledSubstancesLedger'])->name('reports.controlled_substances');
    Route::get('/api/reports/controlled/export', [App\Http\Controllers\ReportingController::class, 'exportControlledSubstancesCsv'])->name('reports.controlled_export');

    Route::get('/low-stock-reorder', [App\Http\Controllers\PharmacyDashboardController::class, 'showLowStockReorderConsole'])->name('stock.reorder_console');
    Route::post('/api/purchases/auto-draft-po', [App\Http\Controllers\PurchaseController::class, 'autoDraftSupplierPurchaseOrder'])->name('api.auto_draft_po');


});


require __DIR__.'/auth.php';
