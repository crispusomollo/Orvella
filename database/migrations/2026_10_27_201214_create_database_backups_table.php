<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('database_backups', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('disk_path');
            $table->string('file_size');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('status')->default('SUCCESS'); // SUCCESS or FAILED
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('database_backups');
    }
};

