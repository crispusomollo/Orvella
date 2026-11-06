<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SupplierDebtController extends Controller
{
    /**
     * Compute a real-time aging distribution analysis profile for accounts payable.
     * Route Sourced: GET /api/reports/supplier-aging
     */
    public function getAgingAnalysisSummary()
    {
        $today = Carbon::today();

        // 1. Calculate the total portfolio liabilities sum currently active in the system
        // Sourced as the sum of all credits minus debits from the ledgers
        $totalPortfolioPayables = DB::table('supplier_ledgers')
            ->selectRaw('SUM(credit) - SUM(debit) as outstanding')
            ->value('outstanding') ?? 0.00;

        // 2. Pull all suppliers to build the itemized aging matrix row elements
        $suppliers = Supplier::select('id', 'name')->get();
        $summaryLedger = [];
        foreach ($suppliers as $supplier) {
            // Fetch all ledger rows for this supplier to trace open credit records
            $entries = DB::table('supplier_ledgers')
                ->where('supplier_id', $supplier->id)
                ->get();

            // Calculate the absolute combined balance for this specific vendor
            $totalOutstandingDebt = $entries->sum('credit') - $entries->sum('debit');

            // Skip suppliers with zero outstanding liability footprint
            if ($totalOutstandingDebt <= 0) {
                continue;
            }

            $currentDues = 0.00;
            $age1to30 = 0.00;
            $age31to60 = 0.00;
            $ageOver60 = 0.00;

            foreach ($entries as $entry) {
                // Determine open balance of individual record row
                $entryBalance = $entry->credit - $entry->debit;
                if ($entryBalance <= 0) continue;

                if (empty($entry->due_date)) {
                    $currentDues += $entryBalance;
                    continue;
                }

                $dueDate = Carbon::parse($entry->due_date);

                if ($dueDate->isFuture() || $dueDate->isToday()) {
                    // Item is not overdue yet
                    $currentDues += $entryBalance;
                } else {
                    // Calculate precise days overdue from current date parameter
                    $daysOverdue = $dueDate->diffInDays($today);

                    if ($daysOverdue <= 30) {
                        $age1to30 += $entryBalance;
                    } elseif ($daysOverdue <= 60) {
                        $age31to60 += $entryBalance;
                    } else {
                        $ageOver60 += $entryBalance;
                    }
                }
            }

            $summaryLedger[] = [
                'supplier_name'          => $supplier->name,
                'current_dues'           => (float)$currentDues,
                'age_1_30_days'          => (float)$age1to30,
                'age_31_60_days'         => (float)$age31to60,
                'age_over_60_days'       => (float)$ageOver60,
                'total_outstanding_debt' => (float)$totalOutstandingDebt,
            ];
        }

        // Return unified payload structure matching React state targets precisely
        return response()->json([
            'total_portfolio_payables' => (float)$totalPortfolioPayables,
            'summary_ledger'           => $summaryLedger,
            'generated_at'             => $today->format('Y-m-d H:i:s'),
        ]);
    }

        /**
     * Settle a wholesaler payment, reducing outstanding liabilities via direct debit entries.
     * Route Sourced: POST /api/suppliers/settle-payment
     */
    public function settleSupplierPayment(Request $request)
    {
        // 1. Strict validation of payment entry fields
        $validated = $request->validate([
            'supplier_id'    => 'required|exists:suppliers,id',
            'amount_paid'    => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:Cash,M-Pesa,Bank Transfer',
            'reference_code' => 'required|string|max:100', // Cheque or transaction code
            'payment_date'   => 'required|date',
        ]);

        return DB::transaction(function () use ($validated) {
            // 2. Fetch the current running balance for this supplier record
            $currentEntries = DB::table('supplier_ledgers')
                ->where('supplier_id', $validated['supplier_id'])
                ->get();

            $totalOutstandingDebt = $currentEntries->sum('credit') - $currentEntries->sum('debit');

            // Compliance Guard: Ensure we do not pay more than what is owed
            if ($validated['amount_paid'] > $totalOutstandingDebt) {
                throw new \Exception("Accounting Error: Payment amount (KES " . number_format($validated['amount_paid'], 2) . ") exceeds total outstanding debt balance (KES " . number_format($totalOutstandingDebt, 2) . ").");
            }
                // 3. Calculate the new decreased running balance
            $previousBalance = DB::table('supplier_ledgers')
                ->where('supplier_id', $validated['supplier_id'])
                ->orderBy('id', 'desc')
                ->value('running_balance') ?? 0.00;

            $newRunningBalance = $previousBalance - $validated['amount_paid']; // Debit decreases portfolio debt

            // 4. Ingest the debit row into the PostgreSQL ledger database layer
            DB::table('supplier_ledgers')->insert([
                'supplier_id'      => $validated['supplier_id'],
                'purchase_id'      => null, // Not tied to a single invoice, pays down generic ledger debt
                'transaction_type' => 'CASH_PAYMENT',
                'reference_number' => strtoupper(trim($validated['reference_code'])),
                'debit'            => $validated['amount_paid'],
                'credit'           => 0.00,
                'running_balance'  => $newRunningBalance,
                'due_date'         => null,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Payment of KES " . number_format($validated['amount_paid'], 2) . " safely processed against supplier account ledger under Ref: " . strtoupper($validated['reference_code'])
            ], 200);
        });
    }

        /**
     * Extract a comprehensive chronological statement log for an individual supplier account.
     * Route Sourced: GET /api/suppliers/{id}/transactions
     */
    public function getSupplierTransactionHistory($id)
    {
        // 1. Fetch raw ledgers matching target wholesaler
        $ledgerEntries = DB::table('supplier_ledgers')
            ->where('supplier_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedHistory = [];

        foreach ($ledgerEntries as $entry) {
            $itemsSummary = [];

            // 2. If the entry is a consignment purchase intake, trace the specific medications bought
            if ($entry->transaction_type === 'CONSIGNMENT_INTAKE' && !empty($entry->purchase_id)) {
                $itemsSummary = DB::table('purchase_items')
                    ->join('products', 'purchase_items.product_id', '=', 'products.id')
                    ->where('purchase_items.purchase_id', $entry->purchase_id)
                    ->select('products.name', 'purchase_items.qty_purchased', 'purchase_items.unit_cost')
                    ->get()
                    ->map(function($item) {
                        return "{$item->name} ({$item->qty_purchased} Units x KES {$item->unit_cost})";
                    })->toArray();
            }

            $formattedHistory[] = [
                'id'               => $entry->id,
                'date'             => \Carbon\Carbon::parse($entry->created_at)->format('Y-m-d H:i'),
                'type'             => $entry->transaction_type,
                'reference'        => $entry->reference_number,
                'debit'            => (float)$entry->debit,
                'credit'           => (float)$entry->credit,
                'running_balance'  => (float)$entry->running_balance,
                'due_date'         => $entry->due_date ? \Carbon\Carbon::parse($entry->due_date)->format('Y-m-d') : 'N/A',
                'products_bought'  => implode(', ', $itemsSummary)
            ];
        }

        return response()->json($formattedHistory);
    }



} 
