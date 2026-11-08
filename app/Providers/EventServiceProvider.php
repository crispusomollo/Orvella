<?php

namespace App\Providers;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use App\Services\ActivityLogger;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();

        // 1. Success Login Tracking Vector
        Event::listen(Login::class, function (Login $event) {
            ActivityLogger::log(
                'USER_LOGIN_SUCCESS', 
                "User [{$event->user->name}] authenticated successfully onto security parameter console.",
                $event->user->id
            );
        });

        // 2. Explicit Termination Session Vector
        Event::listen(Logout::class, function (Logout $event) {
            if ($event->user) {
                ActivityLogger::log(
                    'USER_LOGOUT', 
                    "User [{$event->user->name}] explicitly terminated active session token workspace.",
                    $event->user->id
                );
            }
        });

        // 3. Unauthorized Intrusion / Failure Attempt Vector
        Event::listen(Failed::class, function (Failed $event) {
            $emailAttempted = $event->credentials['email'] ?? 'Unknown Email Identity';
            ActivityLogger::log(
                'USER_LOGIN_FAILED', 
                "Unauthorized login failure recorded vector tracking target address identity: [{$emailAttempted}]."
            );
        });
    }
}

