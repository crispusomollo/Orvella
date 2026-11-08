<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Expense;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Response;
use Carbon\Carbon;
use Inertia\Inertia;

class ReportingController extends Controller
{
    /**
     * Synthesize a comprehensive operational Profit & Loss statement payload matrix
     * Route Sourced: GET /financial-reporting
     */
    public function getProfitLossSummary(Request $request)
    {
        // 1. FIXED: Set safe default bounds for initial sidebar click queries
        $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        // 2. Query dynamic top-line Gross POS Revenues accumulated during this timeframe
        $grossSales = Sale::whereBetween('created_at', [
            Carbon::parse($startDate)->startOfDay(), 
            Carbon::parse($endDate)->endOfDay()
        ])->sum('total_amount') ?? 0.00;

        // 3. Compute the exact Cost of Goods Sold (COGS) by cross-referencing batch procurement costs
        $costOfGoodsSold = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->whereBetween('sales.created_at', [
                Carbon::parse($startDate)->startOfDay(), 
                Carbon::parse($endDate)->endOfDay()
            ])
            ->sum(DB::raw('sales_items.quantity * batches.cost_price')) ?? 0.00;

        // Gross Profit Calculation Formula: Top Line Sales minus Item Purchase Costs
        $grossProfit = $grossSales - $costOfGoodsSold;
        $grossMarginPercentage = $grossSales > 0 ? round(($grossProfit / $grossSales) * 100, 2) : 0.00;
        // 4. Calculate Operational Overheads: Total cash values drained across standard expenses
        $totalExpenses = Expense::whereBetween('date_incurred', [$startDate, $endDate])->sum('amount') ?? 0.00;

        // Net Profit Margin Formula: Gross Profit minus Operational Overheads
        $netProfit = $grossProfit - $totalExpenses;
        $netMarginPercentage = $grossSales > 0 ? round(($netProfit / $grossSales) * 100, 2) : 0.00;

        // 5. Build an itemised ledger timeline row list for daily performance tracing charts
        $timelineArray = [];
        $periodStart = Carbon::parse($startDate);
        $periodEnd = Carbon::parse($endDate);

        while ($periodStart->lte($periodEnd)) {
            $dateString = $periodStart->format('Y-m-d');
            $label = $periodStart->format('d M'); // e.g., '27 Oct'

            $daySales = Sale::whereDate('created_at', $dateString)->sum('total_amount') ?? 0.00;

            $dayCogs = DB::table('sales_items')
                ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
                ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
                ->whereDate('sales.created_at', $dateString)
                ->sum(DB::raw('sales_items.quantity * batches.cost_price')) ?? 0.00;

            $dayExpenses = Expense::whereDate('date_incurred', $dateString)->sum('amount') ?? 0.00;

            $timelineArray[] = [
                'date'       => $label,
                'revenue'    => (float)$daySales,
                'cogs'       => (float)$dayCogs,
                'expenses'   => (float)$dayExpenses,
                'net_profit' => (float)($daySales - ($dayCogs + $dayExpenses))
            ];

            $periodStart->addDay();
        }

        // 6. FIXED: Formatted output keys to match the exact keys expected by ProfitLossHub.jsx
        $payload = [
            'metrics' => [
                'gross_revenue'           => (float)$grossSales,
                'total_cogs'              => (float)$costOfGoodsSold,
                'gross_profit'            => (float)$grossProfit,
                'gross_margin_percentage' => (float)$grossMarginPercentage,
                'operating_expenses'      => (float)$totalExpenses,
                'net_profit'              => (float)$netProfit,
                'net_margin_percentage'   => (float)$netMarginPercentage,
            ],
            'timeline_data' => $timelineArray,
            'filters' => [
                'start_date' => $startDate,
                'end_date'   => $endDate
            ]
        ];

        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('Reports/ProfitLossHub', $payload);
    }

    /**
     * Extract paginated system audit trails with user relationships for the UI layout.
     */
    /*public function getAuditLogs(Request $request) // Updated parameter map to handle filters safely
    {
        // Retrieve historical logs sorted by newest entries first, including worker info
        $logs = \App\Models\AuditLog::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Reports/AuditTrails', [
            'logs' => $logs
        ]);
    }*/


    /**
     * Compile and display a unified regulatory tracking registry for controlled substances.
     * Route Sourced: GET /controlled-substances
     */
    /*public function getControlledSubstancesLedger(Request $request)
    {
        $search = $request->get('search');
        
        // Query sales item records where the parent product profile has is_controlled flagged true
        $query = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->leftJoin('patients', 'sales.patient_id', '=', 'patients.id')
            ->leftJoin('prescriptions', 'sales.prescription_id', '=', 'prescriptions.id')
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->where('products.is_controlled', true)
            ->select(
                'sales_items.id',
                'sales.invoice_number',
                'sales.created_at',
                'products.name as product_name',
                'products.generic_name',
                'batches.batch_number',
                'sales_items.quantity',
                'patients.name as patient_name',
                'patients.patient_number',
                'prescriptions.doctor_name',
                'prescriptions.prescription_number',
                'users.name as dispenser_name'
            );

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'ILIKE', "%{$search}%")
                  ->orWhere('patients.name', 'ILIKE', "%{$search}%")
                  ->orWhere('prescriptions.doctor_name', 'ILIKE', "%{$search}%");
            });
        }

        $logs = $query->orderBy('sales.created_at', 'desc')->paginate(15)->withQueryString();

        return \Inertia\Inertia::render('Reports/ControlledSubstancesLedger', [
            'ledgerData' => $logs,
            'filters'    => $request->only(['search'])
        ]);
    }

    /**
     * Stream an Excel-compatible CSV list audit report of controlled molecule dispensations.
     * Route Sourced: GET /api/reports/controlled/export
     *
    public function exportControlledSubstancesCsv(Request $request)
    {
        $search = $request->get('search');

        $query = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->leftJoin('patients', 'sales.patient_id', '=', 'patients.id')
            ->leftJoin('prescriptions', 'sales.prescription_id', '=', 'prescriptions.id')
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->where('products.is_controlled', true)
            ->select(
                'sales.invoice_number',
                'sales.created_at',
                'products.name as product_name',
                'batches.batch_number',
                'sales_items.quantity',
                'patients.name as patient_name',
                'patients.patient_number',
                'prescriptions.doctor_name',
                'prescriptions.prescription_number',
                'users.name as dispenser_name'
            );

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'ILIKE', "%{$search}%")
                  ->orWhere('patients.name', 'ILIKE', "%{$search}%");
            });
        }

        $data = $query->orderBy('sales.created_at', 'desc')->get();
        $fileName = 'controlled_substances_audit_report_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Invoice Number', 'Dispense Date', 'Controlled Drug Formulation', 'Batch Lot', 'Quantity Dispensed', 'Patient Name', 'Chart Number', 'Prescribing Doctor', 'Prescription Ref', 'Dispensing Pharmacist']);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->invoice_number,
                    $row->created_at,
                    $row->product_name,
                    $row->batch_number,
                    $row->quantity,
                    $row->patient_name ?? 'Anonymous Walk-In',
                    $row->patient_number ?? 'N/A',
                    $row->doctor_name ?? 'N/A',
                    $row->prescription_number ?? 'N/A',
                    $row->dispenser_name
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }*/


    
    /**
     * Compile and display a unified regulatory tracking registry for controlled substances.
     * Route Sourced: GET /controlled-substances
     */
    public function getControlledSubstancesLedger(Request $request)
    {
        $search = $request->get('search');
        
        $query = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->leftJoin('patients', 'sales.patient_id', '=', 'patients.id')
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->where('products.is_controlled', true)
            ->select(
                'sales_items.id',
                'sales.invoice_number',
                'sales.created_at',
                'sales.patient_id',
                'products.name as product_name',
                'products.generic_name',
                'batches.batch_number',
                'sales_items.quantity',
                'patients.name as patient_name',
                'patients.patient_number',
                'users.name as dispenser_name'
            );

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'ILIKE', "%{$search}%")
                  ->orWhere('patients.name', 'ILIKE', "%{$search}%");
            });
        }

        $logs = $query->orderBy('sales.created_at', 'desc')->paginate(15)->withQueryString();

        // Dynamically loop and pre-compile matching prescription records from the database
        $logs->through(function($row) {
            $prescription = null;
            if ($row->patient_id) {
                $prescription = DB::table('prescriptions')
                    ->where('patient_id', $row->patient_id)
                    ->orderBy('created_at', 'desc')
                    ->first();
            }

            return [
                'id'                  => $row->id,
                'invoice_number'      => $row->invoice_number,
                'created_at'          => $row->created_at,
                'product_name'        => $row->product_name,
                'generic_name'        => $row->generic_name,
                'batch_number'        => $row->batch_number,
                'quantity'            => $row->quantity,
                'patient_name'        => $row->patient_name ?? 'Anonymous Walk-In',
                'patient_number'      => $row->patient_number ?? 'N/A',
                'doctor_name'         => $prescription ? $prescription->doctor_name : 'Authorized OTC Ref',
                'prescription_number' => $prescription ? $prescription->prescription_number : 'N/A',
                'dispenser_name'      => $row->dispenser_name ?? 'System Loop Worker'
            ];
    });

        return \Inertia\Inertia::render('Reports/ControlledSubstancesLedger', [
            'ledgerData' => $logs,
            'filters'    => $request->only(['search'])
        ]);
    }

    /**
     * Stream an Excel-compatible CSV list audit report of controlled molecule dispensations.
     * Route Sourced: GET /api/reports/controlled/export
     */
    /*public function exportControlledSubstancesCsv(Request $request)
    {
        $search = $request->get('search');

        $query = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->leftJoin('patients', 'sales.patient_id', '=', 'patients.id')
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->where('products.is_controlled', true)
            ->select(
                'sales.invoice_number',
                'sales.created_at',
                'sales.patient_id',
                'products.name as product_name',
                'batches.batch_number',
                'sales_items.quantity',
                'patients.name as patient_name',
                'patients.patient_number',
                'users.name as dispenser_name'
            );

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'ILIKE', "%{$search}%")
                  ->orWhere('patients.name', 'ILIKE', "%{$search}%");
            });
        }

        $data = $query->orderBy('sales.created_at', 'desc')->get();
        $fileName = 'controlled_substances_audit_report_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Invoice Number', 'Dispense Date', 'Controlled Drug Formulation', 'Batch Lot', 'Quantity Dispensed', 'Patient Name', 'Chart Number', 'Prescribing Doctor', 'Prescription Ref', 'Dispensing Pharmacist']);

            foreach ($data as $row) {
                $prescription = null;
                if ($row->patient_id) {
                    $prescription = DB::table('prescriptions')
                        ->where('patient_id', $row->patient_id)
                        ->orderBy('created_at', 'desc')
                        ->first();
                }

                fputcsv($file, [
                    $row->invoice_number,
                    $row->created_at,
                    $row->product_name,
                    $row->batch_number,
                    $row->quantity,
                    $row->patient_name ?? 'Anonymous Walk-In',
                    $row->patient_number ?? 'N/A',
                    $prescription ? $prescription->doctor_name : 'Authorized OTC Ref',
                    $prescription ? $prescription->prescription_number : 'N/A',
                    $row->dispenser_name ?? 'System'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }*/
    
    /**
     * Stream an Excel-compatible CSV list audit report of controlled molecule dispensations.
     * Route Sourced: GET /api/reports/controlled/export
     */
    public function exportControlledSubstancesCsv(Request $request)
    {
        $search = $request->get('search');

        // STEP 3 SYSTEMATIC REGISTRY: PULL METADATA CONSTANTS FROM SEED ROW #1
        $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
        
        $companyName = $corporateBranding->company_name ?? 'PHARMACORE ECOSYSTEM';
        $companyPhone = $corporateBranding->phone_number ?? '+254 700 112233';

        $query = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->leftJoin('patients', 'sales.patient_id', '=', 'patients.id')
            ->leftJoin('users', 'sales.user_id', '=', 'users.id')
            ->where('products.is_controlled', true)
            ->select(
                'sales.invoice_number',
                'sales.created_at',
                'sales.patient_id',
                'products.name as product_name',
                'batches.batch_number',
                'sales_items.quantity',
                'patients.name as patient_name',
                'patients.patient_number',
                'users.name as dispenser_name'
            );

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('products.name', 'ILIKE', "%{$search}%")
                  ->orWhere('patients.name', 'ILIKE', "%{$search}%");
            });
        }

        $data = $query->orderBy('sales.created_at', 'desc')->get();
        $fileName = 'controlled_substances_audit_report_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($data, $companyName, $companyPhone) {
            $file = fopen('php://output', 'w');
            
            // PREPEND DYNAMIC REGULATORY COHESIVE AUDITING BANNER BLOCKS
            fputcsv($file, [strtoupper($companyName)]);
            fputcsv($file, ["STATUTORY CONTROLLED SUBSTANCES COMPLIANCE AUDIT DISPENSATION REGISTRY"]);
            fputcsv($file, ["REPORT GENERATED: " . now()->format('Y-m-d H:i:s') . " | SUPPORT: " . $companyPhone]);
            fputcsv($file, []); // Spacer row for Excel grid neatness
            
            // Baseline Matrix Columns
            fputcsv($file, ['Invoice Number', 'Dispense Date', 'Controlled Drug Formulation', 'Batch Lot', 'Quantity Dispensed', 'Patient Name', 'Chart Number', 'Prescribing Doctor', 'Prescription Ref', 'Dispensing Pharmacist']);

            foreach ($data as $row) {
                $prescription = null;
                if ($row->patient_id) {
                    $prescription = DB::table('prescriptions')
                        ->where('patient_id', $row->patient_id)
                        ->orderBy('created_at', 'desc')
                        ->first();
                }

                fputcsv($file, [
                    $row->invoice_number,
                    $row->created_at,
                    $row->product_name,
                    $row->batch_number,
                    $row->quantity,
                    $row->patient_name ?? 'Anonymous Walk-In',
                    $row->patient_number ?? 'N/A',
                    $prescription ? $prescription->doctor_name : 'Authorized OTC Ref',
                    $prescription ? $prescription->prescription_number : 'N/A',
                    $row->dispenser_name ?? 'System'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Compile and display active operational workspace system operator roles.
     * Route Sourced: GET /admin/users
     */
    public function getUserManagementConsole(Request $request)
    {
        // 1. Fetch system users excluding primary root reference seeds if needed
        $users = DB::table('users')
            ->select('id', 'name', 'email', 'role', 'created_at', DB::raw('COALESCE(email_verified_at IS NOT NULL, false) as is_active'))
            ->orderBy('id', 'asc')
            ->get();

        return \Inertia\Inertia::render('Admin/UserManagementConsole', [
            'operators' => $users
        ]);
    }

    /**
     * Provision and inject a fresh employee session account with strict RBAC rules.
     * Route Sourced: POST /api/admin/users/store
     */
    public function registerSystemOperatorUser(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'role'     => 'required|in:admin,pharmacist,cashier',
            'password' => 'required|string|min:8'
        ]);

        DB::table('users')->insert([
            'name'              => trim($validated['name']),
            'email'             => strtolower(trim($validated['email'])),
            'role'              => $validated['role'],
            'password'          => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'email_verified_at' => now(), // Auto-verify on registration to bypass smtp setup limits
            'created_at'        => now(),
            'updated_at'        => now()
        ]);

        return response()->json(['success' => true, 'message' => "Identity assigned: [{$validated['name']}] registered as {$validated['role']}."]);
    }

    /**
     * De-authorize or restore operator access keys instantaneously.
     * Route Sourced: POST /api/admin/users/{id}/toggle-status
     */
    public function toggleOperatorAccessStatus($id, Request $request)
    {
        if ((int)$id === (int)auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Self-Termination Lock: You cannot suspend your own session.'], 403);
        }

        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User account not located.'], 404);
        }

        $newStatus = $user->email_verified_at ? null : now();
        DB::table('users')->where('id', $id)->update(['email_verified_at' => $newStatus]);

        $msg = $newStatus ? "Operator account unlocked safely." : "Operator access revoked successfully.";
        return response()->json(['success' => true, 'message' => $msg]);
    }

        /**
     * Compute and compile machine and database infrastructure health telemetry data.
     * Route Sourced: GET /admin/system-health
     */
    public function getSystemHealthTelemetry(Request $request)
    {
        // 1. Gather Disk Utilization Allocation
        $freeDiskBytes = disk_free_space(base_path());
        $totalDiskBytes = disk_total_space(base_path());
        $usedDiskBytes = $totalDiskBytes - $freeDiskBytes;
        $diskUsagePercentage = $totalDiskBytes > 0 ? round(($usedDiskBytes / $totalDiskBytes) * 100, 1) : 0;

        // 2. Fetch Linux / WSL Memory Splits via /proc/meminfo
        $memoryMetrics = ['total' => 16.0, 'used' => 4.2, 'percentage' => 26.2];
        if (file_exists('/proc/meminfo')) {
            $meminfo = file_get_contents('/proc/meminfo');
            preg_match('/MemTotal:\s+(\d+)/', $meminfo, $matchesTotal);
            preg_match('/MemAvailable:\s+(\d+)/', $meminfo, $matchesAvail);
            if (!empty($matchesTotal) && !empty($matchesAvail)) {
                $totalKb = (int)$matchesTotal[1];
                $availKb = (int)$matchesAvail[1];
                $usedKb = $totalKb - $availKb;
                $memoryMetrics['total'] = round($totalKb / 1024 / 1024, 1); // GB
                $memoryMetrics['used'] = round($usedKb / 1024 / 1024, 1); // GB
                $memoryMetrics['percentage'] = round(($usedKb / $totalKb) * 100, 1);
            }
        }

        // 3. Extract Core Load Average
        $cpuLoad = function_exists('sys_getloadavg') ? sys_getloadavg() : [0.15, 0.22, 0.05];

        // 4. Collect PostgreSQL Background Process & Write-Ahead Logging (WAL) States
        $postgresVersion = DB::select("SHOW server_version;")[0]->server_version ?? 'Unknown';
        $walMode = DB::select("SHOW wal_level;")[0]->wal_level ?? 'Unknown';
        
        $activeConnectionsCount = DB::table('pg_stat_activity')->count();
        $runningSchedules = DB::table('pg_stat_activity')
            ->select('pid', 'query', 'state', 'query_start')
            ->where('state', 'active')
            ->where('query', 'NOT LIKE', '%pg_stat_activity%')
            ->take(5)
            ->get()
            ->map(function($row) {
                return [
                    'pid'        => $row->pid,
                    'query'      => substr($row->query, 0, 80) . '...',
                    'state'      => $row->state,
                    'runtime'    => $row->query_start ? \Carbon\Carbon::parse($row->query_start)->diffForHumans() : 'N/A'
                ];
            });

        return \Inertia\Inertia::render('Admin/SystemHealthConsole', [
            'telemetry' => [
                'disk' => [
                    'total'      => round($totalDiskBytes / 1024 / 1024 / 1024, 1), // GB
                    'used'       => round($usedDiskBytes / 1024 / 1024 / 1024, 1), // GB
                    'percentage' => $diskUsagePercentage
                ],
                'memory'           => $memoryMetrics,
                'cpu_load_1min'    => $cpuLoad[0],
                'js_runtime'       => 'Vite Configured (Node v20+)',
                'postgres_version' => $postgresVersion,
                'wal_level_mode'   => strtoupper($walMode),
                'db_connections'   => $activeConnectionsCount,
                'active_queries'   => $runningSchedules
            ]
        ]);
    }


        /**
     * Compile and display historical database snapshot records logs.
     * Route Sourced: GET /admin/backups
     */
    public function getBackupConsoleIndex(Request $request)
    {
        $backups = DB::table('database_backups')
            ->leftJoin('users', 'database_backups.user_id', '=', 'users.id')
            ->select('database_backups.*', 'users.name as operator_name')
            ->orderBy('database_backups.created_at', 'desc')
            ->get();

        return \Inertia\Inertia::render('Admin/BackupRecoveryConsole', [
            'backupHistory' => $backups
        ]);
    }

    /**
     * Execute a native PostgreSQL pg_dump hot-backup layer on the filesystem.
     * Route Sourced: POST /api/admin/backups/trigger
     */
    public function triggerInstantDatabaseBackup(Request $request)
    {
        try {
            $timestamp = now()->format('Ymd_His');
            $filename = "pharmacy_db_snapshot_{$timestamp}.sql";
            
            // Establish target retention directory within storage paths
            $storageDir = storage_path('app/backups');
            if (!file_exists($storageDir)) {
                mkdir($storageDir, 0755, true);
            }

            $outputPath = "{$storageDir}/{$filename}";
            
            // Cross-reference active database configuration environment values
            $dbConfig = config('database.connections.pgsql');
            
            // Construct shell dump command execution stream string
            $command = sprintf(
                'PGPASSWORD="%s" pg_dump -h "%s" -p "%s" -U "%s" -d "%s" -F c -b -v -f "%s"',
                $dbConfig['password'],
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['username'],
                $dbConfig['database'],
                $outputPath
            );

            // Execute the system dump process array pipeline natively
            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar !== 0) {
                throw new \Exception("pg_dump process failure binary status code: " . implode("\n", $output));
            }

            $fileSizeRaw = file_exists($outputPath) ? filesize($outputPath) : 0;
            $fileSizeFormatted = round($fileSizeRaw / 1024 / 1024, 2) . " MB";

            // Persist structural trace in database table registry logs
            DB::table('database_backups')->insert([
                'filename'   => $filename,
                'disk_path'  => $outputPath,
                'file_size'  => $fileSizeFormatted,
                'user_id'    => auth()->id() ?? 1,
                'status'     => 'SUCCESS',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json(['success' => true, 'message' => "Hot snapshot [{$filename}] compiled successfully."]);

        } catch (\Exception $e) {
            // Track failure footprints for safety accountability
            DB::table('database_backups')->insert([
                'filename'   => "FAILED_SNAPSHOT_" . now()->format('Ymd_His') . ".txt",
                'disk_path'  => 'NONE',
                'file_size'  => '0.00 MB',
                'user_id'    => auth()->id() ?? 1,
                'status'     => 'FAILED',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json(['success' => false, 'message' => "Backup execution rejected: " . $e->getMessage()], 500);
        }
    }

    /**
     * Download a physical archived backup dump sheet layer out of disk vaults.
     * Route Sourced: GET /admin/backups/{id}/download
     */
    public function downloadBackupBinarySnapshot($id)
    {
        $backup = DB::table('database_backups')->where('id', $id)->first();
        
        if (!$backup || !file_exists($backup->disk_path)) {
            abort(404, "The physical snapshot file asset has expired or been purged from disk layers.");
        }

        return response()->download($backup->disk_path);
    }

        /**
     * Pull persistent corporate layout metadata configurations.
     * Route Sourced: GET /admin/settings
     */
    public function getSystemSettingsConsoleIndex(Request $request)
    {
        $settings = DB::table('system_settings')->orderBy('id', 'asc')->first();

        return \Inertia\Inertia::render('Admin/CorporateSettingsConsole', [
            'currentSettings' => $settings
        ]);
    }

    /**
     * Atomically overwrite persistent corporate details and branding properties inside memory caches.
     * Route Sourced: POST /api/admin/settings/update
     */
    /*public function updateSystemConfigurationSettings(Request $request)
    {
        $validated = $request->validate([
            'company_name'        => 'required|string|max:255',
            'company_email'       => 'required|email|max:255',
            'phone_number'        => 'required|string|max:100',
            'address'             => 'required|string',
            'currency_code'       => 'required|string|max:10',
            'receipt_footer_text' => 'required|string|max:255',
            'primary_color_hex'   => 'required|string|max:7'
        ]);

        // Keep updates tied to the single baseline reference seed row configuration layer
        DB::table('system_settings')->where('id', 1)->update([
            'company_name'        => trim($validated['company_name']),
            'company_email'       => strtolower(trim($validated['company_email'])),
            'phone_number'        => trim($validated['phone_number']),
            'address'             => trim($validated['address']),
            'currency_code'       => strtoupper(trim($validated['currency_code'])),
            'receipt_footer_text' => trim($validated['receipt_footer_text']),
            'primary_color_hex'   => trim($validated['primary_color_hex']),
            'updated_at'          => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Corporate branding and profile matrix re-cached successfully.']);
    }*/

    public function updateSystemConfigurationSettings(Request $request)
    {
    $validated = $request->validate([
        'company_name'        => 'required|string|max:255',
        'company_email'       => 'required|email|max:255',
        'phone_number'        => 'required|string|max:100',
        'address'             => 'required|string',
        'currency_code'       => 'required|string|max:10',
        'receipt_footer_text' => 'required|string|max:255',
        'primary_color_hex'   => 'required|string|max:7',
        'logo_file'           => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048' // Safe boundary locks
    ]);

    // Pull current seed baseline record
    $settings = DB::table('system_settings')->where('id', 1)->first();
    $logoPath = $settings->logo_path ?? null;

    // Process file upload if a fresh item layer exists in payload parameters
    if ($request->hasFile('logo_file')) {
        // If an old asset exists on disk layers, purge it cleanly to optimize space
        if ($logoPath && \Illuminate\Support\Facades\Storage::disk('public')->exists($logoPath)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($logoPath);
        }

        $file = $request->file('logo_file');
        // Persist file in app/storage/public/branding directory channel
        $logoPath = $file->store('branding', 'public');
    }

    // Atomically commit parameters to Postgres row data layout
    DB::table('system_settings')->where('id', 1)->update([
        'company_name'        => trim($validated['company_name']),
        'company_email'       => strtolower(trim($validated['company_email'])),
        'phone_number'        => trim($validated['phone_number']),
        'address'             => trim($validated['address']),
        'currency_code'       => strtoupper(trim($validated['currency_code'])),
        'receipt_footer_text' => trim($validated['receipt_footer_text']),
        'primary_color_hex'   => trim($validated['primary_color_hex']),
        'logo_path'           => $logoPath, // Persist path tracking vector string
        'updated_at'          => now()
    ]);

    return response()->json(['success' => true, 'message' => 'Corporate branding profile matrix and logo re-cached successfully.']);
    }


    /**
     * Compile and display a comprehensive process tree of all active database session connections.
     * Route Sourced: GET /admin/process-killer
     */
    public function getDatabaseSessionKillerIndex(Request $request)
    {
        // Pull full connection matrices directly from PostgreSQL internal engine telemetry tables
        $sessions = DB::table('pg_stat_activity')
            ->select('pid', 'usename as db_user', 'client_addr as ip_address', 'application_name', 'backend_start', 'query_start', 'state', 'query')
            ->where('query', 'NOT LIKE', '%pg_stat_activity%') // Isolate system monitors out of lookups
            ->orderBy('query_start', 'asc')
            ->get()
            ->map(function($row) {
                return [
                    'pid'              => $row->pid,
                    'db_user'          => $row->db_user ?? 'system',
                    'ip_address'       => $row->ip_address ?? '127.0.0.1',
                    'application'      => $row->application_name ?: 'Laravel Core Pool',
                    'connection_time'  => $row->backend_start ? \Carbon\Carbon::parse($row->backend_start)->diffForHumans() : 'N/A',
                    'query_runtime'    => $row->query_start ? \Carbon\Carbon::parse($row->query_start)->diffForHumans() : 'Idle Connection',
                    'state'            => $row->state ?? 'disabled',
                    'query_string'     => $row->query ?: 'No active transaction'
                ];
        });

        return \Inertia\Inertia::render('Admin/DatabaseSessionOverlord', [
            'activeSessions' => $sessions
        ]);
    }

    /**
     * Terminate a specific backend connection thread immediately via process identity keys.
     * Route Sourced: POST /api/admin/process-killer/{pid}/terminate
     */
    public function terminateActiveDatabaseSession($pid, Request $request)
    {
        // Restrict execution from targeting the primary system loop connection thread
        $currentBackendPid = DB::select("SELECT pg_backend_pid();")[0]->pg_backend_pid ?? 0;
        
        if ((int)$pid === (int)$currentBackendPid) {
            return response()->json(['success' => false, 'message' => 'Self-Termination Block: You cannot kill your own active transaction handler thread.'], 403);
        }

        // Execute native PostgreSQL query backend termination script tool
        $terminated = DB::select("SELECT pg_terminate_backend(?);", [$pid]);
        $success = $terminated[0]->pg_terminate_backend ?? false;

        if ($success) {
            return response()->json(['success' => true, 'message' => "Session Thread [PID #{$pid}] severed successfully from transaction blocks."]);
        }

        return response()->json(['success' => false, 'message' => 'Process rejection: The database session could not be reached or has already resolved.'], 400);
    }

        /**
     * Synthesize complex business intelligence analytics, projections, and seasonal trends.
     * Route Sourced: GET /admin/executive-analytics
     */
    public function getExecutiveAnalyticsDashboard(Request $request)
    {
        // 1. Gather historical baseline performance parameters (Last 30 Days vs Prior 30 Days)
        $now = \Carbon\Carbon::now();
        $thirtyDaysAgo = \Carbon\Carbon::now()->subDays(30);
        $sixtyDaysAgo = \Carbon\Carbon::now()->subDays(60);

        $currentPeriodRevenue = DB::table('sales')
            ->whereBetween('created_at', [$thirtyDaysAgo->startOfDay(), $now->endOfDay()])
            ->sum('total_amount') ?? 0.00;

        $priorPeriodRevenue = DB::table('sales')
            ->whereBetween('created_at', [$sixtyDaysAgo->startOfDay(), $thirtyDaysAgo->endOfDay()])
            ->sum('total_amount') ?? 0.00;

        // Calculate run-rate velocity shift multiplier
        $revenueGrowthDelta = $priorPeriodRevenue > 0 ? (($currentPeriodRevenue - $priorPeriodRevenue) / $priorPeriodRevenue) * 100 : 0.00;

        // 2. LINEAR REVENUE PROJECTIONS ENGINE (Next 30 Days forecast based on average daily run-rate velocity)
        $distinctDaysCount = DB::table('sales')
            ->whereBetween('created_at', [$thirtyDaysAgo->startOfDay(), $now->endOfDay()])
            ->selectRaw('COUNT(DISTINCT DATE(created_at)) as days')
            ->first()->days ?? 30;

        $dailyRunRateAverage = $distinctDaysCount > 0 ? ($currentPeriodRevenue / $distinctDaysCount) : 0.00;
        // Project forward adjusting for growth delta parameters slightly as confidence weights
        $projectedNext30DaysRevenue = $dailyRunRateAverage * 30 * (1 + ($revenueGrowthDelta / 200));

        // 3. SEASONAL MOLECULE INVENTORY DEMAND CURVE (Grouped by generic formulation popularity spikes)
        $seasonalInventoryCurves = DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->whereBetween('sales.created_at', [\Carbon\Carbon::now()->subMonths(6)->startOfDay(), $now->endOfDay()])
            ->select(
                'products.name as product_name',
                'products.generic_name',
                DB::raw('SUM(sales_items.quantity) as total_volume_sold'),
                DB::raw('COUNT(DISTINCT sales.id) as prescription_frequency_count')
            )
            ->groupBy('products.id', 'products.name', 'products.generic_name')
            ->orderByDesc('total_volume_sold')
            ->take(5)
            ->get();

        // 4. CHRONOLOGICAL CHART TRAIL MATRIX METRICS (Daily Performance array blocks)
        $chartTrailArray = [];
        for ($i = 14; $i >= 0; $i--) {
            $targetDate = \Carbon\Carbon::now()->subDays($i)->format('Y-m-d');
            $displayLabel = \Carbon\Carbon::now()->subDays($i)->format('d M');

            $dayRevenue = DB::table('sales')->whereDate('created_at', $targetDate)->sum('total_amount') ?? 0.00;
            $dayTransactionCount = DB::table('sales')->whereDate('created_at', $targetDate)->count();

            $chartTrailArray[] = [
                'label'       => $displayLabel,
                'revenue'     => (float)$dayRevenue,
                'transactions'=> (int)$dayTransactionCount
            ];
        }

        return \Inertia\Inertia::render('Admin/ExecutiveAnalyticsDashboard', [
            'biMetrics' => [
                'current_revenue'      => (float)$currentPeriodRevenue,
                'prior_revenue'        => (float)$priorPeriodRevenue,
                'growth_percentage'    => (float)round($revenueGrowthDelta, 2),
                'projected_revenue'    => (float)round($projectedNext30DaysRevenue, 2),
                'daily_average_velocity'=> (float)round($dailyRunRateAverage, 2),
                'seasonal_curves'      => $seasonalInventoryCurves,
                'chronological_trail'  => $chartTrailArray
            ]
        ]);
    }

        /**
     * Compile and display an itemised ledger chronologies of all operational overhead expenses.
     * Route Sourced: GET /admin/expenses
     */
    public function getExpenseRegistryConsoleIndex(Request $request)
    {
        // Pull full categorical expenditures sorted by modern calendar logs first
        $expenses = DB::table('expenses')
            ->orderBy('date_incurred', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Calculate sum aggregates to fill informational metric banner panels
        $totalOverheadsAccumulated = DB::table('expenses')->sum('amount') ?? 0.00;

        return \Inertia\Inertia::render('Admin/ExpenseRegistryConsole', [
            'expenseLedger'   => $expenses,
            'totalOverheads' => (float)$totalOverheadsAccumulated
        ]);
    }

    /**
     * Log and commit a structural corporate operational outlay cost record.
     * Route Sourced: POST /api/admin/expenses/store
     */
    public function storeNewOperationalExpenseRow(Request $request)
    {
        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'category'      => 'required|in:Rent,Utilities,Salaries,Logistics,Licensing,Disposal,Other',
            'amount'        => 'required|numeric|min:0.01',
            'date_incurred' => 'required|date|before_or_equal:today',
            'description'   => 'nullable|string'
        ]);

        DB::table('expenses')->insert([
            'title'         => trim($validated['title']),
            'category'      => $validated['category'],
            'amount'        => $validated['amount'],
            'date_incurred' => $validated['date_incurred'],
            'description'   => trim($validated['description']),
            'created_at'    => now(),
            'updated_at'    => now()
        ]);

        // Track automated operation footprint in security audit registers
        DB::table('activity_logs')->insert([
            'user_id'      => auth()->id() ?? 1,
            'event_type'   => 'FINANCIAL_EXPENSE_CREATED',
            'target_table' => 'expenses',
            'target_id'    => DB::getPdo()->lastInsertId() ?? 1,
            'description'  => "Logged operational overhead expense [{$validated['title']}] under category {$validated['category']} totaling KES " . number_format($validated['amount'], 2) . ".",
            'ip_address'   => $request->ip() ?? '127.0.0.1',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Operational cash outlay logged cleanly.']);
    }

        /**
     * Compute and group upcoming batch shelf-life expirations into risk vectors.
     * Route Sourced: GET /admin/expiry-alerts
     */
    public function getBatchExpiryProactiveConsoleIndex(Request $request)
    {
        $now = now();
        $ninetyDaysAhead = now()->addDays(90);

        // Fetch active batch rows breaching the 90-day threshold window
        $batches = DB::table('batches')
            ->join('products', 'products.id', '=', 'batches.product_id')
            ->leftJoin('suppliers', 'suppliers.id', '=', 'batches.supplier_id') // Cross-reference origin source vendors if available
            ->where('batches.quantity_remaining', '>', 0)
            ->whereBetween('batches.expiry_date', [$now->copy()->subYears(5), $ninetyDaysAhead]) // Capture already expired + up to 90 days ahead
            ->select(
                'batches.id',
                'batches.batch_number',
                'batches.quantity_remaining as stock_qty',
                'batches.expiry_date',
                'products.name as product_name',
                'products.generic_name',
                'products.sku',
                'suppliers.name as supplier_name',
                DB::raw("EXTRACT(DAY FROM AGE(batches.expiry_date, NOW())) as days_remaining")
            )
            ->orderBy('batches.expiry_date', 'asc')
            ->get();

        // Compute summary totals to fill executive metric visualization rings
        $summaryMetrics = [
            'critical_30' => $batches->filter(fn($b) => $b->days_remaining <= 30)->count(),
            'high_60'     => $batches->filter(fn($b) => $b->days_remaining > 30 && $b->days_remaining <= 60)->count(),
            'watch_90'    => $batches->filter(fn($b) => $b->days_remaining > 60 && $b->days_remaining <= 90)->count(),
            'total_risk'  => $batches->count()
        ];

        return \Inertia\Inertia::render('Admin/BatchExpiryConsole', [
            'expiryBatches'  => $batches,
            'summaryMetrics' => $summaryMetrics
        ]);
    }

        /**
     * Commit changed white-label corporate corporate layouts and hex values.
     * Route Sourced: POST /api/admin/settings/update
     */
    /*public function updateSystemConfigurationSettings(Request $request)
    {
        $validated = $request->validate([
            'company_name'  => 'required|string|max:255',
            'company_phone' => 'required|string|max:50',
            'company_email' => 'required|email|max:255',
            'company_tin'   => 'nullable|string|max:50',
            'brand_color'   => 'required|string|regex:/^#[a-fA-F0-9]{6}$/', // Strict CSS HEX code format validation
            'brand_font'    => 'required|in:font-sans,font-serif,font-mono'
        ]);

        foreach ($validated as $key => $value) {
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => $key],
                [
                    'setting_value' => trim($value),
                    'updated_at'    => now()
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'White-label layout adjustments committed to storage caches.']);
    }*/


/**
 * Execute system database optimization routines safely.
 * Route Sourced: POST /api/admin/maintenance/optimize
 */
public function runDatabaseMaintenanceRoutine(Request $request)
{
    // Block non-administrators from accessing raw query commands
    if (auth()->user()->role !== 'admin') {
        abort(403, 'Unauthorized System Operation.');
    }

    $request->validate([
        'task_type' => 'required|in:vacuum,reindex,clear_cache'
    ]);

    try {
        switch ($request->task_type) {
            case 'vacuum':
                // Reclaims storage space from deleted/updated data remnants
                DB::statement('VACUUM ANALYZE;');
                $message = "Database optimization complete: Storage remnants purged and index statistics updated successfully.";
                break;

            case 'reindex':
                // Rebuilds indices to maximize search speeds
                DB::statement('REINDEX DATABASE ' . config('database.connections.pgsql.database') . ';');
                $message = "Index rebuild complete: Database indices re-mapped for high-speed lookups.";
                break;

            case 'clear_cache':
                // Clears out temporary application cache records
                \Illuminate\Support\Facades\Artisan::call('cache:clear');
                \Illuminate\Support\Facades\Artisan::call('view:clear');
                $message = "Application telemetry cache flushed successfully.";
                break;
        }

        // Log the maintenance footprint inside your audit trails
        DB::table('activity_logs')->insert([
            'user_id'      => auth()->id(),
            'event_type'   => 'SYSTEM_MAINTENANCE_EXECUTED',
            'target_table' => 'kernel',
            'target_id'    => 1,
            'description'  => "Administrator initiated structural maintenance optimization task [{$request->task_type}] on the database engine.",
            'ip_address'   => $request->ip() ?? '127.0.0.1',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true, 'message' => $message]);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => 'Maintenance Rejected: ' . $e->getMessage()], 500);
    }
}


/**
     * Render the system infrastructure maintenance window console.
     * Route Sourced: GET /admin/maintenance
     */
    public function getMaintenanceConsoleIndex(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized System Operation.');
        }

        return \Inertia\Inertia::render('Admin/MaintenanceConsole');
    }


    
    /**
     * Render the terminal whitelisting console interface page.
     * Route Sourced: GET /admin/terminal-security
     */
    public function getTerminalSecurityConsoleIndex(Request $request)
    {
        $allowedTerminals = DB::table('ip_whitelists')->orderBy('id', 'asc')->get();
        return \Inertia\Inertia::render('Admin/TerminalSecurityConsole', [
            'terminals' => $allowedTerminals,
            'current_device_ip' => $request->ip() // Helpful helper tip for administrators
        ]);
    }

    /**
     * Catalog a fresh terminal workspace IP address block rule inside the database registry.
     * Route Sourced: POST /api/admin/terminal-security/store
     */
    public function authorizeNewTerminalIp(Request $request)
    {
        $validated = $request->validate([
            'terminal_name' => 'required|string|max:255',
            'ip_address'    => 'required|string|unique:ip_whitelists,ip_address',
            'admin_notes'   => 'nullable|string'
        ]);

        DB::table('ip_whitelists')->insert([
            'terminal_name' => trim($validated['terminal_name']),
            'ip_address'    => trim($validated['ip_address']),
            'admin_notes'   => trim($validated['admin_notes']),
            'created_at'    => now(),
            'updated_at'    => now()
        ]);

        return response()->json(['success' => true, 'message' => "White-label authentication lock appended: Terminal authorized successfully."]);
    }

    
/**
 * Toggle the active permission status state of an authorized station node.
 * Route Sourced: POST /api/admin/terminal-security/{id}/toggle
 */
public function toggleTerminalAuthorizationStatus($id)
{
    if (auth()->user()->role !== 'admin') {
        abort(403, 'Unauthorized Operation.');
    }

    $terminal = DB::table('ip_whitelists')->where('id', $id)->first();
    if (!$terminal) {
        return response()->json(['success' => false, 'message' => 'Terminal rule parameters missing.'], 404);
    }

    $newStatus = !$terminal->is_active;
    DB::table('ip_whitelists')->where('id', $id)->update([
        'is_active'  => $newStatus,
        'updated_at' => now()
    ]);

    // Log the configuration override inside your security audit log registries
    DB::table('activity_logs')->insert([
        'user_id'      => auth()->id(),
        'event_type'   => 'SECURITY_RULE_MUTATED',
        'target_table' => 'ip_whitelists',
        'target_id'    => $id,
        'description'  => "Administrator adjusted station [{$terminal->terminal_name}] whitelist rule status visibility to " . ($newStatus ? 'ACTIVE' : 'SUSPENDED') . ".",
        'ip_address'   => request()->ip() ?? '127.0.0.1',
        'created_at'   => now(),
        'updated_at'   => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Station authorization perimeter rule mutated successfully.']);
}

/**
 * Remove an authoritative IP whitelisting boundary constraint from the database.
 * Route Sourced: DELETE /api/admin/terminal-security/{id}/purge
 */
public function revokeTerminalAuthorizationLock($id)
{
    if (auth()->user()->role !== 'admin') {
        abort(403, 'Unauthorized Operation.');
    }

    $terminal = DB::table('ip_whitelists')->where('id', $id)->first();
    if (!$terminal) {
        return response()->json(['success' => false, 'message' => 'Terminal rule records not found.'], 404);
    }

    DB::table('ip_whitelists')->where('id', $id)->delete();

    DB::table('activity_logs')->insert([
        'user_id'      => auth()->id(),
        'event_type'   => 'SECURITY_RULE_PURGED',
        'target_table' => 'ip_whitelists',
        'target_id'    => $id,
        'description'  => "Permanently purged hardware terminal station rule validation bounds for [{$terminal->terminal_name}] from system registries.",
        'ip_address'   => request()->ip() ?? '127.0.0.1',
        'created_at'   => now(),
        'updated_at'   => now(),
    ]);

    return response()->json(['success' => true, 'message' => 'Terminal authorization parameters revoked and cleared from registry.']);
}


    /**
     * Overwrite an active operator's profile details and password properties.
     * Route Sourced: POST /api/admin/users/update
     */
    public function updateSystemOperatorUser(Request $request)
    {
        // Enforce strict administrator authorization guard limits
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized Operation Clearance Level.');
        }

        $validated = $request->validate([
            'id'       => 'required|integer|exists:users,id',
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $request->id,
            'role'     => 'required|in:admin,pharmacist,cashier',
            'password' => 'nullable|string|min:8' // Password remains optional during normal profile corrections
        ]);

        $updatePayload = [
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'role' => $validated['role'],
            'updated_at' => now()
        ];

        // If a fresh string sequence is typed inside the credential box, re-hash it cleanly
        if (!empty($validated['password'])) {
            $updatePayload['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }

        \Illuminate\Support\Facades\DB::table('users')
            ->where('id', $validated['id'])
            ->update($updatePayload);

        return response()->json([
            'success' => true,
            'message' => "Identity baseline changes committed safely for operational node [{$validated['name']}]."
        ]);
    }

    /**
 * Extract filtered system audit trails with user relationships for the UI layout.
 * Route Sourced: GET /admin/audit-logs
 */
public function getAuditLogs(Request $request)
{
    $search = $request->get('search');
    $eventType = $request->get('event_type');

    // Build standard base filtering pipeline mapping your frontend properties
    $query = DB::table('activity_logs')
        ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
        ->select(
            'activity_logs.*',
            'users.name as operator_name'
        );

    if (!empty($search)) {
        $query->where('activity_logs.description', 'ILIKE', "%{$search}%");
    }

    if (!empty($eventType)) {
        $query->where('activity_logs.event_type', $eventType);
    }

    // Pull unique event classifications to hydrate the filter dropdown dynamically
    $distinctTypes = DB::table('activity_logs')
        ->distinct()
        ->whereNotNull('event_type')
        ->pluck('event_type');

    $logs = $query->orderBy('activity_logs.created_at', 'desc')->paginate(15)->withQueryString();

    return Inertia::render('Reports/AuditTrails', [
        'logsData'      => $logs,
        'distinctTypes' => $distinctTypes,
        'filters'       => $request->only(['search', 'event_type'])
    ]);
}

/**
 * Route Sourced: GET /api/reports/audit-logs/export
 */
public function exportAuditLogs(Request $request)
{
    $format = $request->get('format', 'excel');
    $search = $request->get('search');
    $eventType = $request->get('event_type');

    $query = DB::table('activity_logs')
        ->leftJoin('users', 'activity_logs.user_id', '=', 'users.id')
        ->select('activity_logs.*', 'users.name as operator_name');

    if (!empty($search)) {
        $query->where('activity_logs.description', 'ILIKE', "%{$search}%");
    }
    if (!empty($eventType)) {
        $query->where('activity_logs.event_type', $eventType);
    }

    $data = $query->orderBy('activity_logs.created_at', 'desc')->get();
    
    // Pull corporate layout details
    $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
    $companyName = $corporateBranding->company_name ?? 'ORVELLA PHARMACY';
    $companyPhone = $corporateBranding->phone_number ?? '+254 700 123456';
    $companyAddress = $corporateBranding->address ?? 'Bungoma Town CBD';
    $companyEmail = $corporateBranding->company_email ?? 'chemists@orvella.com';

    // BRANCH A: Clean, browser-printable window layout for PDF conversion
    if ($format === 'pdf') {
        return view('exports.audit_logs_pdf', compact('data', 'corporateBranding'));
    }

    // BRANCH B: High-Velocity Excel/CSV stream mapping the explicit table schema layout
    $fileName = 'security_audit_trails_' . now()->format('Ymd_His') . '.csv';
    $headers = [
        "Content-type"        => "text/csv",
        "Content-Disposition" => "attachment; filename=$fileName",
        "Pragma"              => "no-cache",
        "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
        "Expires"             => "0"
    ];

    $callback = function() use ($data, $companyName, $companyAddress, $companyPhone, $companyEmail) {
        $file = fopen('php://output', 'w');
        
        // PREPEND CORPORATE LAYOUT SETTINGS INFORMATION BLOCK Header
        fputcsv($file, [strtoupper($companyName)]);
        fputcsv($file, ["Location: " . $companyAddress . " | Tel: " . $companyPhone . " | Email: " . $companyEmail]);
        fputcsv($file, ["REGULATORY SECURITY & SYSTEM OPERATIONS AUDIT TRAIL LOGS"]);
        fputcsv($file, ["Exported on: " . now()->toFormattedDateString() . " " . now()->format('H:i:s')]);
        fputcsv($file, []); // Spacer row for visual neatness

        // Primary Grid Columns
        fputcsv($file, ['Timestamp', 'Event Class Key', 'Action Trace Statement', 'Executed By', 'Terminal IP Address']);

        foreach ($data as $row) {
            fputcsv($file, [
                Carbon::parse($row->created_at)->toIso8601String(),
                $row->event_type,
                $row->description,
                $row->operator_name ?? 'System Process',
                $row->ip_address ?? '127.0.0.1'
            ]);
        }
        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}



}