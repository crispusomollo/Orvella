<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PharmacyEcosystemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Clearing old session residues...');
        
        // 1. SEED AUTONOMOUS WHITE-LABEL CORPORATE BRANDING DEFAULTS (ROW #1 ANCHOR)
        DB::table('system_settings')->updateOrInsert(
            ['id' => 1],
            [
                'company_name'        => 'Orvellae Healthcare Chemists',
                'company_email'       => 'dispensary@orvellae.co.ke',
                'phone_number'        => '+254 700 123456',
                'address'             => 'Kenyatta Avenue Medical Plaza, Block B',
                'currency_code'       => 'KES',
                'receipt_footer_text' => '*** Preserving Health, Restoring Vitality ***',
                'primary_color_hex'   => '#4f46e5',
                'logo_path'           => null,
                'created_at'          => now(),
                'updated_at'          => now()
            ]
        );

        // 2. SEED AUTHORITATIVE WHOLESALE DISTRIBUTORS (SUPPLIERS)
        $suppliers = [
            ['id' => 1, 'name' => 'Medisource East Africa Ltd', 'contact_person' => 'Dr. Evans Mwangi', 'phone' => '+254711000111', 'email' => 'orders@medisource.co.ke', 'address' => 'Industrial Area, Nairobi'],
            ['id' => 2, 'name' => 'Beta Healthcare Distributors', 'contact_person' => 'Sarah Jenkins', 'phone' => '+254722000222', 'email' => 'supply@betahealth.com', 'address' => 'Mombasa Road, Nairobi'],
            ['id' => 3, 'name' => 'Harleys Pharmaceutical Wholesalers', 'contact_person' => 'Nitin Patel', 'phone' => '+254733000333', 'email' => 'sales@harleys.co.ke', 'address' => 'Westlands, Nairobi']
        ];

        foreach ($suppliers as $sup) {
            DB::table('suppliers')->updateOrInsert(['id' => $sup['id']], array_merge($sup, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 3. SEED THE MEDICATION FORMULARY CATALOG (PRODUCTS WITH SKUS)
        $products = [
            ['id' => 1, 'name' => 'Amoxicillin 500mg Capsules', 'sku' => 'AMX-CAP-8842', 'generic_name' => 'Amoxicillin Trihydrate', 'category' => 'Capsule', 'reorder_level' => 150, 'requires_prescription' => true, 'is_controlled' => false],
            ['id' => 2, 'name' => 'Panadol Extra Tablets', 'sku' => 'PAN-TAB-0012', 'generic_name' => 'Paracetamol + Caffeine', 'category' => 'Tablet', 'reorder_level' => 300, 'requires_prescription' => false, 'is_controlled' => false],
            ['id' => 3, 'name' => 'Augmentin 625mg Tablets', 'sku' => 'AUG-TAB-4921', 'generic_name' => 'Amoxicillin + Clavulanic Acid', 'category' => 'Tablet', 'reorder_level' => 50, 'requires_prescription' => true, 'is_controlled' => false],
            ['id' => 4, 'name' => 'Benylin 4-Flu Oral Syrup', 'sku' => 'BEN-SYR-9102', 'generic_name' => 'Diphenhydramine HCl', 'category' => 'Syrup', 'reorder_level' => 40, 'requires_prescription' => false, 'is_controlled' => false],
            ['id' => 5, 'name' => 'Rocephin 1g Injection', 'sku' => 'ROC-INJ-1150', 'generic_name' => 'Ceftriaxone Sodium', 'category' => 'Injectable', 'reorder_level' => 25, 'requires_prescription' => true, 'is_controlled' => false],
            ['id' => 6, 'name' => 'Xanax 0.5mg Tablets', 'sku' => 'XAN-TAB-7731', 'generic_name' => 'Alprazolam', 'category' => 'Tablet', 'reorder_level' => 20, 'requires_prescription' => true, 'is_controlled' => true] // Regulated Substance
        ];

        foreach ($products as $prod) {
            DB::table('products')->updateOrInsert(['id' => $prod['id']], array_merge($prod, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 4. SEED INWARD BATCH LOT LAYERS & ACCOUNTS PAYABLE LIABILITIES
        $batches = [
            ['id' => 1, 'product_id' => 1, 'supplier_id' => 1, 'batch_number' => 'AMX-2601', 'quantity_received' => 500, 'quantity_remaining' => 420, 'cost_price' => 4.50, 'selling_price' => 10.00, 'expiry_date' => Carbon::now()->addDays(400)],
            ['id' => 2, 'product_id' => 2, 'supplier_id' => 2, 'batch_number' => 'PAN-2699', 'quantity_received' => 2000, 'quantity_remaining' => 1850, 'cost_price' => 1.10, 'selling_price' => 4.00, 'expiry_date' => Carbon::now()->addDays(600)],
            // Near Expiry Trigger Lot (Expires inside 25 Days window)
            ['id' => 3, 'product_id' => 4, 'supplier_id' => 2, 'batch_number' => 'BEN-F04', 'quantity_received' => 100, 'quantity_remaining' => 12, 'cost_price' => 140.00, 'selling_price' => 250.00, 'expiry_date' => Carbon::now()->addDays(25)],
            // Critical Reorder Alert Trigger Lot (Remaining units are below product threshold)
            ['id' => 4, 'product_id' => 5, 'supplier_id' => 3, 'batch_number' => 'ROC-V22', 'quantity_received' => 50, 'quantity_remaining' => 8, 'cost_price' => 320.00, 'selling_price' => 550.00, 'expiry_date' => Carbon::now()->addDays(180)]
        ];

        foreach ($batches as $b) {
            DB::table('batches')->updateOrInsert(['id' => $b['id']], array_merge($b, ['created_at' => now(), 'updated_at' => now()]));
        }

        // Seed Supplier Payables Initial Ledger Traces
        DB::table('supplier_ledgers')->updateOrInsert(
            ['id' => 1],
            [
                'supplier_id'      => 1,
                'transaction_type' => 'CONSIGNMENT_INTAKE',
                'reference_number' => 'INITIAL-SEED-PO',
                'debit'            => 0.00,
                'credit'           => 2250.00,
                'running_balance'  => 2250.00,
                'due_date'         => Carbon::now()->addDays(30)->format('Y-m-d'),
                'created_at'       => now(),
                'updated_at'       => now()
            ]
        );

        // 5. SEED PATIENT MEDICAL FILES PROFILE CONSOLE
        $patients = [
            ['id' => 1, 'name' => 'Patient Zero (Walk-In)', 'phone' => '+254700000000', 'patient_number' => 'PAT-2026-0001'],
            ['id' => 2, 'name' => 'Emmanuel Kipchumba', 'phone' => '+254715999888', 'patient_number' => 'PAT-2026-0002'],
            ['id' => 3, 'name' => 'Grace Atieno Ochieng', 'phone' => '+254721444555', 'patient_number' => 'PAT-2026-0003']
        ];

        foreach ($patients as $pat) {
            DB::table('patients')->updateOrInsert(['id' => $pat['id']], array_merge($pat, ['created_at' => now(), 'updated_at' => now()]));
        }

        // 6. SEED CLINICAL PRESCRIPTION ROUTING QUEUES
        DB::table('prescriptions')->updateOrInsert(
            ['id' => 1],
            [
                'patient_id'          => 2,
                'prescription_number' => 'RX-2026-0001',
                'doctor_name'         => 'Dr. Majani',
                'date_issued'         => Carbon::now()->format('Y-m-d'),
                'status'              => 'Active', // Appears inside POS Cart ribbon panel
                'created_at'          => now(),
                'updated_at'          => now()
            ]
        );

        DB::table('prescription_items')->updateOrInsert(
            ['id' => 1],
            [
                'prescription_id'     => 1,
                'product_id'          => 3, // Augmentin
                'quantity_ordered'    => 14,
                'dosage_instructions' => '1 Tab BID (Twice Daily) for 7 days',
                'created_at'          => now(),
                'updated_at'          => now()
            ]
        );

        $this->command->info('✨ Pharmacy ecosystem seeding metrics generated successfully!');
    }
}
