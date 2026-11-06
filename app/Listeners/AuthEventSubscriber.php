<?php

namespace App\Listeners;

use App\Models\AuditLog;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Failed;
use Illuminate\Events\Dispatcher;

class AuthEventSubscriber
{
    public function handleLogin(Login $event): void
    {
        AuditLog::create([
            'user_id' => $event->user->id,
            'action' => 'USER_LOGIN_SUCCESS',
            'auditable_type' => get_class($event->user),
            'auditable_id' => $event->user->id,
            'new_values' => ['email' => $event->user->email],
            'ip_address' => request()->ip() ?? '127.0.0.1',
        ]);
    }

    public function handleLogout(Logout $event): void
    {
        if (!$event->user) return;

        AuditLog::create([
            'user_id' => $event->user->id,
            'action' => 'USER_LOGOUT',
            'auditable_type' => get_class($event->user),
            'auditable_id' => $event->user->id,
            'ip_address' => request()->ip() ?? '127.0.0.1',
        ]);
    }

    public function handleFailed(Failed $event): void
    {
        AuditLog::create([
            'user_id' => null, // Cryptographic safety guard: target user was not verified
            'action' => 'SECURITY_LOGIN_FAILED',
            'auditable_type' => \App\Models\User::class,
            'auditable_id' => 0,
            'old_values' => ['attempted_email' => $event->credentials['email'] ?? 'Unknown'],
            'ip_address' => request()->ip() ?? '127.0.0.1',
        ]);
    }

    /**
     * Register listeners for events.
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Failed::class => 'handleFailed',
        ];
    }
}

