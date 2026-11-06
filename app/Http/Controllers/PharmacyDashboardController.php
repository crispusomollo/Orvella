<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Batch;
use App\Models\Sale;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

use Illuminate\Support\Facades\Schema;

class PharmacyDashboardController extends Controller
{
    public function index()
    {
        // 1. Core Expiry Alerts (90 Days)
        $expiryAlerts = Batch::with('product')
            ->where('quantity_remaining', '>', 0)
            ->where('expiry_date', '<=', now()->addDays(90))
            ->orderBy('expiry_date', 'asc')
            ->get();

        // 2. Core Reorder Level Alerts
        $reorderAlerts = Product::select('products.*')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'total_stock')
            ->get()
            ->filter(fn($p) => $p->total_stock <= $p->reorder_level)
            ->values();

        // 3. Shift KPI Summary Metrics (Tracking an absolute sliding 24-hour window)
        $startOfToday = now()->startOfDay();
        $endOfToday = now()->endOfDay();

        $todaySales = Sale::whereBetween('created_at', [$startOfToday, $endOfToday])->get();
        $totalInvoicesCount = $todaySales->count();
        $grossShiftRevenue = $todaySales->sum('total_amount');
        
        $controlledDispensesCount = DB::table('sales_items')
            ->join('products', 'products.id', '=', 'sales_items.product_id')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->whereBetween('sales.created_at', [$startOfToday, $endOfToday])
            ->where('products.requires_prescription', true)
            ->sum('sales_items.quantity') ?? 0;

        // 4. GENERAL SALES LOGS vs CONTROLLED COMPLIANCE LOGS
        $recentGeneralSales = Sale::with('patient')
            ->whereBetween('created_at', [$startOfToday, $endOfToday])
            ->latest()
            ->take(5)
            ->get();

        $recentControlledSales = Sale::whereHas('items.product', function($q) {
                $q->where('requires_prescription', true);
            })
            ->with(['patient'])
            ->whereBetween('created_at', [$startOfToday, $endOfToday])
            ->latest()
            ->take(5)
            ->get();

        
        // 5. Real-time 7-Day Rolling Financial Performance Stream (Accounting for Discounts)
    $financialTrend = collect(range(6, 0))->map(function ($daysAgo) {
    $date = Carbon::today()->subDays($daysAgo);
    $dateString = $date->format('Y-m-d');
    $label = $date->format('D'); 

    // Extract both total volume and aggregate discounts issued on that day
    $salesDayRecord = DB::table('sales')
        ->whereDate('created_at', $dateString)
        ->selectRaw('SUM(subtotal_amount) as gross_sub, SUM(discount) as total_disc, SUM(total_amount) as net_collected')
        ->first();

    $netCollectedRevenue = (float)($salesDayRecord->net_collected ?? 0);

    // Live Operating Expenses Sum
    $expensesAmount = Schema::hasTable('expenses') 
        ? (DB::table('expenses')->whereDate('created_at', $dateString)->sum('amount') ?? 0)
        : 0;

    // Accurate Cost of Goods Sold (COGS) extracted dynamically from batch buy prices
    $cogs = DB::table('sales_items')
        ->join('batches', 'sales_items.batch_id', '=', 'batches.id')
        ->whereDate('sales_items.created_at', $dateString)
        ->selectRaw('SUM(sales_items.quantity * batches.cost_price) as total_cogs')
        ->value('total_cogs') ?? 0;

    // Net Profit Margin = Net Collected Revenue - (Product Lot Baseline Costs + Overheads)
    $netProfit = $netCollectedRevenue - ((float)$cogs + (float)$expensesAmount);

    return [
        'period' => $label,
        'sales' => $netCollectedRevenue, // Uses true net revenue cash flows
        'expenses' => (float)$expensesAmount,
        'profit' => (float)$netProfit,
    ];
    })->values()->toArray();

        // 6. DYNAMIC: Product Dispensing Volumes Query (Velocity Tracking)
        $dispensingVolumes = DB::table('sales_items')
            ->join('products', 'sales_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(sales_items.quantity) as total_qty'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'name' => strlen($item->name) > 12 ? substr($item->name, 0, 12) . '...' : $item->name,
                'qty' => (int)$item->total_qty
            ])->toArray();

        // Fallback placeholder data if database transactions are completely empty
        if (empty($dispensingVolumes)) {
            $dispensingVolumes = [
                ['name' => 'No Sales Yet', 'qty' => 0]
            ];
        }

        return Inertia::render('Dashboard', [
            'expiryAlerts' => $expiryAlerts,
            'reorderAlerts' => $reorderAlerts,
            'financialTrend' => $financialTrend,
            'dispensingVolumes' => $dispensingVolumes, // NEW REAL DATA VARIABLE
            'kpis' => [
                'invoice_count' => $totalInvoicesCount,
                'gross_revenue' => number_format($grossShiftRevenue, 2),
                'avg_ticket' => $totalInvoicesCount > 0 ? number_format($grossShiftRevenue / $totalInvoicesCount, 2) : '0.00',
                'controlled_count' => (int)$controlledDispensesCount
            ],
            'recentGeneralSales' => $recentGeneralSales, 
            'recentControlledSales' => $recentControlledSales
        ]);
    }

        /**
     * Compile and display a unified workspace of items breaching safety thresholds.
     * Route Sourced: GET /low-stock-reorder
     */
    public function showLowStockReorderConsole(Request $request)
    {
        // 1. Fetch active products with current dynamic shelf stock sums
        $lowStockProducts = \App\Models\Product::select('id', 'name', 'sku', 'generic_name', 'reorder_level')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('expiry_date', '>', now());
            }, 'stock')
            ->get()
            // 2. Filter collection via server-side constraint checks
            ->filter(function($p) {
                return (int)$p->stock <= (int)$p->reorder_level;
            })
            ->values();

        // 3. Eager load wholesale distributors linked to these items for reordering drop-downs
        $suppliers = \App\Models\Supplier::select('id', 'name')->get();

        return \Inertia\Inertia::render('Stock/LowStockReorderConsole', [
            'lowStockItems' => $lowStockProducts,
            'suppliers'     => $suppliers
        ]);
    }

        /**
     * Provide low-stock and expiry counters to populate template badges dynamically.
     * Route Sourced: GET /api/alert-counters
     */
    public function getAlertCounters()
    {
        try {
            // 1. Count items below safety reorder limits
            $lowStockCount = \App\Models\Product::select('id', 'reorder_level')
                ->selectSub(function ($query) {
                    $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                        ->from('batches')
                        ->whereColumn('batches.product_id', 'products.id')
                        ->where('expiry_date', '>', now());
                }, 'stock')
                ->get()
                ->filter(function($p) {
                    return (int)$p->stock <= (int)$p->reorder_level;
                })
                ->count();

            // 2. Count lots that have officially breached their calendar shelf dates
            $expiredLotsCount = \App\Models\Batch::where('quantity_remaining', '>', 0)
                ->where('expiry_date', '<=', now())
                ->count();

            // 3. Map keys to match AuthenticatedLayout.jsx exactly
            return response()->json([
                'reorder_alerts_count' => $lowStockCount,
                'expiry_alerts_count'  => $expiredLotsCount,
                'critical_total'       => $lowStockCount + $expiredLotsCount
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['reorder_alerts_count' => 0, 'expiry_alerts_count' => 0, 'critical_total' => 0], 200);
        }
    }


    public function getLiveNotificationFeed()
{
    try {
        $notifications = [];

        // 1. Fetch products currently violating safety reorder limits
        $lowStock = \App\Models\Product::select('id', 'name', 'reorder_level')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('expiry_date', '>', now());
            }, 'stock')
            ->get()
            ->filter(fn($p) => (int)$p->stock <= (int)$p->reorder_level);

        foreach ($lowStock as $item) {
            $notifications[] = [
                'id' => 'stock_' . $item->id,
                'type' => 'critical',
                'title' => 'Low Stock Warning',
                'message' => "Formulation [{$item->name}] is down to {$item->stock} units (Threshold: {$item->reorder_level}).",
                'timestamp' => now()->diffForHumans(),
            ];
        }

        // 2. Fetch active lot layers breaching their 90-day shelf calendar timeline
        $imminentExpirations = \App\Models\Batch::with('product')
            ->where('quantity_remaining', '>', 0)
            ->where('expiry_date', '>', now())
            ->where('expiry_date', '<=', now()->addDays(90))
            ->orderBy('expiry_date', 'asc')
            ->get();

        foreach ($imminentExpirations as $batch) {
            $daysLeft = now()->diffInDays($batch->expiry_date);
            $notifications[] = [
                'id' => 'expiry_' . $batch->id,
                'type' => 'warning',
                'title' => 'Imminent Lot Expiry',
                'message' => "Batch [{$batch->batch_number}] of {$batch->product->name} expires in {$daysLeft} days.",
                'timestamp' => now()->diffForHumans(),
            ];
        }

        return response()->json([
            'count' => count($notifications),
            'feed' => array_slice($notifications, 0, 10) // Limit display loop to top 10 notices
        ], 200);

    } catch (\Exception $e) {
        return response()->json(['count' => 0, 'feed' => []], 200);
    }
}



}
