<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Batch;
use Illuminate\Http\Request;

use App\Traits\HasSystemBranding;
use Illuminate\Support\Facades\DB;

class InventoryExportController extends Controller
{
    use HasSystemBranding;

    /**
     * Generate an automated inventory markdown ledger tracking block.
     * Route Sourced: GET /reports/inventory/export
     */
    /*public function generateInventoryMarkdownReport()
    {
        // Pull live context matrices using the trait helper
        $branding = $this->getSystemBrandingMatrix();
        
        $inventory = DB::table('products')
            ->select('name', 'sku', 'generic_name')
            ->get();
            // Dynamically build the header utilizing live database configuration structures
        $output = "====================================================\n";
        $output .= "   " . strtoupper($branding['name']) . "   \n";
        $output .= "   CONTACT: " . $branding['phone'] . " | TIN: " . $branding['tin'] . " \n";
        $output .= "====================================================\n\n";
        $output .= "# INVENTORY AUDIT CATALOG LEDGER REPORT\n";
        $output .= "Generated on: " . now()->format('Y-m-d H:i:s') . "\n\n";
        
        $output .= "| Item SKU | Product Nomenclature | Generic Formulation Molecule |\n";
        $output .= "| :--- | :--- | :---\n";
        
        foreach ($inventory as $item) {
            $output .= "| {$item->sku} | {$item->name} | {$item->generic_name} |\n";
        }

        return response($output, 200, [
            'Content-Type' => 'text/markdown',
            'Content-Disposition' => 'attachment; filename="inventory_report_' . now()->format('Y-m-d') . '.md"'
        ]);
    }*/

        /**
     * Compile a comprehensive inventory state listing with dynamic corporate profiles.
     * Route Sourced: GET /reports/inventory/export
     */
    public function generateInventoryMarkdownReport()
    {
        // STEP 3 SYSTEMATIC REGISTRY: PULL MASTER PARAMETERS FROM ROW 1 CACHES
        $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
    
    $companyName = $corporateBranding->company_name ?? 'ORVELLA PHARMACY';
    $companyAddress = $corporateBranding->address ?? 'Bungoma Town CBD';
    $companyPhone = $corporateBranding->phone_number ?? '+254 700 123456';
    $companyEmail = $corporateBranding->company_email ?? 'chemists@zack.com';
    $logoPath = $corporateBranding->logo_path ?? null;

    // Build the structured report title text string based on presence of a logo path
    $report = "========================================================================\n";
    if ($logoPath) {
        $report .= "   BRAND FILE SIGNATURE VALIDATED: [storage/app/public/{$logoPath}]   \n";
    } else {
        $report .= "   " . strtoupper($companyName) . "   \n";
    }
    $report .= "   " . $companyAddress . "   \n";
    $report .= "   TEL: " . $companyPhone . " | EMAIL: " . $companyEmail . "   \n";
    $report .= "========================================================================\n\n";


        // Extract structural analytics summaries across all active stock layers
        $batches = Batch::with(['product', 'supplier'])
            ->where('quantity_remaining', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();

        $totalUniqueItems = Product::count();
        $totalStockValueCost = 0;
        $totalPotentialRevenue = 0;

        foreach ($batches as $batch) {
            $totalStockValueCost += ($batch->quantity_remaining * $batch->cost_price);
            $totalPotentialRevenue += ($batch->quantity_remaining * $batch->selling_price);
        }

        $projectedNetProfit = $totalPotentialRevenue - $totalStockValueCost;

        // Build out the structured document layout profile dynamically using company data strings
        $report = "========================================================================\n";
        $report .= "   " . strtoupper($companyName) . "   \n";
        $report .= "   " . $companyAddress . "   \n";
        $report .= "   TEL: " . $companyPhone . " | EMAIL: " . $companyEmail . "   \n";
        $report .= "========================================================================\n\n";
        
        $report .= "# PHARMACY ECOSYSTEM COMPLIANCE INVENTORY REPORT\n";
        $report .= "Generated On: " . now()->toFormattedDateString() . " | System Status: OPERATIONAL\n";
        $report .= "------------------------------------------------------------------------\n\n";
        
        $report .= "## 1. EXECUTIVE AUDITING SUMMARY\n";
        $report .= "* **Total Unique Formulations Indexed:** {$totalUniqueItems}\n";
        $report .= "* **Total Asset Cost Valuation basis:** KES " . number_format($totalStockValueCost, 2) . "\n";
        $report .= "* **Projected Gross Revenue Yield:** KES " . number_format($totalPotentialRevenue, 2) . "\n";
        $report .= "* **Estimated Net Inventory Margin:** KES " . number_format($projectedNetProfit, 2) . "\n\n";

        $report .= "## 2. DETAILED BATCH EXHAUSTION & STOCK LEDGER\n";
        $report .= "| Product Name | Batch Number | Remaining Qty | Cost Price | Retail Price | Expiration Date | Primary Supplier |\n";
        $report .= "| :--- | :--- | :---: | :---: | :---: | :--- | :--- |\n";

        foreach ($batches as $b) {
            $expiryStatus = $b->expiry_date->isPast() ? "EXPIRED" : $b->expiry_date->toFormattedDateString();
            $report .= "| {$b->product->name} | `{$b->batch_number}` | {$b->quantity_remaining} | KES " . number_format($b->cost_price, 2) . " | KES " . number_format($b->selling_price, 2) . " | {$expiryStatus} | " . ($b->supplier->name ?? 'Direct Sourced') . " |\n";
        }

        return response($report, 200)
            ->header('Content-Type', 'text/plain')
            ->header('Content-Disposition', 'attachment; filename="inventory_report_' . now()->format('Y_m_d') . '.md"');
    }



    /**
     * Render a high-contrast inline SVG barcode for a specific Product SKU.
    */
    public function streamProductBarcode($sku)
    {
        $generator = new \Picqer\Barcode\BarcodeGeneratorSVG();
    
        // Generate Code 128 barcode (Width: 2px per bar, Height: 40px)
        $svgRaw = $generator->getBarcode($sku, $generator::TYPE_CODE_128, 2, 40);

        return response($svgRaw, 200)->header('Content-Type', 'image/svg+xml');
    }

    /**
     * Store a newly created product formulation in the registry database.
     */
    /*blic function addNewProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|unique:products,sku|max:100',
            'generic_name' => 'required|string|max:255',
            'reorder_level' => 'required|integer|min:1',
            'requires_prescription' => 'required|boolean',
        ]);

        \App\Models\Product::create($validated);

        return response()->json(['success' => true, 'message' => 'Product formulation successfully registered.']);
    }*/

    /**
     * Store a newly created product formulation in the registry database.
     */
    public function addNewProduct(Request $request)
    {
        $validated = $request->validate([
            'name'                  => 'required|string|max:255',
            'generic_name'          => 'required|string|max:255',
            'category'              => 'required|string|in:Tablet,Syrup,Capsule,Cream,Lotion,Powder,Injectable',
            'reorder_level'         => 'required|integer|min:1',
            'requires_prescription' => 'required|boolean',
        ]);

        \App\Models\Product::create($validated);

        return response()->json(['success' => true, 'message' => 'Product formulation successfully registered.']);
    }


    /**
     * Inject a fresh active inventory batch stock layer tracking vector.
     */
    public function addNewBatch(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'batch_number' => 'required|string|max:100',
            'quantity_received' => 'required|integer|min:1',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|gt:cost_price',
            'expiry_date' => 'required|date|after:today',
        ]);

        // Automatically mirror total received units into remaining balances on entry
        $validated['quantity_remaining'] = $validated['quantity_received'];

        \App\Models\Batch::create($validated);

        return response()->json(['success' => true, 'message' => 'Fresh inventory batch lot layer provisioned successfully.']);
    }

        /**
     * Register a fresh wholesale distributor profile in the tracking index.
     */
    public function addNewSupplier(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        \App\Models\Supplier::create($validated);

        return response()->json(['success' => true, 'message' => 'Wholesale distributor successfully catalogued.']);
    }

    /**
     * Map an authoritative many-to-many procurement connection link via pivot tables.
     */
    public function linkProductToVendor(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'contract_cost_price' => 'nullable|numeric|min:0',
        ]);

        $supplier = \App\Models\Supplier::find($validated['supplier_id']);
        
        // Attach the entry to the database pivot index, skipping if relation already exists
        $supplier->products()->syncWithoutDetaching([
            $validated['product_id'] => ['contract_cost_price' => $validated['contract_cost_price']]
        ]);

        return response()->json(['success' => true, 'message' => 'Medication lines successfully mapped to wholesaler portfolio.']);
    }

    /**
     * Add a fresh patient file profile to the medical registry.
     */
    /*public function addNewPatient(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:100',
            'patient_number' => 'required|string|unique:patients,patient_number|max:100',
        ]);

        \App\Models\Patient::create($validated);

        return response()->json(['success' => true, 'message' => 'Patient record created successfully.']);
    }*/

    /**
     * Raise and issue an active clinical prescription script order against a patient file.
     */
    /*public function addNewPrescription(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'prescription_number' => 'required|string|unique:prescriptions,prescription_number|max:100',
            'doctor_name' => 'required|string|max:255',
            'date_issued' => 'required|date',
        ]);

        $validated['status'] = 'Active'; // Enforce active workflow routing on entry

        \App\Models\Prescription::create($validated);

        return response()->json(['success' => true, 'message' => 'Clinical prescription script queued for POS billing.']);
    }*/


    /**
     * Raise and issue an active clinical prescription script order along with its first item.
     */
    /*public function addNewPrescription(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'prescription_number' => 'required|string|unique:prescriptions,prescription_number|max:100',
            'doctor_name' => 'required|string|max:255',
            'date_issued' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'quantity_ordered' => 'required|integer|min:1',
            'dosage_instructions' => 'required|string|max:255'
        ]);

        \Illuminate\Support\Facades\DB::transaction(function() use ($validated) {
            $prescription = \App\Models\Prescription::create([
                'patient_id' => $validated['patient_id'],
                'prescription_number' => $validated['prescription_number'],
                'doctor_name' => $validated['doctor_name'],
                'date_issued' => $validated['date_issued'],
                'status' => 'Active'
            ]);

            \App\Models\PrescriptionItem::create([
                'prescription_id' => $prescription->id,
                'product_id' => $validated['product_id'],
                'quantity_ordered' => $validated['quantity_ordered'],
                'dosage_instructions' => $validated['dosage_instructions']
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Clinical prescription script successfully queued for POS billing.']);
    }*/

    /**
     * Store a newly raised prescription supporting multi-item medications and file uploads.
     * Route Sourced: POST /api/prescriptions/store
     */
    /*public function addNewPrescription(Request $request)
    {
        // 1. Strict validation rules for the incoming multi-part payload structure
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'prescription_number' => 'required|string|max:50|unique:prescriptions,prescription_number',
            'doctor_name' => 'required|string|max:255',
            'date_issued' => 'required|date', // Validating incoming date parameter explicitly
            'is_external' => 'required|boolean',
            'attachment_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
            'medications' => 'required|array|min:1',
            'medications.*.product_id' => 'required|exists:products,id',
            'medications.*.quantity_ordered' => 'required|integer|min:1',
            'medications.*.dosage_instructions' => 'required|string|max:255',
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $attachmentPath = null;

            // 2. Process file attachment upload if marked external and file is present
            if ($request->hasFile('attachment_file') && $request->is_external) {
                $file = $request->file('attachment_file');
                $attachmentPath = $file->store('external_scripts', 'public');
            }

            // 3. FIXED: Injected missing date_issued value into primary record database creation map
            $prescription = \App\Models\Prescription::create([
                'patient_id' => $request->patient_id,
                'prescription_number' => strtoupper(trim($request->prescription_number)),
                'doctor_name' => trim($request->doctor_name),
                'date_issued' => $request->date_issued, // <-- ADDED TO CRUSH POSTGRES NOT-NULL CONSTRAINT ERROR
                'status' => 'Active', 
                'external_attachment_path' => $attachmentPath,
            ]);

            // 4. Loop and dynamically attach medication lines
            foreach ($request->medications as $med) {
                \App\Models\PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'product_id' => $med['product_id'],
                    'quantity_ordered' => $med['quantity_ordered'],
                    'dosage_instructions' => trim($med['dosage_instructions']),
                ]);
            }
    });

        // 5. FIXED: Swapped response()->json to an authorized back() route redirect to satisfy Inertia bounds
        return redirect()->back();
    }*/

    /**
     * Render a clean browser-printable blueprint view for an individual prescription file.
     * Route Sourced: GET /api/prescriptions/{id}/print
     */
    /*public function printSinglePrescription($id)
    {
        // Fetch script file, eagerly loading multi-item relational tables
        $prescription = \App\Models\Prescription::with(['patient', 'items.product'])->findOrFail($id);

        // Serve a dedicated lightweight print document layout template file
        return view('exports.single_prescription_print', compact('prescription'));
    }*/

    
    
    /**
     * Store a newly enrolled patient record and auto-format sequential Chart IDs.
     * Route Sourced: POST /api/patients/store
     */
    public function addNewPatient(Request $request)
    {
        $validatedData = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            // patient_number is now optional since it is generated automatically
            'patient_number' => 'nullable|string|max:50|unique:patients,patient_number',
        ]);

        return DB::transaction(function () use ($validatedData) {
            if (empty($validatedData['patient_number'])) {
                $currentYear = now()->format('Y'); 
                $prefix = "PAT-" . $currentYear . "-";

                // Scan for the max numeric suffix matching our active annual calendar cycle pattern
                $latestPatient = \App\Models\Patient::where('patient_number', 'LIKE', "{$prefix}%")
                    ->orderBy('patient_number', 'desc')
                    ->lockForUpdate() 
                    ->first();

                if ($latestPatient) {
                    $lastSequenceNumber = (int) substr($latestPatient->patient_number, strlen($prefix));
                    $nextSequenceNumber = $lastSequenceNumber + 1;
                } else {
                    $nextSequenceNumber = 1; 
                }

                $validatedData['patient_number'] = $prefix . str_pad($nextSequenceNumber, 4, '0', STR_PAD_LEFT);
            }

            $patient = \App\Models\Patient::create([
                'name'           => trim($validatedData['name']),
                'phone'          => trim($validatedData['phone']),
                'patient_number' => $validatedData['patient_number']
            ]);

            return response()->json([
                'success' => true,
                'message' => "Patient profile [{$patient->name}] enrolled successfully with System Code: {$patient->patient_number}",
                'patient' => $patient
            ], 201);
        });
    }

    /**
     * Store a newly raised prescription supporting multi-item medications and auto-generated unique script codes.
     * Route Sourced: POST /api/prescriptions/store
     */
    public function addNewPrescription(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            // prescription_number is now optional since it is generated automatically
            'prescription_number' => 'nullable|string|max:50|unique:prescriptions,prescription_number',
            'doctor_name' => 'required|string|max:255',
            'date_issued' => 'required|date', 
            'is_external' => 'required|boolean',
            'attachment_file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
            'medications' => 'required|array|min:1',
            'medications.*.product_id' => 'required|exists:products,id',
            'medications.*.quantity_ordered' => 'required|integer|min:1',
            'medications.*.dosage_instructions' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($request) {
            $attachmentPath = null;
            $prescriptionNumber = $request->prescription_number;

            if (empty($prescriptionNumber)) {
                $currentYear = now()->format('Y');
                $prefix = "RX-" . $currentYear . "-";

                // Scan for the max numeric suffix matching our active calendar cycle pattern
                $latestScript = \App\Models\Prescription::where('prescription_number', 'LIKE', "{$prefix}%")
                    ->orderBy('prescription_number', 'desc')
                    ->lockForUpdate()
                    ->first();

                if ($latestScript) {
                    $lastSequenceNumber = (int) substr($latestScript->prescription_number, strlen($prefix));
                    $nextSequenceNumber = $lastSequenceNumber + 1;
                } else {
                    $nextSequenceNumber = 1;
                }

                $prescriptionNumber = $prefix . str_pad($nextSequenceNumber, 4, '0', STR_PAD_LEFT);
            }

            if ($request->hasFile('attachment_file') && $request->is_external) {
                $file = $request->file('attachment_file');
                $attachmentPath = $file->store('external_scripts', 'public');
            }

            $prescription = \App\Models\Prescription::create([
                'patient_id' => $request->patient_id,
                'prescription_number' => strtoupper(trim($prescriptionNumber)),
                'doctor_name' => trim($request->doctor_name),
                'date_issued' => $request->date_issued, 
                'status' => 'Active', 
                'external_attachment_path' => $attachmentPath,
            ]);

            foreach ($request->medications as $med) {
                \App\Models\PrescriptionItem::create([
                    'prescription_id' => $prescription->id,
                    'product_id' => $med['product_id'],
                    'quantity_ordered' => $med['quantity_ordered'],
                    'dosage_instructions' => trim($med['dosage_instructions']),
                ]);
            }
        });

        return redirect()->back();
    }


    /**
     * Render a clean browser-printable blueprint view for an individual prescription file.
     * Route Sourced: GET /api/prescriptions/{id}/print
     */
    public function printSinglePrescription($id)
    {
        // 1. Fetch dynamic corporate layout settings variables from Row #1
        $corporateBranding = DB::table('system_settings')->where('id', 1)->first();

        // 2. Fetch script file, eagerly loading multi-item relational tables
        $prescription = \App\Models\Prescription::with(['patient', 'items.product'])->findOrFail($id);

        // 3. Pass branding options directly into the template variables array map
        return view('exports.single_prescription_print', compact('prescription', 'corporateBranding'));
    }




    /**
     * Stream an Excel-compatible CSV list download of your total pharmacy catalog assets.
     */
    public function exportCatalogCsv()
    {
        $products = \App\Models\Product::with('batches')->get();
        $fileName = 'pharmacy_catalog_export_' . now()->format('Y_m_d') . '.csv';

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($products) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Product ID', 'Medication Name', 'SKU Barcode', 'Generic Name', 'Safety Reorder Level', 'Requires Prescription (Rx)', 'Total Live Stock Balance']);

            foreach ($products as $p) {
                fputcsv($file, [
                    $p->id,
                    $p->name,
                    $p->sku,
                    $p->generic_name,
                    $p->reorder_level,
                    $p->requires_prescription ? 'Yes' : 'No',
                    $p->batches->sum('quantity_remaining')
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Atomically adjust a batch lot layer balance and document the reason in logs.
     */
    public function adjustBatchStock(Request $request)
    {
        /*$validated = $request->validate([
            'batch_id' => 'required|exists:batches,id',
            'quantity_delta' => 'required|integer', // negative for damages/shrinkage, positive for corrections
            'type' => 'required|in:Damaged,Expired,Reconciliation,Correction',
            'reason' => 'required|string|max:255'
        ]);*/

        $validated = $request->validate([
            'batch_id'       => 'required|integer|exists:batches,id', // Validates integer casting safely
            'quantity_delta' => 'required|integer', 
            'type'           => 'required|in:Damaged,Expired,Reconciliation,Correction',
            'reason'         => 'required|string|max:255'
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $batch = \App\Models\Batch::findOrFail($validated['batch_id']);
            
            // Protect against negative inventory levels
            if ($batch->quantity_remaining + $validated['quantity_delta'] < 0) {
                throw new \Exception("Adjustment Aborted: Action results in negative batch quantities.");
            }

            $batch->quantity_remaining += $validated['quantity_delta'];
            $batch->save();

            \App\Models\StockAdjustment::create([
                'batch_id' => $validated['batch_id'],
                'user_id' => auth()->id() ?? 1,
                'quantity_delta' => $validated['quantity_delta'],
                'type' => $validated['type'],
                'reason' => $validated['reason']
            ]);
        });

        return response()->json(['success' => true, 'message' => 'Stock parameters adjusted and logged successfully.']);
    }

    /**
     * Extract a complete history log audit trail for a product's movement.
     */
    /*public function getProductMovementLogs($id)
    {
        $product = \App\Models\Product::findOrFail($id);

        // 1. Fetch all Inbound Ingestions (Purchases/Batches created)
        $inbound = \App\Models\Batch::where('product_id', $id)
            ->select('created_at', 'batch_number', 'quantity_received as qty', \Illuminate\Support\Facades\DB::raw("'Inbound Purchase' as type"), 'cost_price as description')
            ->get();

        // 2. Fetch all Outbound Dispensing actions
        $outbound = \Illuminate\Support\Facades\DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->where('sales_items.product_id', $id)
            ->select('sales.created_at', 'batches.batch_number', 'sales_items.quantity as qty', \Illuminate\Support\Facades\DB::raw("'POS Dispensed' as type"), 'sales.invoice_number as description')
            ->get();

        // 3. Fetch all Adjustments (Damages, write-offs)
        $adjustments = \App\Models\StockAdjustment::join('batches', 'batches.id', '=', 'stock_adjustments.batch_id')
            ->where('batches.product_id', $id)
            ->select('stock_adjustments.created_at', 'batches.batch_number', 'stock_adjustments.quantity_delta as qty', \Illuminate\Support\Facades\DB::raw("stock_adjustments.type as type"), 'stock_adjustments.reason as description')
            ->get();

        // Merge, sort, and output as a singular chronological flow ledger
        $history = $inbound->concat($outbound)->concat($adjustments)->sortByDesc('created_at')->values();

        return response()->json([
            'product' => $product->name,
            'movement_ledger' => $history
        ]);
    }*/


    /**
     * Store a newly enrolled patient record and auto-format sequential Chart IDs.
     * Route Sourced: POST /api/patients/store
     */
    /*public function addNewPatient(Request $request)
    {
        // 1. Enforce strict structural data validations
        $validatedData = $request->validate([
            'name'           => 'required|string|max:255',
            'phone'          => 'required|string|max:20',
            'patient_number' => 'nullable|string|max:50|unique:patients,patient_number',
        ], [
            'patient_number.unique' => 'Compliance Warning: This custom Chart ID reference code is already allocated.',
        ]);

        // 2. Wrap writes inside a database transaction lock to avoid concurrent race conditions
        return \Illuminate\Support\Facades\DB::transaction(function () use ($validatedData) {
            
            // If the user did not manually type a custom reference ID, auto-generate a structured code
            if (empty($validatedData['patient_number'])) {
                $currentYear = now()->format('Y'); // Sourced dynamic current runtime calendar year (2026)
                $prefix = "PAT-" . $currentYear . "-";

                // Scan for the absolute maximum numeric suffix matching our active calendar cycle prefix pattern
                $latestPatient = \App\Models\Patient::where('patient_number', 'LIKE', "{$prefix}%")
                    ->orderBy('patient_number', 'desc')
                    ->lockForUpdate() // Lock matching records to prevent duplicate generation rows
                    ->first();

                if ($latestPatient) {
                    // Extract the final numeric fragment (e.g., pulling "0014" out of "PAT-2026-0014")
                    $lastSequenceNumber = (int) substr($latestPatient->patient_number, strlen($prefix));
                    $nextSequenceNumber = $lastSequenceNumber + 1;
                } else {
                    $nextSequenceNumber = 1; // Default fallback index anchor if starting a fresh annual registry pool
                }

                // Format sequence with leading padding zeros up to 4 places digits (e.g., "0001", "0042")
                $validatedData['patient_number'] = $prefix . str_pad($nextSequenceNumber, 4, '0', STR_PAD_LEFT);
            } else {
                // Sanitize and normalize manually entered references to a standard high-contrast capital string
                $validatedData['patient_number'] = strtoupper(trim($validatedData['patient_number']));
            }

                        // 3. Insert and persist row inside your PostgreSQL table layout
            $patient = \App\Models\Patient::create([
                'name'           => trim($validatedData['name']),
                'phone'          => trim($validatedData['phone']),
                'patient_number' => $validatedData['patient_number']
            ]);

            // 4. Return complete status payload back to React / Inertia axios callback
            return response()->json([
                'success' => true,
                'message' => "Patient profile [{$patient->name}] enrolled successfully with System Code: {$patient->patient_number}",
                'patient' => $patient
            ], 201);
        });
    }*/

    /**
     * Display the master-detail patient dashboard ledger with advanced date filters.
     */
    public function showPatientConsole(Request $request)
    {
        $search = $request->get('search_name');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // 1. Master directory query with drilled history date filters
        $patientQuery = \App\Models\Patient::with(['prescriptions' => function ($query) use ($startDate, $endDate) {
            if (!empty($startDate)) {
                $query->whereDate('date_issued', '>=', $startDate);
            }
            if (!empty($endDate)) {
                $query->whereDate('date_issued', '<=', $endDate);
            }
            $query->orderBy('date_issued', 'desc');
        }]);

        if (!empty($search)) {
            $patientQuery->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('patient_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('prescriptions', function($subQ) use ($search) {
                      $subQ->where('prescription_number', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // 2. Operational pipeline widget (Latest 5 global prescription rows)
        $latestPrescriptions = \App\Models\Prescription::with('patient')
            ->latest()
            ->take(5)
            ->get();

        $products = \App\Models\Product::select('id', 'name', 'sku')->get();

        return \Inertia\Inertia::render('Patients/PatientConsole', [
            'patients' => $patientQuery->get(),
            'products' => $products,
            'latestPrescriptions' => $latestPrescriptions,
            'filters' => $request->only(['search_name', 'start_date', 'end_date'])
        ]);
    }
    /**
     * Export streaming channel handling both CSV/Excel and clear raw formatting.
     * Route Sourced: GET /api/prescriptions/export
     */
    public function exportPrescriptionsData(Request $request)
    {
        $format = $request->get('format', 'excel');
        $search = $request->get('search_name');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Build base query eagerly loading relationships to minimize footprint
        $query = \App\Models\Prescription::with(['patient', 'items.product']);
        
        // Apply active filtering bounds matching active user parameters
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('prescription_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('patient', function($pq) use ($search) {
                      $pq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }
        
        if (!empty($startDate)) {
            $query->whereDate('date_issued', '>=', $startDate);
        }
        
        if (!empty($endDate)) {
            $query->whereDate('date_issued', '<=', $endDate);
        }
        
        $data = $query->orderBy('date_issued', 'desc')->get();

        // Branch 1: PDF Layout Render Route
        if ($format === 'pdf') {
            // Returns a clean, browser-printable window view stream
            return view('exports.prescriptions_pdf', compact('data'));
        }

        // Branch 2: High-Velocity Excel/CSV Direct Memory Stream
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=prescriptions_pipeline_report_" . now()->format('Ymd_His') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($data) {
            $file = fopen('php://output', 'w');
            
            // Inject compliance auditing headers
            fputcsv($file, ['Script Reference', 'Patient Reference', 'Chart Number', 'Prescribing Practitioner', 'Status', 'Date Sourced']);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->prescription_number,
                    $row->patient ? $row->patient->name : 'Walk-In Account',
                    $row->patient ? $row->patient->patient_number : 'N/A',
                    $row->doctor_name,
                    $row->status,
                    $row->date_issued
                ]);
            }
            fclose($file);
        };

        return \Illuminate\Support\Facades\Response::stream($callback, 200, $headers);
    }


        /**
     * Extract a complete history log audit trail for a product's movement.
     * Route Sourced: GET /api/products/{id}/movement
     */
    public function getProductMovementLogs($id)
    {
        $product = \App\Models\Product::findOrFail($id);

        // 1. Fetch Inbound Ingestions (Convert timestamps to formal ISO-compatible strings)
        $inbound = \App\Models\Batch::where('product_id', $id)
            ->select('created_at', 'batch_number', 'quantity_received as qty', \Illuminate\Support\Facades\DB::raw("'Inbound Purchase' as type"), 'cost_price as description')
            ->get()
            ->map(function ($item) {
                $item->created_at_iso = $item->created_at->toIso8601String();
                return $item;
            });

        // 2. Fetch Outbound Dispensing actions
        $outbound = \Illuminate\Support\Facades\DB::table('sales_items')
            ->join('sales', 'sales.id', '=', 'sales_items.sale_id')
            ->join('batches', 'batches.id', '=', 'sales_items.batch_id')
            ->where('sales_items.product_id', $id)
            ->select('sales.created_at', 'batches.batch_number', 'sales_items.quantity as qty', \Illuminate\Support\Facades\DB::raw("'POS Dispensed' as type"), 'sales.invoice_number as description')
            ->get()
            ->map(function ($item) {
                $item->created_at_iso = \Carbon\Carbon::parse($item->created_at)->toIso8601String();
                // Normalize outbound values into distinct negative parameters
                $item->qty = -(int)$item->qty; 
                return $item;
            });

        // 3. Fetch Adjustments (Damages, corrections)
        $adjustments = \App\Models\StockAdjustment::join('batches', 'batches.id', '=', 'stock_adjustments.batch_id')
            ->where('batches.product_id', $id)
            ->select('stock_adjustments.created_at', 'batches.batch_number', 'stock_adjustments.quantity_delta as qty', \Illuminate\Support\Facades\DB::raw("stock_adjustments.type as type"), 'stock_adjustments.reason as description')
            ->get()
            ->map(function ($item) {
                $item->created_at_iso = \Carbon\Carbon::parse($item->created_at)->toIso8601String();
                return $item;
            });

        // Merge and sort chronologically by absolute modern logs first
        $history = $inbound->concat($outbound)->concat($adjustments)->sortByDesc('created_at_iso')->values();

        return response()->json([
            'product' => $product->name,
            'movement_ledger' => $history
        ]);
    }

    /**
     * Update an existing product profile formulation.
     * Route Sourced: POST /api/products/update
     */
    public function updateProductProfile(Request $request)
    {
        $validated = $request->validate([
            'product_id'    => 'required|exists:products,id',
            'name'          => 'required|string|max:255',
            'generic_name'  => 'required|string|max:255',
            'reorder_level' => 'required|integer|min:1',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);
        $product->update([
            'name'          => trim($validated['name']),
            'generic_name'  => trim($validated['generic_name']),
            'reorder_level' => $validated['reorder_level'],
        ]);

        return response()->json(['success' => true, 'message' => 'Medication formulary profile updated successfully.']);
    }



    
public function streamCatalogPdfManifest(Request $request)
{
    $search = $request->get('search');
    
    $query = \App\Models\Product::select('id', 'name', 'sku', 'generic_name', 'requires_prescription')
        ->selectSub(function ($query) {
            $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                ->from('batches')
                ->whereColumn('batches.product_id', 'products.id');
        }, 'stock');

    if (!empty($search)) {
        $query->where('name', 'ILIKE', "%{$search}%")->orWhere('sku', 'LIKE', "%{$search}%");
    }

    $products = $query->orderBy('name', 'asc')->get();
    $corporateBranding = DB::table('system_settings')->where('id', 1)->first();

    return view('exports.catalog_manifest_pdf', compact('products', 'corporateBranding'));
}



}
