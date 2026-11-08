<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;

class SystemHardReset extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:hard-reset';

    /**
     * The console command description.
     */
    protected $description = 'Wipe all operational pharmacy metrics, reset all PostgreSQL ID sequences to 1, and flush caches at once.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->newLine();
        $this->error('======================================================================');
        $this->error('🛑 CRITICAL ADMINISTRATIVE OPERATION: PHARMACY SYSTEM MASTER REBOOT 🛑');
        $this->error('======================================================================');
        
        if (!$this->confirm('Are you absolutely sure you want to purge ALL operational rows, reset counter sequences to 1, and clear caches? Staff user accounts will remain untouched.')) {
            $this->info('❌ System hard reset sequence aborted by user.');
            return Command::SUCCESS;
        }

        $this->info('🔄 Step 1/3: Purging transactional tables via cascading truncation...');

        $tables = [
            'activity_logs',
            'database_backups',
            'expenses',
            'stock_adjustments',
            'sales_items',
            'sales',
            'shift_reconciliations',
            'prescription_items',
            'prescriptions',
            'patients',
            'batches',
            'purchase_items',
            'purchases',
            'product_supplier',
            'products',
            'suppliers',
        ];

        DB::beginTransaction();
        try {
            // Defer check integrity locks to bypass foreign key barriers
            DB::statement('SET CONSTRAINTS ALL DEFERRED;');

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    DB::statement("TRUNCATE TABLE {$table} RESTART IDENTITY CASCADE;");
                    $this->line("   ✔ Emptied & reset layout constraints on: [{$table}]");
                }
            }

            // Restore defaults inside row #1 corporate configuration parameters if empty
            if (Schema::hasTable('system_settings')) {
                DB::table('system_settings')->where('id', '>', 1)->delete();
                $this->line('   ✔ Normalized corporate framework setting registries.');
            }

            DB::commit();
            $this->info('✔ Table layout truncations executed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ CRITICAL FAULT: Transaction rolled back due to error: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->info('🔄 Step 2/3: Resetting internal PostgreSQL sequence ID pointers back to zero...');
        
        $sequences = [
            'products_id_seq', 'batches_id_seq', 'patients_id_seq', 
            'prescriptions_id_seq', 'suppliers_id_seq', 'sales_id_seq', 
            'purchases_id_seq', 'activity_logs_id_seq', 'expenses_id_seq'
        ];

        foreach ($sequences as $seq) {
            try {
                // Set counter val sequence to 1, set flag to false so next insert assigns exactly 1
                DB::statement("SELECT setval('{$seq}', 1, false);");
            } catch (\Exception $e) {
                // Skip if a minor custom sequence tag variant doesn't match naming conventions
                continue;
            }
        }
        $this->info('✔ All auto-incrementing serial indices successfully calibrated back to 1.');

        $this->info('🔄 Step 3/3: Purging local platform framework session cache memory stores...');
        Artisan::call('cache:clear');
        Artisan::call('view:clear');
        Artisan::call('route:clear');
        $this->info('✔ System caches flushed.');

        // Append a fresh trace into the clean activity ledger
        DB::table('activity_logs')->insert([
            'user_id'     => auth()->id() ?? null,
            'event_type'  => 'SYSTEM_HARD_RESET',
            'description' => 'Executed comprehensive structural administrative hard reset sequence, purging tables and re-calibrating serial sequences.',
            'ip_address'  => '127.0.0.1',
            'created_at'  => now(),
            'updated_at'  => now()
        ]);

        $this->newLine();
        $this->info('✨ SUCCESS: Your pharmacy ecosystem has been completely reset to zero!');
        $this->info('💡 You can now reload your browser and continue testing cleanly from scratch.');
        $this->newLine();

        return Command::SUCCESS;
    }
}
