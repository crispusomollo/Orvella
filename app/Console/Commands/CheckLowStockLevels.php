<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Mail\LowStockAlertEmail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class CheckLowStockLevels extends Command
{
    /**
     * The console command signature string keyword.
     */
    protected $signature = 'pharmacy:check-stock';

    /**
     * The console command description details.
     */
    protected $description = 'Evaluate aggregate batch inventory balances and dispatch alerts to pharmacy operations management';

    /**
     * Execute the console background execution command.
     */
    public function handle()
    {
        $this->info('Starting inventory threshold validation sweep...');

        // Query products along with their real-time batch stock sums
        $lowStockItems = Product::select('products.*')
            ->selectSub(function ($query) {
                $query->selectRaw('COALESCE(SUM(quantity_remaining), 0)')
                    ->from('batches')
                    ->whereColumn('batches.product_id', 'products.id');
            }, 'total_stock')
            ->get()
            ->filter(function ($product) {
                return $product->total_stock <= $product->reorder_level;
            })
            ->values();

        if ($lowStockItems->isEmpty()) {
            $this->info('All products currently maintain standard safety inventory levels.');
            return 0;
        }

        $this->warn("Found {$lowStockItems->count()} formulations violating safety levels. Dispatching alert payloads...");

        // Fire out the mailable notification directly to management destinations
        Mail::to('admin@pharmacy.com')->send(new LowStockAlertEmail($lowStockItems));

        $this->info('Operations alerts successfully transmitted to email queues.');
        return 0;
    }
}

