<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RestrictTerminalIpAccess
{
    /**
     * Intercept and validate terminal node IP boundaries cleanly.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $incomingIp = $request->ip();

        // Safe Fallback Localhost Dev Locks for WSL environments
        if ($incomingIp === '127.0.0.1' || $incomingIp === '::1') {
            return $next($request);
        }

        // Check if any active rules exist inside your whitelist table matrix
        $isWhitelisted = DB::table('ip_whitelists')
            ->where('ip_address', $incomingIp)
            ->where('is_active', true)
            ->exists();

        // If the table registry is completely empty, allow initial setup actions to execute smoothly
        $totalRegisteredRules = DB::table('ip_whitelists')->count();
        if ($totalRegisteredRules === 0) {
            return $next($request);
        }

        if (!$isWhitelisted) {
            // Log security warning footprint inside active activity logs tables automatically
            DB::table('activity_logs')->insert([
                'user_id'      => auth()->id() ?? 1,
                'event_type'   => 'SECURITY_BREACH_ATTEMPT',
                'target_table' => 'kernel',
                'target_id'    => 1,
                'description'  => "Unauthorized hardware device terminal attempt rejected from IP address coordinate: [{$incomingIp}].",
                'ip_address'   => $incomingIp,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);

            if ($request->expectsJson()) {
                return response()->json(['message' => "Terminal Access Denied: Device IP [{$incomingIp}] is not white-listed."], 403);
            }

            abort(403, "Access Denied: Terminal station address [{$incomingIp}] is unauthorized.");
        }

        return $next($request);
    }
}
