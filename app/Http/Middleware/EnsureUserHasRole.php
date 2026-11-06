<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request and validate user access permissions vectors.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!auth()->check()) {
            abort(401, 'Unauthorized access attempt.');
        }

        $user = auth()->user();

        // Authorize access instantly if user role matches allowed roles array matrix
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // Return a compliance rejection block if privileges are insufficient
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Access Denied: Insufficient security privileges.'], 403);
        }

        abort(403, 'Access Denied: You do not have permission to view this operations desk.');
    }
}

