<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Upgrading Batches table with reference cost margins & total metrics tracking
        Schema::table('batches', function (Blueprint $table) {
            if (!Schema::hasColumn('batches', 'purchase_id')) {
                $table->foreignId('purchase_id')->nullable()->constrained()->onDelete('cascade');
            }
        });

        // 2. Creating Stock Adjustments Ledger Table
        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('batch_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained();
            $table->integer('quantity_delta'); // Positive for additions, Negative for write-offs
            $table->string('type'); // 'Damaged', 'Expired', 'Reconciliation', 'Correction'
            $table->string('reason');
            $table->timestamps();
        });

        // 3. Creating Supplier Payments Accounting Ledger Table
        Schema::create('supplier_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->foreignId('purchase_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('amount_paid', 10, 2);
            $table->string('payment_reference')->unique(); // Transaction hash or receipt code
            $table->string('payment_method'); // 'M-Pesa', 'Bank Transfer', 'Cash'
            $table->timestamps();
        });

        // 4. Creating Shift Reconciliations Tracker Table
        Schema::create('shift_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->timestamp('shift_started_at');
            $table->timestamp('shift_ended_at')->nullable();
            $table->decimal('expected_cash', 10, 2)->default(0.00);
            $table->decimal('expected_mpesa', 10, 2)->default(0.00);
            $table->decimal('expected_card', 10, 2)->default(0.00);
            $table->decimal('actual_cash', 10, 2)->default(0.00);
            $table->decimal('actual_mpesa', 10, 2)->default(0.00);
            $table->decimal('actual_card', 10, 2)->default(0.00);
            $table->text('discrepancy_notes')->nullable();
            $table->string('status')->default('Open'); // 'Open', 'Reconciled'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_reconciliations');
        Schema::dropIfExists('supplier_payments');
        Schema::dropIfExists('stock_adjustments');
        Schema::table('batches', function (Blueprint $table) {
            $table->dropColumn('purchase_id');
        });
    }
};
