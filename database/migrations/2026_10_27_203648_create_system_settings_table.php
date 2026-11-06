<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('PHARMACORE ECOSYSTEM');
            $table->string('company_email')->default('billing@pharmacore.com');
            $table->string('phone_number')->default('+254 700 112233');
            $table->text('address')->default('Oginga Odinga St, Kisumu, Kenya');
            $table->string('currency_code')->default('KES');
            $table->string('receipt_footer_text')->default('*** Thank you for shopping with us ***');
            $table->string('primary_color_hex')->default('#4f46e5'); // Custom branding accent token
            $table->timestamps();
        });

        // Seed an initial default row so the system always has active parameters to read on load
        DB::table('system_settings')->insert([
            'company_name'        => 'PHARMACORE ECOSYSTEM',
            'company_email'       => 'billing@pharmacore.com',
            'phone_number'        => '+254 700 112233',
            'address'             => 'Oginga Odinga St, Kisumu, Kenya',
            'currency_code'       => 'KES',
            'receipt_footer_text' => '*** Thank you for shopping with us ***',
            'primary_color_hex'   => '#4f46e5',
            'created_at'          => now(),
            'updated_at'          => now()
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};

