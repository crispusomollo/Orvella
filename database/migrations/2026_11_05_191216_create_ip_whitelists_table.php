<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ip_whitelists', function (Blueprint $table) {
            $table->id();
            $table->string('terminal_name'); // e.g., "Main Cashier POS Desk #1"
            $table->string('ip_address')->unique(); // IPv4 or IPv6 Address string parameters
            $table->boolean('is_active')->default(true);
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ip_whitelists');
    }
};
