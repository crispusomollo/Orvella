<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Master Medication Formulary Manifest</title>
    <style>
        body { font-family: sans-serif; color: #1e293b; font-size: 11px; margin: 20px; }
        .branding-header { border-bottom: 2px solid {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; padding-bottom: 12px; margin-bottom: 20px; display: table; width: 100%; }
        .brand-logo-cell { display: table-cell; vertical-align: middle; width: 25%; }
        .brand-text-cell { display: table-cell; vertical-align: middle; width: 75%; text-align: left; padding-left: 15px; }
        .company-title { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; color: {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; margin: 0 0 4px 0; text-transform: uppercase; }
        .company-meta { font-size: 10px; color: #64748b; font-weight: 600; margin: 0; }
        .report-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 15px 0 5px 0; }
        .report-meta { font-size: 9px; color: #94a3b8; font-weight: 500; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8px; tracking-widest: 0.5px; padding: 8px; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .mono { font-family: monospace; font-size: 9px; color: #64748b; font-weight: bold; }
        .badge { border: 1px solid transparent; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; display: inline-block; }
        .badge-rx { background-color: #faf5ff; border-color: #e9d5ff; color: #6b21a8; }
        .badge-otc { background-color: #f0fdf4; border-color: #dcfce7; color: #166534; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>

    <div class="no-print" style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="background:{{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px; text-transform:uppercase;">Print Manifest Copy</button>
    </div>

    <!-- CORPORATE WHITE-LABEL BRANDING COMPLIANCE HEADER CONTAINER -->
    <div class="branding-header">
        @if(!empty($corporateBranding->logo_path) && file_exists(storage_path('app/public/' . $corporateBranding->logo_path)))
            <div class="brand-logo-cell">
                <img 
                    src="data:image/{{ pathinfo($corporateBranding->logo_path, PATHINFO_EXTENSION) }};base64,{{ base64_encode(file_get_contents(storage_path('app/public/' . $corporateBranding->logo_path))) }}" 
                    style="max-height: 50px; max-width: 100%; object-fit: contain;"
                    alt="Logo"
                />
            </div>
        @endif
        <div class="brand-text-cell">
            <h1 class="company-title">{{ $corporateBranding->company_name ?? 'ORVELLA PHARMACY' }}</h1>
            <p class="company-meta">
                {{ $corporateBranding->address ?? 'Bungoma Town CBD' }} &bull; 
                Tel: {{ $corporateBranding->phone_number ?? '+254 700 123456' }} &bull; 
                Email: {{ $corporateBranding->company_email ?? 'chemists@zack.com' }}
            </p>
        </div>
    </div>

    <div class="report-title">Master Medication Formulary Catalog Manifest</div>
    <div class="report-meta">Generated on: {{ now()->format('Y-m-d H:i:s') }} | Compliance Verification Status: OPERATIONAL</div>

    <table>
        <thead>
            <tr>
                <th style="width: 30%;">Medication Nomenclature</th>
                <th style="width: 20%;">SKU Barcode</th>
                <th style="width: 25%;">Chemical Formulation Molecule</th>
                <th style="width: 13%;">Classification</th>
                <th style="width: 12%; text-align: right;">Total Shelf Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $product)
                <tr>
                    <td style="font-weight: bold; color: #0f172a;">{{ $product->name }}</td>
                    <td class="mono" style="color: {{ $corporateBranding->primary_color_hex ?? '#4338ca' }};">{{ $product->sku }}</td>
                    <td style="font-weight: 500; color: #475569;">{{ $product->generic_name ?? 'N/A' }}</td>
                    <td>
                        @if($product->requires_prescription)
                            <span class="badge badge-rx">Rx Only</span>
                        @else
                            <span class="badge badge-otc">OTC Product</span>
                        @endif
                    </td>
                    <td class="mono" style="text-align: right; font-size: 11px; color: #0f172a;">
                        {{ number_format($product->stock) }} Units
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
