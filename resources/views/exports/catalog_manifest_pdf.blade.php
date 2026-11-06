<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Master Medication Formulary Catalog Manifest</title>
    <style>
        body { font-family: sans-serif; color: #0f172a; font-size: 11px; margin: 20px; }
        .header { border-bottom: 2px solid {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }}; padding-bottom: 12px; margin-bottom: 15px; text-align: center; }
        .header h2 { margin: 0 0 4px 0; text-transform: uppercase; font-weight: 900; color: {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }}; }
        .header p { margin: 0; color: #64748b; font-size: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background-color: {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }}; color: white; padding: 8px 10px; font-size: 9px; text-transform: uppercase; text-align: left; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        .font-mono { font-family: monospace; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 5px; font-size: 8px; font-weight: bold; border-radius: 4px; text-transform: uppercase; border: 1px solid #fee2e2; background: #fef2f2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($corporateBranding->logo_path))
            <img src="{{ asset('storage/' . $corporateBranding->logo_path) }}" alt="Corporate Logo" style="max-height: 45px; max-width: 180px; object-fit: contain; margin-bottom: 6px;" />
        @else
            <h2>{{ $corporateBranding->company_name ?? 'ORVELLAE PHARMACY' }}</h2>
        @endif
        <p>Master Medication Formulary Catalog Manifest — Sourced: {{ now()->format('Y-m-d H:i') }}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Medication Nomenclature</th>
                <th>SKU Barcode</th>
                <th>Chemical Formulation Molecule</th>
                <th style="text-align: center;">Total Shelf Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $p)
                <tr>
                    <td style="font-weight: bold;">
                        {{ $p->name }}
                        @if($p->requires_prescription)
                            <span class="badge" style="margin-left: 4px;">Rx Only</span>
                        @endif
                    </td>
                    <td class="font-mono text-slate-500">{{ $p->sku }}</td>
                    <td>{{ $p->generic_name ?? 'N/A' }}</td>
                    <td style="text-align: center; font-weight: bold;" class="font-mono">
                        {{ $p->stock ?? 0 }} Units
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>

