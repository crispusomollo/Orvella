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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action'); // e.g., 'STOCK_ADJUSTMENT', 'BATCH_CREATED', 'EXPIRY_CHANGE'
            $table->string('auditable_type'); // Tracks target Model Class affected
            $table->unsignedBigInteger('auditable_id'); // Tracks target unique Row ID affected
            $table->json('old_values')->nullable(); // Snapshot array state BEFORE change
            $table->json('new_values')->nullable(); // Snapshot array state AFTER change
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
