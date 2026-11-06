<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;

trait HasSystemBranding
{
    /**
     * Gather and compile fully active white-label layout parameters.
     */
    public function getSystemBrandingMatrix(): array
    {
        $settings = DB::table('system_settings')->pluck('setting_value', 'setting_key');

        return [
            'name'        => $settings['company_name'] ?? 'PHARMACORE OS',
            'phone'       => $settings['company_phone'] ?? '+254 000 000 000',
            'email'       => $settings['company_email'] ?? 'info@pharmacore.com',
            'tin'         => $settings['company_tin'] ?? 'N/A',
            'brand_color' => $settings['brand_color'] ?? '#4f46e5', // Defaults to corporate indigo-600
            'brand_font'  => $settings['brand_font'] ?? 'font-sans'
        ];
    }
}

