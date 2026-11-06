<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // jsonb column to store key-value pair distributions like {"Cash": 500, "M-Pesa": 1200}
            $table->jsonb('payment_splits')->nullable()->after('payment_method');
            // Adding a subtotal field before discount applications
            $table->decimal('subtotal_amount', 10, 2)->default(0.00)->after('invoice_number');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['payment_splits', 'subtotal_amount']);
        });
    }
};

