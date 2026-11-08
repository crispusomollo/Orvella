<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\ActivityLogger;

class AuditReportGeneration
{
    /**
     * Parse and audit outbound document download pipelines automatically.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Check if the request was successful and targeted a file export route endpoint
        if ($response->isSuccessful()) {
            $currentRouteName = $request->route() ? $request->route()->getName() : '';
            $requestPath = $request->getPathInfo();

            // Intercept and document file system dumps natively
            if (str_contains($requestPath, '/export') || str_contains($requestPath, '/download')) {
                $formatType = strtoupper($request->get('format', 'CSV/EXCEL'));
                
                ActivityLogger::log(
                    'REPORT_GENERATION',
                    "User generated and extracted structured report file channel via route pattern [{$currentRouteName}] format constraint payload: [{$formatType}]."
                );
            }
        }

        return $response;
    }
}
