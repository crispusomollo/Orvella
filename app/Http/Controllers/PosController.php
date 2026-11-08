<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Batch;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Prescription;
use App\Models\ShiftReconciliation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PosController extends Controller
{
    /**
     * Display the upgraded POS Register Desk interface.
     */
    /*public function showRegisterConsole(Request $request)
    {
        $search = $request->get('search');
        
        $query = Product::select('id', 'name', 'sku', 'requires_prescription')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'stock')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(MAX(selling_price), 0.00)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('quantity_remaining', '>', 0);
            }, 'selling_price_fallback')
            ->whereHas('batches', function ($q) {
                $q->where('quantity_remaining', '>', 0);
            });

        if (!empty($search)) {
            $query->where('name', 'ILIKE', "%{$search}%")->orWhere('sku', 'LIKE', "%{$search}%");
        }

        // Limit initial load to Top 10 items per page configuration
        $products = $query->paginate(10)->withQueryString();

        // Calculate active collections for the current user's active daily shift session window
        $currentShiftSales = Sale::where('user_id', auth()->id() ?? 1)
            ->whereBetween('created_at', [now()->startOfDay(), now()->endOfDay()])
            ->get();

        $shiftTotals = [
            'expected_cash'  => $currentShiftSales->where('payment_method', 'Cash')->sum('total_amount'),
            'expected_mpesa' => $currentShiftSales->where('payment_method', 'M-Pesa')->sum('total_amount'),
            'expected_card'  => $currentShiftSales->where('payment_method', 'Card')->sum('total_amount'),
        ];

        return Inertia::render('Pos/Register', [
            'productsData' => $products,
            'shiftTotals' => $shiftTotals,
            'filters' => $request->only(['search'])
        ]);
    }*/

    /**
     * Display the upgraded POS Register Desk interface with advanced shift auditing.
     */
    public function showRegisterConsole(Request $request)
    {
        $search = $request->get('search');
        
        $query = Product::select('id', 'name', 'sku', 'requires_prescription')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'stock')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(MAX(selling_price), 0.00)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('quantity_remaining', '>', 0);
            }, 'selling_price_fallback')
            ->whereHas('batches', function ($q) {
                $q->where('quantity_remaining', '>', 0);
            });

        if (!empty($search)) {
            $query->where('name', 'ILIKE', "%{$search}%")->orWhere('sku', 'LIKE', "%{$search}%");
        }

        $products = $query->paginate(10)->withQueryString();

        // 1. Fetch all sales within the active shift timeline window
        $currentShiftSales = Sale::where('user_id', auth()->id() ?? 1)
            ->whereBetween('created_at', [now()->startOfDay(), now()->endOfDay()])
            ->get();

        // 2. Initialize matrix aggregators
        $expectedCash = 0.00;
        $expectedMpesa = 0.00;
        $expectedCard = 0.00;

        // 3. Systematically trace split payment matrices vs flat single channels
        foreach ($currentShiftSales as $sale) {
            if ($sale->payment_method === 'Split' && !empty($sale->payment_splits)) {
                // Decode PostgreSQL jsonb payload structure safely
                $splits = is_string($sale->payment_splits) ? json_decode($sale->payment_splits, true) : $sale->payment_splits;
                
                $expectedCash += (float)($splits['Cash'] ?? 0);
                $expectedMpesa += (float)($splits['M-Pesa'] ?? 0);
                $expectedCard += (float)($splits['Card'] ?? 0);
            } else {
                // Fallback channel allocation processing logic
                if ($sale->payment_method === 'Cash') $expectedCash += (float)$sale->total_amount;
                if ($sale->payment_method === 'M-Pesa') $expectedMpesa += (float)$sale->total_amount;
                if ($sale->payment_method === 'Card') $expectedCard += (float)$sale->total_amount;
            }
        }

        $shiftTotals = [
            'expected_cash'  => $expectedCash,
            'expected_mpesa' => $expectedMpesa,
            'expected_card'  => $expectedCard,
        ];

        return Inertia::render('Pos/Register', [
            'productsData' => $products,
            'shiftTotals' => $shiftTotals,
            'filters' => $request->only(['search'])
        ]);
    }


    /**
     * Pull all active un-dispensed clinical script files from care registries.
     */
    public function getPendingPrescriptionsQueue()
    {
        $scripts = Prescription::with('patient')
            ->where('status', 'Active')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($scripts);
    }

    /**
     * Load an itemized script file directly into the client-side POS register cart memory.
     */
    public function loadScriptIntoCart($id)
    {
        $script = Prescription::with('items.product')->findOrFail($id);
        
        $cartItems = [];
        foreach ($script->items as $item) {
            // Find active price straight from live batches
            $batchPrice = Batch::where('product_id', $item->product_id)
                ->where('quantity_remaining', '>', 0)
                ->value('selling_price') ?? 0.00;

            $cartItems[] = [
                'product_id' => $item->product_id,
                'name' => $item->product->name,
                'sku' => $item->product->sku,
                'quantity' => $item->quantity_ordered,
                'price' => (float)$batchPrice,
                'prescription_id' => $script->id
            ];
        }

        return response()->json([
            'patient' => $script->patient,
            'items' => $cartItems
        ]);
    }

    /**
     * Process POS transaction orders atomically under full FEFO inventory regulations.
     */
    /*public function processCheckout(Request $request)
    {
        $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'payment_method' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);
        return DB::transaction(function () use ($request) {
            $totalAmount = 0.00;
            $saleItemsToInsert = [];

            // 1. Process each item row under strict lot tier deductions
            foreach ($request->items as $item) {
                $qtyNeeded = $item['quantity'];
                $productId = $item['product_id'];

                // Pull active lots for this formulation sorted by nearest expiration timeline (FEFO)
                $batches = Batch::where('product_id', $productId)
                    ->where('quantity_remaining', '>', 0)
                    ->where('expiry_date', '>', now()) // Protects against dispensing expired drugs
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                $totalAvailable = $batches->sum('quantity_remaining');
                if ($totalAvailable < $qtyNeeded) {
                    $prodName = Product::where('id', $productId)->value('name');
                    throw new \Exception("Stock Deficit: [{$prodName}] lacks active lot balances to fulfill order.");
                }

                // Deduct units systematically across lot channels
                foreach ($batches as $batch) {
                    if ($qtyNeeded <= 0) break;

                    $deduct = min($batch->quantity_remaining, $qtyNeeded);
                    $batch->quantity_remaining -= $deduct;
                    $batch->save();

                    // Using the confirmed selling price loaded from frontend parameters
                    $lineTotal = $deduct * $item['price'];
                    $totalAmount += $lineTotal;

                    // Unified table format mapping directly to your audit log structures
                    $saleItemsToInsert[] = [
                        'product_id' => $productId,
                        'batch_id'   => $batch->id,
                        'quantity'   => $deduct,
                        'unit_price' => (float)$item['price'],
                        'subtotal'   => $lineTotal,
                    ];

                    $qtyNeeded -= $deduct;
                }
            }

            // 2. Archive primary sale invoice ledger header record
            $sale = Sale::create([
                'user_id' => auth()->id() ?? 1,
                'patient_id' => $request->patient_id,
                'invoice_number' => 'INV-' . strtoupper(bin2hex(random_bytes(4))),
                'total_amount' => $totalAmount,
                'payment_method' => $request->payment_method,
            ]);

            // 3. Attach relational sub-items
            foreach ($saleItemsToInsert as $si) {
                $si['sale_id'] = $sale->id;
                SalesItem::create($si);
            }

            // 4. Update prescription status metrics if loaded from queue channel
            if ($request->prescription_id) {
                Prescription::where('id', $request->prescription_id)->update(['status' => 'Dispensed']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Invoice finalized and dispensed successfully.',
                'invoice' => $sale
            ]);
        });
    }*/

    /**
     * Process POS transaction orders atomically under full FEFO inventory regulations with discounts and split payment handling.
     */
    /*public function processCheckout(Request $request)
    {
        $request->validate([
            'patient_id' => 'nullable|exists:patients,id',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'discount' => 'required|numeric|min:0',
            'is_split_payment' => 'required|boolean',
            // 1. Single payment method is required ONLY if is_split_payment is false
            'payment_method' => 'required_if:is_split_payment,false|nullable|string',
            // 2. payment_splits should be a nullable array, evaluated manually downstream
            'payment_splits' => 'nullable|array',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            $subtotalAmount = 0.00;
            $saleItemsToInsert = [];

            // 1. Process each item row under strict lot tier deductions (FEFO)
            foreach ($request->items as $item) {
                $qtyNeeded = $item['quantity'];
                $productId = $item['product_id'];

                $batches = Batch::where('product_id', $productId)
                    ->where('quantity_remaining', '>', 0)
                    ->where('expiry_date', '>', now())
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                $totalAvailable = $batches->sum('quantity_remaining');
                if ($totalAvailable < $qtyNeeded) {
                    $prodName = Product::where('id', $productId)->value('name');
                    throw new \Exception("Stock Deficit: [{$prodName}] lacks active lot balances to fulfill order.");
                }

                foreach ($batches as $batch) {
                    if ($qtyNeeded <= 0) break;

                    $deduct = min($batch->quantity_remaining, $qtyNeeded);
                    $batch->quantity_remaining -= $deduct;
                    $batch->save();

                    $lineTotal = $deduct * $item['price'];
                    $subtotalAmount += $lineTotal;

                    $saleItemsToInsert[] = [
                        'product_id' => $productId,
                        'batch_id'   => $batch->id,
                        'quantity'   => $deduct,
                        'unit_price' => (float)$item['price'],
                        'subtotal'   => $lineTotal,
                    ];

                    $qtyNeeded -= $deduct;
                }
            }

            // 2. Compute Discounts & Totals Safely
            $discountValue = (float)$request->discount;
            if ($discountValue > $subtotalAmount) {
                throw new \Exception("Compliance Breach: Discount value cannot exceed total transaction due.");
            }
            $totalAmount = $subtotalAmount - $discountValue;

            // 3. Reconcile Payment Splits
            $paymentMethodString = $request->payment_method;
            $finalSplitsArray = null;

            if ($request->is_split_payment) {
            $runningSplitSum = 0.00;
            $finalSplitsArray = [];
    
            // FIXED: Safely default to an empty array loop if nothing was transmitted
            $splitsInput = $request->get('payment_splits', []);
    
            foreach ($splitsInput as $method => $amount) {
                $parsedAmount = (float)$amount;
                if ($parsedAmount > 0) {
                    $finalSplitsArray[$method] = $parsedAmount;
                    $runningSplitSum += $parsedAmount;
                }
            }

            if (abs($runningSplitSum - $totalAmount) > 0.01) {
                throw new \Exception("Tally Variance: Split payment sum must match Total Due.");
            }
            $paymentMethodString = 'Split';
        } else {
            // SECURITY GUARD: If it is not a split payment, force final splits to explicitly clean null
            $finalSplitsArray = null;
        }

            // 4. Archive primary sale invoice ledger header record
            $sale = Sale::create([
                'user_id' => auth()->id() ?? 1,
                'patient_id' => $request->patient_id,
                'invoice_number' => 'INV-' . strtoupper(bin2hex(random_bytes(4))),
                'subtotal_amount' => $subtotalAmount,
                'discount' => $discountValue,
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethodString,
                'payment_splits' => $finalSplitsArray ? json_encode($finalSplitsArray) : null,
            ]);

            // 5. Attach relational sub-items
            foreach ($saleItemsToInsert as $si) {
                $si['sale_id'] = $sale->id;
                \App\Models\SalesItem::create($si);
            }

            if ($request->prescription_id) {
                Prescription::where('id', $request->prescription_id)->update(['status' => 'Dispensed']);
            }

            $sale->load(['items.product']);

            return response()->json([
                'success' => true,
                'message' => 'Invoice finalized and split metrics balance successfully.',
                'invoice' => $sale
            ]);
        });
    }*/

    public function processCheckout(Request $request)
    {
    $request->validate([
        'patient_id' => 'nullable|exists:patients,id',
        'prescription_id' => 'nullable|exists:prescriptions,id',
        'discount' => 'required|numeric|min:0',
        'is_split_payment' => 'required|boolean',
        'payment_method' => 'required_if:is_split_payment,false|nullable|string',
        'payment_splits' => 'nullable|array',
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.quantity' => 'required|integer|min:1',
        'items.*.price' => 'required|numeric|min:0',
    ]);

    return DB::transaction(function () use ($request) {
        $subtotalAmount = 0.00;
        $saleItemsToInsert = [];

        // 1. Process product item selections under strict FEFO lot exhaustion limits
        foreach ($request->items as $item) {
            $qtyNeeded = (int)$item['quantity'];
            $productId = $item['product_id'];

            $batches = Batch::where('product_id', $productId)
                ->where('quantity_remaining', '>', 0)
                ->where('expiry_date', '>', now())
                ->orderBy('expiry_date', 'asc')
                ->get();

            $totalAvailable = $batches->sum('quantity_remaining');
            if ($totalAvailable < $qtyNeeded) {
                $prodName = Product::where('id', $productId)->value('name');
                throw new \Exception("Stock Deficit: [{$prodName}] lacks active lot balances to fulfill order.");
            }

            foreach ($batches as $batch) {
                if ($qtyNeeded <= 0) break;

                $deduct = min($batch->quantity_remaining, $qtyNeeded);
                $batch->quantity_remaining -= $deduct;
                $batch->save();

                $lineTotal = $deduct * (float)$item['price'];
                $subtotalAmount += $lineTotal;

                $saleItemsToInsert[] = [
                    'product_id' => $productId,
                    'batch_id'   => $batch->id,
                    'quantity'   => $deduct,
                    'unit_price' => (float)$item['price'],
                    'subtotal'   => $lineTotal,
                ];

                $qtyNeeded -= $deduct;
            }
        }

        // 2. Compute Discounts & Totals Safely
        $discountValue = (float)$request->discount;
        if ($discountValue > $subtotalAmount) {
            throw new \Exception("Compliance Breach: Discount value cannot exceed total transaction due.");
        }
        $totalAmount = round($subtotalAmount - $discountValue, 2);

        // 3. Reconcile Payment Splits safely against string inputs
        $paymentMethodString = $request->payment_method;
        $finalSplitsArray = null;

        if ($request->is_split_payment) {
            $runningSplitSum = 0.00;
            $finalSplitsArray = [];
            $splitsInput = $request->get('payment_splits', []);

            foreach (['Cash', 'M-Pesa', 'Card'] as $method) {
                // Intercept empty string entries or null values and convert safely to 0.00
                $val = isset($splitsInput[$method]) ? trim($splitsInput[$method]) : '';
                $parsedAmount = ($val === '') ? 0.00 : (float)$val;
                
                if ($parsedAmount > 0) {
                    $finalSplitsArray[$method] = round($parsedAmount, 2);
                    $runningSplitSum += $parsedAmount;
                }
            }

            // Apply round cushion checking to avoid precision drift failures
            if (abs(round($runningSplitSum, 2) - $totalAmount) > 0.01) {
                throw new \Exception("Tally Variance: Split payment sum (KES " . number_format($runningSplitSum, 2) . ") must match Net Total Due (KES " . number_format($totalAmount, 2) . ").");
            }
            $paymentMethodString = 'Split';
        }

        // 4. Archive primary sale invoice ledger header record
        $sale = Sale::create([
            'user_id' => auth()->id() ?? 1,
            'patient_id' => $request->patient_id,
            'invoice_number' => 'INV-' . strtoupper(bin2hex(random_bytes(4))),
            'subtotal_amount' => $subtotalAmount,
            'discount' => $discountValue,
            'total_amount' => $totalAmount,
            'payment_method' => $paymentMethodString,
            'payment_splits' => $finalSplitsArray ? json_encode($finalSplitsArray) : null,
        ]);

        // 5. Attach relational sub-items
        foreach ($saleItemsToInsert as $si) {
            $si['sale_id'] = $sale->id;
            SalesItem::create($si);
        }

        if ($request->prescription_id) {
            Prescription::where('id', $request->prescription_id)->update(['status' => 'Dispensed']);
        }

        $sale->load(['items.product']);

        // INJECT AUDIT TRACE LOG VECTOR
        \App\Services\ActivityLogger::log(
            'POS_SALE_COMPLETED',
            "Completed sales invoice [{$sale->invoice_number}] totaling KES " . number_format($sale->total_amount, 2) . " via payment channel [{$sale->payment_method}]."
        );


        return response()->json([
            'success' => true,
            'message' => 'Invoice finalized and split metrics balanced successfully.',
            'invoice' => $sale
        ]);
    });
    }




    /**
     * Atomically process shift closure collections, calculating discrepancies.
     */
    /*public function processShiftReconciliation(Request $request)
    {
        $validated = $request->validate([
            'expected_cash'  => 'required|numeric',
            'expected_mpesa' => 'required|numeric',
            'expected_card'  => 'required|numeric',
            'actual_cash'    => 'required|numeric|min:0',
            'actual_mpesa'   => 'required|numeric|min:0',
            'actual_card'    => 'required|numeric|min:0',
            'discrepancy_notes' => 'nullable|string'
        ]);

        $reconciliation = ShiftReconciliation::create([
            'user_id' => auth()->id() ?? 1,
            'shift_started_at' => now()->startOfDay(), // Simple shift window assumption
            'shift_ended_at' => now(),
            'expected_cash' => $validated['expected_cash'],
            'expected_mpesa' => $validated['expected_mpesa'],
            'expected_card' => $validated['expected_card'],
            'actual_cash' => $validated['actual_cash'],
            'actual_mpesa' => $validated['actual_mpesa'],
            'actual_card' => $validated['actual_card'],
            'discrepancy_notes' => $validated['discrepancy_notes'],
            'status' => 'Reconciled'
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Shift operations closed, reconciled and locked successfully.',
            'reconciliation' => $reconciliation
        ]);
    }*/

        /**
     * Atomically process shift closure collections, calculating discrepancies.
     */
    /*public function processShiftReconciliation(Request $request)
    {
        $validated = $request->validate([
            'expected_cash'  => 'required|numeric',
            'expected_mpesa' => 'required|numeric',
            'expected_card'  => 'required|numeric',
            'actual_cash'    => 'required|numeric|min:0',
            'actual_mpesa'   => 'required|numeric|min:0',
            'actual_card'    => 'required|numeric|min:0',
            'discrepancy_notes' => 'nullable|string'
        ]);

        $reconciliation = ShiftReconciliation::create([
            'user_id' => auth()->id() ?? 1,
            'shift_started_at' => now()->startOfDay(), 
            'shift_ended_at' => now(),
            'expected_cash' => $validated['expected_cash'],
            'expected_mpesa' => $validated['expected_mpesa'],
            'expected_card' => $validated['expected_card'],
            'actual_cash' => $validated['actual_cash'],
            'actual_mpesa' => $validated['actual_mpesa'],
            'actual_card' => $validated['actual_card'],
            'discrepancy_notes' => $validated['discrepancy_notes'],
            'status' => 'Reconciled'
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Shift operations closed, split transactions tallied, and drawer locked successfully.',
            'reconciliation' => $reconciliation
        ]);
    }*/

    /**
     * Atomically process shift closure collections, calculating discrepancies.
     */
    public function processShiftReconciliation(Request $request)
    {
        $validated = $request->validate([
            'expected_cash'  => 'required|numeric',
            'expected_mpesa' => 'required|numeric',
            'expected_card'  => 'required|numeric',
            'actual_cash'    => 'required|numeric|min:0',
            'actual_mpesa'   => 'required|numeric|min:0',
            'actual_card'    => 'required|numeric|min:0',
            'discrepancy_notes' => 'nullable|string'
        ]);

        // Wrap the execution inside an atomic transaction block
        $reconciliation = \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            return ShiftReconciliation::create([
                'user_id' => auth()->id() ?? 1,
                'shift_started_at' => now()->startOfDay(), 
                'shift_ended_at' => now(),
                'expected_cash' => $validated['expected_cash'],
                'expected_mpesa' => $validated['expected_mpesa'],
                'expected_card' => $validated['expected_card'],
                'actual_cash' => $validated['actual_cash'],
                'actual_mpesa' => $validated['actual_mpesa'],
                'actual_card' => $validated['actual_card'],
                'discrepancy_notes' => $validated['discrepancy_notes'],
                'status' => 'Reconciled'
            ]);
    });

    // INJECT AUDIT TRACE LOG VECTOR
            \App\Services\ActivityLogger::log(
                'SHIFT_RECONCILIATION',
                "Closed active retail session shift registry. Status: RECONCILED. Drawer Cash Expected: KES " . number_format($validated['expected_cash'], 2) . " | Counted: KES " . number_format($validated['actual_cash'], 2)
            );

        return response()->json([
            'success' => true, 
            'message' => 'Shift operations closed, split transactions tallied, and drawer locked successfully.',
            'reconciliation' => $reconciliation
        ]);
    }


    
    /**
     * Asynchronously query active inventory channels matching keywords.
     * Route Sourced: GET /api/inventory-lookup
     */
    public function getActiveInventory(Request $request)
    {
        $search = $request->get('query');

        if (empty($search)) {
            return response()->json([]);
        }

        // Pull drug formulations with remaining quantities, skipping expired or empty lots entirely
        $results = Product::select('id', 'name', 'sku', 'requires_prescription')
            ->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%")
                  ->orWhere('generic_name', 'ILIKE', "%{$search}%");
            })
            ->whereHas('batches', function ($query) {
                $query->where('quantity_remaining', '>', 0)
                      ->where('expiry_date', '>', now());
            })
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('quantity_remaining', '>', 0)
                    ->where('expiry_date', '>', now());
            }, 'stock')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(MAX(selling_price), 0.00)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id')
                    ->where('quantity_remaining', '>', 0)
                    ->where('expiry_date', '>', now());
            }, 'selling_price_fallback')
            ->take(10)
            ->get();

        return response()->json($results);
    }

    /**
     * Search patient profile dictionary asynchronously for live receipt account attachments.
     * Route Sourced: GET /api/patients-search
     */
    public function searchPatients(Request $request)
    {
        $search = $request->get('query');

        if (empty($search)) {
            return response()->json([]);
        }

        $patients = \App\Models\Patient::select('id', 'name', 'patient_number')
            ->where('name', 'ILIKE', "%{$search}%")
            ->orWhere('patient_number', 'ILIKE', "%{$search}%")
            ->take(5)
            ->get();

        return response()->json($patients);
    }

        /**
     * Compile and stream a direct live audit report of active register stocks.
     * Route Sourced: GET /api/pos/inventory/export
     */
    public function exportPosInventoryData(Request $request)
    {
        $format = $request->get('format', 'excel');
        $search = $request->get('query');

        $query = Product::select('id', 'name', 'sku', 'requires_prescription')
            ->whereHas('batches', function ($q) {
                $q->where('quantity_remaining', '>', 0);
            });

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('sku', 'LIKE', "%{$search}%");
            });
        }

        $products = $query->withSum(['batches as stock' => function ($q) {
            $q->where('quantity_remaining', '>', 0)->where('expiry_date', '>', now());
        }], 'quantity_remaining')
        ->withMax(['batches as selling_price_fallback' => function ($q) {
            $q->where('quantity_remaining', '>', 0);
        }], 'selling_price')
        ->get();

        // Branch A: Print HTML Layout View target for PDF printing conversion
        /*if ($format === 'pdf') {
            return view('exports.pos_inventory_pdf', compact('products'));
        }*/

        // Branch A: Print HTML Layout View target for PDF printing conversion
        if ($format === 'pdf') {
            // STEP A REGISTRY: LOAD PERSISTENT CORPORATE METADATA VALUES
            $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
            return view('exports.pos_inventory_pdf', compact('products', 'corporateBranding'));
        }


        // Branch B: Direct CSV / Excel Memory Stream Injection
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=pos_register_stock_report_" . now()->format('Ymd_His') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($products) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Product Formulation', 'SKU Code Barcode', 'Regulatory Code (Rx)', 'Shelf Quantity Available', 'Current Selling Rate (KES)']);

            foreach ($products as $row) {
                fputcsv($file, [
                    $row->name,
                    $row->sku,
                    $row->requires_prescription ? 'Rx Only' : 'Over the Counter',
                    $row->stock ?? 0,
                    number_format($row->selling_price_fallback, 2)
                ]);
            }
            fclose($file);
        };

        return \Illuminate\Support\Facades\Response::stream($callback, 200, $headers);
    }


    /**
     * Asynchronously query historical sales invoices with filters.
     * Route Sourced: GET /api/pos/sales-history
     */
    /*public function getSalesHistory(Request $request)
    {
        $search = $request->get('query');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $paymentMethod = $request->get('payment_method');

        $query = Sale::with(['patient', 'user']);

        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('patient', function($pq) use ($search) {
                      $pq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }

        if (!empty($startDate)) {
        // Force start boundary to the absolute beginning of that calendar day
        $query->where('created_at', '>=', \Carbon\Carbon::parse($startDate)->startOfDay());
        }

        if (!empty($endDate)) {
        // Force end boundary to include everything up to the final second of that calendar day
        $query->where('created_at', '<=', \Carbon\Carbon::parse($endDate)->endOfDay());
        }

        if (!empty($paymentMethod)) {
            $query->where('payment_method', $paymentMethod);
        }

        // Return latest transactions first, paginated by 15 records
        $sales = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($sales);
    }*/

    /**
     * Asynchronously query historical sales invoices with defensive fallbacks.
     */
    public function getSalesHistory(Request $request)
    {
        $search = $request->get('query');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $paymentMethod = $request->get('payment_method');

        $query = Sale::with(['patient', 'user']);

        // 1. Text Search Filter
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('patient', function($pq) use ($search) {
                      $pq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // 2. Defensive Date Range Filter (Only bind boundaries if explicitly provided)
        if (!empty($startDate) && $startDate !== 'undefined') {
            try {
                $query->where('created_at', '>=', \Carbon\Carbon::parse($startDate)->startOfDay());
            } catch (\Exception $e) {
                // Defensive fallback to prevent parsing crashes
            }
        }

        if (!empty($endDate) && $endDate !== 'undefined') {
            try {
                $query->where('created_at', '<=', \Carbon\Carbon::parse($endDate)->endOfDay());
            } catch (\Exception $e) {
                // Defensive fallback
            }
        }

        // 3. Payment Method Filter
        if (!empty($paymentMethod)) {
            $query->where('payment_method', $paymentMethod);
        }

        // Return latest transactions first, paginated by 15 records
        $sales = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($sales);
    }


    /**
     * Fetch complete single invoice detail for reprinting.
     * Route Sourced: GET /api/pos/sales/{id}/reprint
     */
    public function getInvoiceDetailsForReprint($id)
    {
        $sale = Sale::with(['items.product', 'patient'])->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'invoice' => $sale
        ]);
    }


        /**
     * Stream an Excel-compatible CSV export of sales invoices for accounting audits.
     * Route Sourced: GET /api/pos/sales-history/export
     */
    public function exportSalesLedgerCsv(Request $request)
    {
        $search = $request->get('query');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        $paymentMethod = $request->get('payment_method');

        $query = Sale::with(['patient', 'user']);

        // Mirror the exact database query filter parameters
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('patient', function($pq) use ($search) {
                      $pq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }
        if (!empty($startDate)) {
            $query->where('created_at', '>=', \Carbon\Carbon::parse($startDate)->startOfDay());
        }
        if (!empty($endDate)) {
            $query->where('created_at', '<=', \Carbon\Carbon::parse($endDate)->endOfDay());
        }
        if (!empty($paymentMethod)) {
            $query->where('payment_method', $paymentMethod);
        }

        $sales = $query->orderBy('created_at', 'desc')->get();
        $fileName = 'sales_ledger_export_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($sales) {
            $file = fopen('php://output', 'w');
            // Structured column header row for financial software import
            fputcsv($file, ['Timestamp', 'Invoice Number', 'Cashier Name', 'Patient Name', 'Payment Mode', 'Gross Subtotal', 'Discount Extended', 'Net Revenue Collected']);

            foreach ($sales as $row) {
                fputcsv($file, [
                    $row->created_at->toDateTimeString(),
                    $row->invoice_number,
                    $row->user->name ?? 'N/A',
                    $row->patient->name ?? 'Walk-In Customer',
                    $row->payment_method,
                    $row->subtotal_amount,
                    $row->discount,
                    $row->total_amount
                ]);
            }
            fclose($file);
        };

        return \Illuminate\Support\Facades\Response::stream($callback, 200, $headers);
    }


}
