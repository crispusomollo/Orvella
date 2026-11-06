<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    /*public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }*/

        /**
     * Define the props that are shared by default on first load.
     */
    public function share(Request $request): array
    {
        // Pull the authoritative single setup reference seed row configuration layer
        $corporateBranding = \Illuminate\Support\Facades\DB::table('system_settings')->where('id', 1)->first();

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'role' => $request->user()->role,
                ] : null,
            ],
            // STEP 1 SYSTEMATIC REGISTRY: GLOBAL WHITE-LABEL PROFILE PROPERTY SHARE
            'corporateBranding' => [
                'company_name'        => $corporateBranding->company_name ?? 'PHARMACORE OS',
                'primary_color_hex'   => $corporateBranding->primary_color_hex ?? '#4f46e5',
                'receipt_footer_text' => $corporateBranding->receipt_footer_text ?? '*** Thank you ***',
            ],
        ]);
    }


}
