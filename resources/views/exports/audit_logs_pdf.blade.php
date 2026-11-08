<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Security Audit Trails</title>
    <style>
        body { font-family: sans-serif; color: #1e293b; font-size: 11px; margin: 20px; }
        .branding-header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .company-title { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; }
        .company-meta { font-size: 10px; color: #64748b; font-weight: 600; margin: 0; }
        .report-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; margin: 15px 0 5px 0; }
        .report-meta { font-size: 9px; color: #94a3b8; font-weight: 500; margin-bottom: 15px; }
        table { w-index: 100%; width: 100%; border-collapse: collapse; text-align: left; }
        th { background-color: #f1f5f9; color: #475569; font-weight: 800; text-transform: uppercase; font-size: 8px; tracking-widest: 0.5px; padding: 8px; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .mono { font-family: monospace; font-size: 9px; color: #64748b; }
        .badge { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        @media print {
            body { margin: 0; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <div style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="background:#0f172a; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px;">Print PDF Document</button>
    </div>

    <!-- CORPORATE COMPLIANCE BRANDING HEADER -->
    <div class="branding-header">
        <h1 class="company-title">{{ $corporateBranding->company_name ?? 'ORVELLA PHARMACY' }}</h1>
        <p class="company-meta">
            {{ $corporateBranding->address ?? 'Bungoma Town CBD' }} &bull; 
            Tel: {{ $corporateBranding->phone_number ?? '+254 700 123456' }} &bull; 
            Email: {{ $corporateBranding->company_email ?? 'chemists@zack.com' }}
        </p>
    </div>

    <div class="report-title">Statutory Security Registry & Operations Audit Trails</div>
    <div class="report-meta">Generated on: {{ now()->format('Y-m-d H:i:s') }} | Compliance Verification Node: OPERATIONAL</div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Timestamp</th>
                <th style="width: 15%;">Event Vector</th>
                <th style="width: 50%;">Action Trace Statement String</th>
                <th style="width: 12%;">Operator User</th>
                <th style="width: 8%; text-align: right;">Terminal IP</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $log)
                <tr>
                    <td class="mono">{{ \Carbon\Carbon::parse($log->created_at)->format('Y-m-d H:i:s') }}</td>
                    <td><span class="badge">{{ $log->event_type }}</span></td>
                    <td style="font-weight: 500;">{{ $log->description }}</td>
                    <td style="font-weight: bold;">{{ $log->operator_name ?? 'System' }}</td>
                    <td class="mono" style="text-align: right;">{{ $log->ip_address ?? '127.0.0.1' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>

