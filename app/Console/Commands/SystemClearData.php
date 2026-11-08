<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemClearData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:clear-data';

    /**
     * The console command description.
     */
    protected $description = 'Permanently purge all operational pharmacy transaction data while preserving user accounts.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->confirm('🛑 WARNING: This will permanently wipe all sales, inventory, patients, and financial records. User accounts will be saved. Do you want to continue?')) {
            $this->info('Operation cancelled safely.');
            return Command::SUCCESS;
        }

        $this->info('Initiating atomic system table database purge...');

        // Ordered list of tables to clear based on foreign key relationship structures
        $tables = [
            'activity_logs',
            'database_backups',
            'ip_whitelists',
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
            // Disable foreign key constraints during truncation window
            DB::statement('SET CONSTRAINTS ALL DEFERRED;');

            foreach ($tables as $table) {
                if (Schema::hasTable($table)) {
                    // Wipes rows, resets auto-increment sequences, and handles cascading relationships cleanly
                    DB::statement("TRUNCATE TABLE {$table} RESTART IDENTITY CASCADE;");
                    $this->line("Purged and reset matrix constraints on table: [{$table}]");
                }
            }

            // Optional: Also seed or reset default Row #1 settings if it was wiped
            if (Schema::hasTable('system_settings')) {
                DB::table('system_settings')->where('id', '>', 1)->delete();
                $this->line('Normalized persistent configuration rows.');
            }

            DB::commit();
            $this->info('✨ System data cleared successfully! All staff accounts are intact.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Purge Rejected: Error encountered during table truncation: ' . $e->getMessage());
        }

        return Command::SUCCESS;
    }
}
