<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Prescriptions Pipeline Report</title>
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
        .badge { border: 1px solid transparent; padding: 2px 5px; font-family: monospace; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .badge-active { background-color: #fef2f2; border-color: #fee2e2; color: #991b1b; }
        .badge-dispensed { background-color: #f0fdf4; border-color: #dcfce7; color: #166534; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>

    <div class="no-print" style="text-align: right; margin-bottom: 10px;">
        <button onclick="window.print()" style="background:{{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; color:#fff; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:10px; text-transform:uppercase;">Print PDF Document</button>
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

    <div class="report-title">Clinical Prescription Dispensation Log Registry Pipeline</div>
    <div class="report-meta">Generated on: {{ now()->format('Y-m-d H:i:s') }} | Security Verification Node: OPERATIONAL</div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Script Code</th>
                <th style="width: 25%;">Patient Name</th>
                <th style="width: 20%;">Chart ID Reference</th>
                <th style="width: 20%;">Prescribing Practitioner</th>
                <th style="width: 10%;">Pipeline Status</th>
                <th style="width: 10%;">Date Issued</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="mono" style="color: {{ $corporateBranding->primary_color_hex ?? '#4338ca' }};">{{ $row->prescription_number }}</td>
                    <td style="font-weight: bold;">{{ $row->patient ? $row->patient->name : 'Walk-In Account' }}</td>
                    <td class="mono">{{ $row->patient ? $row->patient->patient_number : 'N/A' }}</td>
                    <td style="font-weight: 500;">{{ $row->doctor_name }}</td>
                    <td>
                        @if($row->status === 'Active')
                            <span class="badge badge-active">Active</span>
                        @else
                            <span class="badge badge-dispensed">Dispensed</span>
                        @endif
                    </td>
                    <td class="mono">{{ \Carbon\Carbon::parse($row->date_issued)->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
