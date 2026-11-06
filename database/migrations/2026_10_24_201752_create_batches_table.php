<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            // Maintain cascade rules: if a product drops, its batches clear
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained();
            $table->string('batch_number');
            $table->integer('quantity_received');
            $table->integer('quantity_remaining'); // Tracking point for current real-time stock
            $table->decimal('cost_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->date('expiry_date'); // Expiration monitoring parameter
            $table->timestamps();

            // Optimize query speeds for low stock and expiration alerts
            $table->index(['product_id', 'quantity_remaining']);
            $table->index('expiry_date');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
