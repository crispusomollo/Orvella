<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Services\ActivityLogger;

class DataMigrationHubController extends Controller
{
    /**
     * Render the centralized hub management console workspace.
     */
    public function index()
    {
        // Restrict usage strictly to administrators
        if (auth()->user()->role !== 'admin') {
            abort(403, 'Unauthorized Operation: Administrative Access Required.');
        }

        return Inertia::render('Admin/DataMigrationHub');
    }

    /**
     * Process bulk parsing vectors with transactional safety locks.
     */
    public function executeImport(Request $request)
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Clearance level error.'], 403);
        }

        $request->validate([
            'import_type' => 'required|in:users,patients,products,suppliers',
            'csv_file'    => 'required|file|mimes:csv,txt|max:4096'
        ]);

        $type = $request->import_type;
        $file = $request->file('csv_file');
        $rows = array_map('str_getcsv', file($file->getRealPath()));

        if (count($rows) <= 1) {
            return response()->json(['success' => false, 'message' => 'The uploaded data sheet contains no records.'], 422);
        }

        // Sanitize header row keys
        $headers = array_map('trim', $rows[0]);
        $headerMap = array_flip($headers);
        $importedCount = 0;

        DB::beginTransaction();
        try {
            for ($i = 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                if (count($row) < count($headers) || empty(trim($row[0]))) continue;

                switch ($type) {
                    case 'users':
                        $this->importUserRow($row, $headerMap);
                        break;
                    case 'patients':
                        $this->importPatientRow($row, $headerMap);
                        break;
                    case 'products':
                        $this->importProductRow($row, $headerMap);
                        break;
                    case 'suppliers':
                        $this->importSupplierRow($row, $headerMap);
                        break;
                }
                $importedCount++;
            }

            // Write into security logs registry
            ActivityLogger::log(
                'BULK_HUB_MIGRATION',
                "Executed centralized import workspace pipeline for system entity [{$type}], successfully parsing [{$importedCount}] records rows."
            );

            DB::commit();
            return response()->json(['success' => true, 'message' => "Migration complete: Processed [{$importedCount}] records cleanly into table layers."]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => "Transaction aborted due to mapping constraint failure: " . $e->getMessage()], 422);
        }
    }

    /*private function importUserRow($row, $map)
    {
        $email = strtolower(trim($row[$map['Email']]));
        
        DB::table('users')->updateOrInsert(
            ['email' => $email],
            [
                'name'              => trim($row[$map['Full Name']]),
                'role'              => strtolower(trim($map['Role'] ?? 'cashier')),
                'password'          => Hash::make(trim($row[$map['Default Password']] ?? 'SecurePass123!')),
                'email_verified_at' => now(),
                'created_at'        => now(),
                'updated_at'        => now()
            ]
        );
    }

    private function importPatientRow($row, $map)
    {
        $phone = trim($row[$map['Phone Number']]);
        
        // Auto-compute unique incremental chart reference code strings if omitted
        $patientNumber = isset($map['Patient Number']) ? trim($row[$map['Patient Number']]) : '';
        if (empty($patientNumber)) {
            $prefix = "PAT-" . now()->format('Y') . "-";
            $latestId = DB::table('patients')->max('id') ?? 0;
            $patientNumber = $prefix . str_pad($latestId + 1, 4, '0', STR_PAD_LEFT);
        }

        DB::table('patients')->insert([
            'name'           => trim($row[$map['Patient Name']]),
            'phone'          => $phone,
            'patient_number' => strtoupper($patientNumber),
            'created_at'     => now(),
            'updated_at'     => now()
        ]);
    }

    private function importProductRow($row, $map)
    {
        $name = trim($row[$map['Medication Name']]);
        $category = trim($row[$map['Form Category'] ?? 'Tablet']);

        // Format clean procedural barcode string keys automatically if skipped
        $skuPrefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));
        while (strlen($skuPrefix) < 3) $skuPrefix .= 'X';
        $catCode = strtoupper(substr($category, 0, 3));
        $generatedSku = "{$skuPrefix}-{$catCode}-" . strtoupper(Str::random(4));

        DB::table('products')->insert([
            'name'                  => $name,
            'sku'                   => $generatedSku,
            'generic_name'          => trim($row[$map['Generic Formulation']]),
            'category'              => in_array($category, ['Tablet','Syrup','Capsule','Cream','Lotion','Powder','Injectable']) ? $category : 'Tablet',
            'reorder_level'         => (int)($row[$map['Safety Reorder Level']] ?? 50),
            'requires_prescription' => filter_var(trim($row[$map['Requires Rx Script'] ?? 'false']), FILTER_VALIDATE_BOOLEAN),
            'created_at'            => now(),
            'updated_at'            => now()
        ]);
    }

    private function importSupplierRow($row, $map)
    {
        DB::table('suppliers')->insert([
            'name'           => trim($row[$map['Wholesaler Name']]),
            'contact_person' => trim($row[$map['Contact Person'] ?? 'N/A']),
            'phone'          => trim($row[$map['Telephone'] ?? 'N/A']),
            'email'          => strtolower(trim($row[$map['Email Address'] ?? 'N/A'])),
            'address'        => trim($row[$map['Physical Address'] ?? 'N/A']),
            'created_at'     => now(),
            'updated_at'     => now()
        ]);
    }*/

            private function importUserRow($row, $map)
    {
        $email = strtolower(trim($row[$map['Email']]));
        
        DB::table('users')->updateOrInsert(
            ['email' => $email],
            [
                'name'              => trim($row[$map['Full Name']]),
                'role'              => strtolower(trim($row[$map['Role']] ?? 'cashier')),
                'password'          => Hash::make(trim($row[$map['Default Password']] ?? 'SecurePass123!')),
                'email_verified_at' => now(),
                'created_at'        => now(),
                'updated_at'        => now()
            ]
        );
    }

    private function importPatientRow($row, $map)
    {
        $patientNumber = isset($map['Patient Number']) ? strtoupper(trim($row[$map['Patient Number']])) : '';
        
        if (empty($patientNumber)) {
            $prefix = "PAT-" . now()->format('Y') . "-";
            $latestId = DB::table('patients')->max('id') ?? 0;
            $patientNumber = $prefix . str_pad($latestId + 1, 4, '0', STR_PAD_LEFT);
        }

        // FIXED: Uses updateOrInsert targeting a unique alphanumeric tracker column index to drop duplicate sequence violations
        DB::table('patients')->updateOrInsert(
            ['patient_number' => $patientNumber],
            [
                'name'       => trim($row[$map['Patient Name']]),
                'phone'      => trim($row[$map['Phone Number']]),
                'created_at' => now(),
                'updated_at' => now()
            ]
        );
    }

    private function importProductRow($row, $map)
    {
        $name = trim($row[$map['Medication Name']]);
        
        // Check if item name exists to prevent duplicates
        $exists = DB::table('products')->where('name', $name)->exists();
        if ($exists) return;

        $category = trim($row[$map['Form Category']] ?? 'Tablet');
        $skuPrefix = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name), 0, 3));
        while (strlen($skuPrefix) < 3) $skuPrefix .= 'X';
        $catCode = strtoupper(substr($category, 0, 3));
        $generatedSku = "{$skuPrefix}-{$catCode}-" . strtoupper(Str::random(4));

        DB::table('products')->insert([
            'name'                  => $name,
            'sku'                   => $generatedSku,
            'generic_name'          => trim($row[$map['Generic Formulation']]),
            'category'              => in_array($category, ['Tablet','Syrup','Capsule','Cream','Lotion','Powder','Injectable']) ? $category : 'Tablet',
            'reorder_level'         => (int)($row[$map['Safety Reorder Level']] ?? 50),
            'requires_prescription' => filter_var(trim($row[$map['Requires Rx Script'] ?? 'false']), FILTER_VALIDATE_BOOLEAN),
            'created_at'            => now(),
            'updated_at'            => now()
        ]);
    }

    private function importSupplierRow($row, $map)
    {
        $name = trim($row[$map['Wholesaler Name']]);

        DB::table('suppliers')->updateOrInsert(
            ['name' => $name],
            [
                'contact_person' => trim($row[$map['Contact Person'] ?? 'N/A']),
                'phone'          => trim($row[$map['Telephone'] ?? 'N/A']),
                'email'          => strtolower(trim($row[$map['Email Address'] ?? 'N/A'])),
                'address'        => trim($row[$map['Physical Address'] ?? 'N/A']),
                'created_at'     => now(),
                'updated_at'     => now()
            ]
        );
    }

}

