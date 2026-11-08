<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatically execute your custom inventory evaluation script daily at 8:00 AM EAT
Schedule::command('pharmacy:check-stock')->dailyAt('08:00');

// Automatically triggers a PostgreSQL hot dump and sends it out off-site every night at midnight
Schedule::command('system:database-offsite-backup')->dailyAt('00:00');
