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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->constrained(); // Captures the cashier/dispenser profile
            $table->string('invoice_number')->unique();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0.00);
            $table->decimal('discount', 10, 2)->default(0.00);
            $table->string('payment_method')->default('Cash'); // Cash, M-Pesa, Card
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
