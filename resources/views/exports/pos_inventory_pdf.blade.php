<!-- File Location: resources/views/exports/pos_inventory_pdf.blade.php -->

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>POS Live Register Stock Manifest</title>
    <style>
        body { font-family: sans-serif; color: #0f172a; font-size: 11px; margin: 20px; }
        .header { 
        border-bottom: 2px solid {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; 
        padding-bottom: 12px; 
        margin-bottom: 15px; 
        text-align: center; 
        display: block !important; /* Forces block stacking down the viewport canvas */
    }
        .header h2 { margin: 0; text-transform: uppercase; font-weight: 900; color: {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; }
        .header p { margin: 4px 0 0 0; color: #64748b; font-size: 10px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; color: white; padding: 6px 10px; font-size: 9px; text-transform: uppercase; text-align: left; }
        td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; }
        .font-mono { font-family: monospace; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header" style="text-align: center; margin-bottom: 20px;">
        <!-- BRAND IDENTITY OVERRIDE MATRIX -->
        @if(!empty($corporateBranding->logo_path))
            <img 
                src="{{ asset('storage/' . $corporateBranding->logo_path) }}" 
                alt="Corporate Logo" 
                style="max-height: 45px; max-width: 180px; object-fit: contain; margin-bottom: 6px; display: inline-block;"
            />
        @else
            <h2>{{ $corporateBranding->company_name ?? 'PHARMACORE ECOSYSTEM' }}</h2>
        @endif
        <p>Live Cashier Register Desk Inventory Manifest - Generated: {{ now()->format('Y-m-d H:i') }}</p>
    </div>
    <table>
        <thead>
            <tr>
                <th>Medication Brand Formulation</th>
                <th>SKU Code</th>
                <th>Regulatory Status</th>
                <th style="text-align: center;">Shelf Balance</th>
                <th style="text-align: right;">Unit Retail Rate</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $p)
                <tr>
                    <td style="font-weight: bold;">{{ $p->name }}</td>
                    <td class="font-mono">{{ $p->sku }}</td>
                    <td>{{ $p->requires_prescription ? 'Rx Only (Controlled)' : 'Over The Counter' }}</td>
                    <td style="text-align: center; font-weight: bold;">{{ $p->stock ?? 0 }} Units</td>
                    <td style="text-align: right; font-weight: bold;" class="font-mono">KES {{ number_format($p->selling_price_fallback, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <script>window.print();</script>
</body>
</html>
