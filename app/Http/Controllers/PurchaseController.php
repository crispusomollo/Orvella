<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    /**
     * Process an inbound supplier delivery lot invoice, auto-provisioning stock layers AND liabilities.
     * Route Sourced: POST /api/purchases/receive
     */
    public function receiveSupplierStock(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'delivery_date' => 'required|date',
            'purchase_id' => 'nullable|exists:purchases,id', 
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.consignment_batch_number' => 'required|string',
            'items.*.qty_purchased' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.suggested_retail_price' => 'required|numeric|gt:items.*.unit_cost',
            'items.*.batch_expiry_date' => 'required|date|after:today',
        ]);

        try {
            $purchasePayload = DB::transaction(function () use ($request) {
                $accumulatedGrandTotal = 0;
                
                foreach ($request->items as $item) {
                    $accumulatedGrandTotal += ($item['qty_purchased'] * $item['unit_cost']);
                }

                // If fulfilling a staged auto-PO, update the header row directly
                if ($request->purchase_id) {
                    $purchase = Purchase::findOrFail($request->purchase_id);
                    $purchase->update([
                        'grand_total'   => $accumulatedGrandTotal,
                        'delivery_date' => $request->delivery_date,
                        'status'        => 'Received' 
                    ]);
                    
                    // Clear out temporary placeholder lines from the auto-generation phase
                    DB::table('purchase_items')->where('purchase_id', $purchase->id)->delete();
                } else {
                    // Otherwise, spin up a brand-new header record for manual walk-in shipments
                    $purchase = Purchase::create([
                        'supplier_id' => $request->supplier_id,
                        'purchase_order_number' => 'PO-' . strtoupper(Str::random(6)),
                        'grand_total' => $accumulatedGrandTotal,
                        'delivery_date' => $request->delivery_date,
                        'status' => 'Received'
                    ]);
                }
                // Loop items to build itemized logs and create active lot layers
                foreach ($request->items as $item) {
                    PurchaseItem::create([
                        'purchase_id' => $purchase->id,
                        'product_id' => $item['product_id'],
                        'consignment_batch_number' => $item['consignment_batch_number'],
                        'qty_purchased' => $item['qty_purchased'],
                        'unit_cost' => $item['unit_cost'],
                        'suggested_retail_price' => $item['suggested_retail_price'],
                        'batch_expiry_date' => $item['batch_expiry_date'],
                    ]);

                    Batch::create([
                        'product_id' => $item['product_id'],
                        'supplier_id' => $request->supplier_id,
                        'batch_number' => $item['consignment_batch_number'],
                        'quantity_received' => $item['qty_purchased'],
                        'quantity_remaining' => $item['qty_purchased'],
                        'cost_price' => $item['unit_cost'],
                        'selling_price' => $item['suggested_retail_price'],
                        'expiry_date' => $item['batch_expiry_date'],
                    ]);
                }

                // Log the transaction footprint inside the accounts payable ledger
                $previousBalance = DB::table('supplier_ledgers')
                    ->where('supplier_id', $request->supplier_id)
                    ->orderBy('id', 'desc')
                    ->value('running_balance') ?? 0.00;

                $newRunningBalance = $previousBalance + $accumulatedGrandTotal;
                $dueDate = \Carbon\Carbon::parse($request->delivery_date)->addDays(30)->format('Y-m-d');

                DB::table('supplier_ledgers')->insert([
                    'supplier_id'      => $request->supplier_id,
                    'purchase_id'      => $purchase->id,
                    'transaction_type' => 'CONSIGNMENT_INTAKE',
                    'reference_number' => $purchase->purchase_order_number,
                    'debit'            => 0.00,
                    'credit'           => $accumulatedGrandTotal,
                    'running_balance'  => $newRunningBalance,
                    'due_date'         => $dueDate,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);

                return $purchase;
            });

            return response()->json([
                'success' => true,
                'message' => "Supplier stock consignment check-in finalized successfully under Code: {$purchasePayload->purchase_order_number}.",
                'purchase' => $purchasePayload
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Scan inventory deficits and auto-draft multi-item procurement orders grouped by supplier.
     */
    public function autoDraftSupplierPurchaseOrder(Request $request)
    {
        return DB::transaction(function() use ($request) {
            $lowStockProducts = \App\Models\Product::select('id', 'name', 'sku', 'reorder_level')
                ->selectSub(function ($query) {
                    $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                        ->from('batches')
                        ->whereColumn('batches.product_id', 'products.id')
                        ->where('expiry_date', '>', now());
                }, 'current_stock')
                ->get()
                ->filter(fn($p) => (int)$p->current_stock <= (int)$p->reorder_level);

            if ($lowStockProducts->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'Procurement Guard: No items have breached safety reorder thresholds.'], 200);
            }

            $draftedPosCount = 0;
            $stagedLinesBySupplier = [];

            foreach ($lowStockProducts as $product) {
                $contract = DB::table('product_supplier')->where('product_id', $product->id)->orderBy('contract_cost_price', 'asc')->first();
                $supplierId = $contract ? $contract->supplier_id : \App\Models\Supplier::first()?->id;
                if (!$supplierId) continue;

                $targetStockLevel = (int)$product->reorder_level * 2;
                $suggestedQty = $targetStockLevel - (int)$product->current_stock;
                $unitCost = $contract ? (float)$contract->contract_cost_price : (DB::table('batches')->where('product_id', $product->id)->max('cost_price') ?? 10.00);

                $stagedLinesBySupplier[$supplierId][] = [
                    'product_id'    => $product->id,
                    'qty_purchased' => $suggestedQty,
                    'unit_cost'     => $unitCost,
                    'subtotal'      => $suggestedQty * $unitCost
                ];
            }
            foreach ($stagedLinesBySupplier as $supplierId => $items) {
                // UNIQUE AUTOMATION GUARD: Skip if an unreceived draft order already exists for this vendor
                $alreadyStaged = DB::table('purchases')
                    ->where('supplier_id', $supplierId)
                    ->where('status', 'Pending_Delivery')
                    ->exists();

                if ($alreadyStaged) {
                    continue; 
                }

                $grandTotalSum = collect($items)->sum('subtotal');
                $poNumber = 'AUTO-PO-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4));

                $purchase = Purchase::create([
                    'supplier_id'           => $supplierId,
                    'purchase_order_number' => $poNumber,
                    'grand_total'           => $grandTotalSum, 
                    'delivery_date'         => now()->format('Y-m-d'),
                    'status'                => 'Pending_Delivery' 
                ]);

                foreach ($items as $line) {
                    PurchaseItem::create([
                        'purchase_id'              => $purchase->id,
                        'product_id'               => $line['product_id'],
                        'consignment_batch_number' => 'STAGED_LOT', 
                        'qty_purchased'            => $line['qty_purchased'],
                        'unit_cost'                => $line['unit_cost'],
                        'suggested_retail_price'   => $line['unit_cost'] * 1.30, 
                    ]);
                }

                DB::table('activity_logs')->insert([
                    'user_id'      => auth()->id() ?? 1,
                    'event_type'   => 'CONSIGNMENT_INTAKE_DRAFTED',
                    'target_table' => 'purchases',
                    'target_id'    => $purchase->id,
                    'description'  => "Automated utility bulk-generated pending multi-item PO [{$poNumber}].",
                    'ip_address'   => request()->ip() ?? '127.0.0.1',
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);

                $draftedPosCount++;
            }

            return response()->json(['success' => true, 'message' => "Procurement workflow active: Generated {$draftedPosCount} bulk supplier purchase orders."], 201);
        });
    }

    /**
     * Display your unfulfilled purchase queues and historical checked-in manifests.
     */
    public function indexInwardPurchasesConsole()
    {
        $purchases = Purchase::with(['supplier'])
            ->select('id', 'supplier_id', 'purchase_order_number', 'grand_total', 'delivery_date', 'status', 'created_at')
            ->selectSub(fn($q) => $q->selectRaw('COUNT(*)')->from('purchase_items')->whereColumn('purchase_items.purchase_id', 'purchases.id'), 'total_items_count')
            ->orderBy('created_at', 'desc')
            ->get();

        $suppliers = \App\Models\Supplier::select('id', 'name')->orderBy('name', 'asc')->get();

        return \Inertia\Inertia::render('Purchase/ConsignmentIntake', compact('purchases', 'suppliers'));
    }


    /**
     * Fetch line listings for a specific purchase order to feed your verification consoles.
     */
    public function getPurchaseOrderItemsFeed($id)
    {
        return response()->json(PurchaseItem::with(['product:id,name,sku'])->where('purchase_id', $id)->get(), 200);
    }


    /**
     * Locate an active pending draft for a chosen supplier and transform its items for your input rows.
     */
    public function getPendingPoForSupplier($supplierId)
    {
        // STATUS FILTER GUARD: Ensures historically closed orders are completely ignored
        $pendingPurchase = Purchase::where('supplier_id', $supplierId)
            ->where('purchase_order_number', 'LIKE', 'AUTO-PO-%')
            ->where('status', 'Pending_Delivery') 
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$pendingPurchase) {
            return response()->json(['has_pending' => false, 'items' => []], 200);
        }

        $items = PurchaseItem::where('purchase_id', $pendingPurchase->id)
            ->get()
            ->map(fn($item) => [
                'product_id'               => (string)$item->product_id,
                'consignment_batch_number' => '', 
                'qty_purchased'            => (string)$item->qty_purchased,
                'unit_cost'                => (string)$item->unit_cost,
                'suggested_retail_price'   => (string)$item->suggested_retail_price,
                'batch_expiry_date'        => '' 
            ]);

        return response()->json([
            'has_pending' => true,
            'purchase_id' => $pendingPurchase->id,
            'po_number'   => $pendingPurchase->purchase_order_number,
            'items'       => $items
        ], 200);
    }
    
}
