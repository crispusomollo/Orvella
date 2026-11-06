<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            // Drops the NOT NULL constraint to allow draft staging
            $table->date('batch_expiry_date')->nullable()->change();
            
            // If consignment_batch_number is also hitting a wall, make it nullable too:
            $table->string('consignment_batch_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->date('batch_expiry_date')->nullable(false)->change();
            $table->string('consignment_batch_number')->nullable(false)->change();
        });
    }
};
