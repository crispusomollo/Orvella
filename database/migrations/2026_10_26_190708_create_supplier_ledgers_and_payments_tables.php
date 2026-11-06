<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Core Supplier Financial Tracking Ledger
        Schema::create('supplier_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->foreignId('purchase_id')->nullable()->constrained()->onDelete('set null');
            $table->string('transaction_type'); // e.g., 'CONSIGNMENT_INTAKE', 'CASH_PAYMENT'
            $table->string('reference_number'); // e.g., 'PO-XXXXXX', 'PAY-XXXXXX'
            $table->decimal('debit', 14, 2)->default(0.00);  // Reduces liabilities (Payments)
            $table->decimal('credit', 14, 2)->default(0.00); // Increases liabilities (Stock Purchases)
            $table->decimal('running_balance', 14, 2)->default(0.00);
            $table->date('due_date')->nullable(); // Essential parameter tool for debt aging विश्लेषण
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_ledgers');
    }
};

