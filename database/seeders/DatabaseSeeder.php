<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Batch;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a Base Application System User
        User::factory()->create([
            'name' => 'Dr. Zach Admin',
            'email' => 'admin@pharmacy.com',
            'password' => bcrypt('SecurePass123!'),
            'role' => 'admin',
        ]);

        // Create a Compliance Clinical Pharmacist
        User::factory()->create([
            'name' => 'Mary Mwangi (Pharmacist)',
            'email' => 'pharmacist@pharmacy.com',
            'password' => bcrypt('SecurePass123!'),
            'role' => 'pharmacist',
        ]);

        // Create a Front-line Checkout Cashier
        User::factory()->create([
            'name' => 'John Wafula (Cashier)',
            'email' => 'cashier@pharmacy.com',
            'password' => bcrypt('SecurePass123!'),
            'role' => 'cashier',
        ]);


        // 2. Scaffold a Global Pharma Wholesaler Supplier
        $supplier = Supplier::create([
            'name' => 'AstraPharma Distribution Ltd',
            'contact_person' => 'Jane Koech',
            'phone' => '+254711223344',
            'email' => 'orders@astrapharma.co.ke',
            'address' => 'Mombasa Road, Nairobi, Kenya',
        ]);

        // 3. Product A: Amoxicillin Capsule (Simulating a Low Stock Trigger)
        $amox = Product::create([
            'name' => 'Amoxicillin 500mg',
            'sku' => '6001234567891',
            'generic_name' => 'Amoxicillin Trihydrate',
            'reorder_level' => 50,
            'requires_prescription' => true,
        ]);

        // Batch 1 for Amoxicillin: Long life expiry but critical low balance (Only 5 left!)
        Batch::create([
            'product_id' => $amox->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'AMX-2026-001',
            'quantity_received' => 500,
            'quantity_remaining' => 5, 
            'cost_price' => 1.20,
            'selling_price' => 2.50,
            'expiry_date' => now()->addMonths(18),
        ]);

        // 4. Product B: Paracetamol Tablets (Simulating an Approaching Expiry Trigger)
        $para = Product::create([
            'name' => 'Paracetamol 500mg (Panadol)',
            'sku' => '6009876543210',
            'generic_name' => 'Acetaminophen',
            'reorder_level' => 100,
            'requires_prescription' => false,
        ]);

        // Batch 1 for Paracetamol: High remaining stock but expiring very soon (Within 30 days)
        Batch::create([
            'product_id' => $para->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'PAR-2026-EXP9',
            'quantity_received' => 1000,
            'quantity_remaining' => 850,
            'cost_price' => 0.15,
            'selling_price' => 0.50,
            'expiry_date' => now()->addDays(25), 
        ]);

        // Batch 2 for Paracetamol: Safe buffer stock expiring next year
        Batch::create([
            'product_id' => $para->id,
            'supplier_id' => $supplier->id,
            'batch_number' => 'PAR-2027-SAFE',
            'quantity_received' => 2000,
            'quantity_remaining' => 2000,
            'cost_price' => 0.15,
            'selling_price' => 0.50,
            'expiry_date' => now()->addMonths(14),
        ]);

                // --- ADD PERMANENT TEST PATIENTS REGISTER ---
        $patient = \App\Models\Patient::create([
            'name' => 'John Doe',
            'patient_number' => 'PAT-9988',
            'phone' => '+254700112233',
        ]);

        // Connect a fresh active medical prescription script to this specific patient record
        \App\Models\Prescription::create([
            'patient_id' => $patient->id,
            'prescription_number' => 'RX-AMX-007',
            'doctor_name' => 'Dr. Elizabeth Rodgers',
            'date_issued' => now(),
            'status' => 'Active',
        ]);

    }
}
