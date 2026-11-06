<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('event_type'); // e.g., 'STOCK_ADJUSTMENT', 'PRICE_OVERRIDE', 'PATIENT_ENROLLED'
            $table->string('target_table')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->text('description'); // High-contrast action statement log
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};

