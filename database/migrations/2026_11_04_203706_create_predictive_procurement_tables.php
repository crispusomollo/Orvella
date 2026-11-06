<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. purchase_orders table
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique(); // e.g., PO-20261104-A9F3
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['Draft', 'Pending_Approval', 'Sent_To_Supplier', 'Received', 'Cancelled'])->default('Draft');
            $table->decimal('estimated_total_cost', 12, 2)->default(0.00);
            $table->text('internal_notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // 2. purchase_order_items table
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity_requested');
            $table->decimal('expected_unit_cost', 12, 2); // Pulls from your product_supplier pivot contract price
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
    }
};

