<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Atomically record an operation trace inside the corporate audit registry.
     */
    public static function log(string $eventType, string $description, ?int $userId = null)
    {
        DB::table('activity_logs')->insert([
            'user_id'      => $userId ?? Auth::id(),
            'event_type'   => strtoupper($eventType),
            'description'  => $description,
            'ip_address'   => Request::ip() ?? '127.0.0.1',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
    }
}

