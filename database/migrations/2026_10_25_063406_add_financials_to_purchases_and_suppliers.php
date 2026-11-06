<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('payment_status')->default('Unpaid'); // Unpaid, Partially Paid, Paid
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            $table->decimal('balance_due', 10, 2)->default(0.00);
            $table->date('due_date')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'amount_paid', 'balance_due', 'due_date']);
        });
    }
};
