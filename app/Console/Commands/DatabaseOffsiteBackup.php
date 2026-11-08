<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\SecuritySnapshotBackup;

class DatabaseOffsiteBackup extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'system:database-offsite-backup';

    /**
     * The console command description.
     */
    protected $description = 'Execute native pg_dump hot-snapshot backup, log footprint and dispatch archive copy off-site via email.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Initializing PostgreSQL hot-dump core backup loop sequence...');

        try {
            $timestamp = now()->format('Ymd_His');
            $filename = "scheduled_pharmacy_backup_{$timestamp}.sql";
            
            // Build absolute path allocation vaults on filesystem
            $storageDir = storage_path('app/backups');
            if (!file_exists($storageDir)) {
                mkdir($storageDir, 0755, true);
            }

            $outputPath = "{$storageDir}/{$filename}";
            $dbConfig = config('database.connections.pgsql');

            // Construct shell dump command execution stream string targeting psql variables
            $command = sprintf(
                'PGPASSWORD="%s" pg_dump -h "%s" -p "%s" -U "%s" -d "%s" -F c -b -v -f "%s"',
                $dbConfig['password'],
                $dbConfig['host'],
                $dbConfig['port'],
                $dbConfig['username'],
                $dbConfig['database'],
                $outputPath
            );

            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);

            if ($returnVar !== 0) {
                throw new \Exception("pg_dump worker shell thread process error code extraction: " . implode("\n", $output));
            }

            $fileSizeRaw = file_exists($outputPath) ? filesize($outputPath) : 0;
            $fileSizeFormatted = round($fileSizeRaw / 1024 / 1024, 2) . " MB";

            // Register persistence history logs inside database tracking tables
            DB::table('database_backups')->insert([
                'filename'   => $filename,
                'disk_path'  => $outputPath,
                'file_size'  => $fileSizeFormatted,
                'user_id'    => 1, // System Automated Admin Node Anchor
                'status'     => 'SUCCESS',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // PULL ADMINISTRATIVE SYSTEM COMPLIANCE EMAIL VARIABLE FROM SETTINGS TABLE CACHES
            $sysMailTarget = DB::table('system_settings')->where('id', 1)->value('company_email') ?? 'chemists@orvella.com';
            
            // Dispatches the secure email mailable layer
            Mail::to($sysMailTarget)->send(new SecuritySnapshotBackup($outputPath, $filename));

            // Ingest audit logs activity history footprint
            DB::table('activity_logs')->insert([
                'user_id'      => null, // System Action Daemon Hook
                'event_type'   => 'SYSTEM_DATABASE_BACKUP',
                'description'  => "Automated nightly task compiled database snapshot vault file [{$filename}] (Size: {$fileSizeFormatted}) and successfully mailed offsite backup payload to [{$sysMailTarget}].",
                'ip_address'   => '127.0.0.1',
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            $this->info("✨ Automated off-site backup vault dispatched cleanly to [{$sysMailTarget}]!");
            Log::info("Automated offsite backup vault executed successfully for [{$filename}].");

        } catch (\Exception $e) {
            Log::error("Critical offsite data script backup failure chain: " . $e->getMessage());
            $this->error("Backup Execution Rejected: " . $e->getMessage());

            DB::table('database_backups')->insert([
                'filename'   => "CRITICAL_FAILED_SNAPSHOT_" . now()->format('Ymd_His') . ".txt",
                'disk_path'  => 'NONE',
                'file_size'  => '0.00 MB',
                'user_id'    => 1,
                'status'     => 'FAILED',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return Command::SUCCESS;
    }
}
