<!-- File Location: resources/views/exports/prescriptions_pdf.blade.php -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Prescriptions Compliance Audit Report</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px; margin: 20px; }
        .header { border-bottom: 2px solid {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; padding-bottom: 12px; margin-bottom: 20px; text-align: center; }
        .header h2 { font-size: 18px; font-weight: 900; color: {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; margin: 0; text-transform: uppercase; tracking: 1px; }
        .header p { margin: 4px 0 0 0; color: #64748b; font-size: 11px; font-weight: 500; }
        .meta-box { margin-bottom: 15px; font-size: 11px; color: #475569; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 10px; }
        th { background-color: {{ $corporateBranding->primary_color_hex ?? '#0f172a' }}; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10px; tracking: 0.5px; padding: 8px 10px; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .font-mono { font-family: Courier, monospace; font-weight: bold; color: #4338ca; }
        .badge { display: inline-block; padding: 2px 6px; font-size: 9px; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .badge-active { background-color: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .badge-dispensed { background-color: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
        
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
            @page { margin: 1.5cm; }
        }
    </style>
</head>
<body>

    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background-color: {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }}; color: white; border: none; padding: 8px 16px; font-size: 11px; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase; tracking: 0.5px;">
            Confirm Print / Save PDF
        </button>
    </div>

    <div class="header">
        <!-- BRAND IDENTITY OVERRIDE MATRIX -->
        @if(!empty($corporateBranding->logo_path))
            <img 
                src="{{ asset('storage/' . $corporateBranding->logo_path) }}" 
                alt="Corporate Logo" 
                style="max-height: 50px; max-width: 200px; object-fit: contain; margin-bottom: 4px; display: inline-block;"
            />
        @else
            <h2>{{ $corporateBranding->company_name ?? 'PHARMACORE ECOSYSTEM' }}</h2>
        @endif
        <p>Clinical Prescription Dispensation Log Registry Pipeline - Support: {{ $corporateBranding->phone_number ?? 'N/A' }}</p>
    </div>

    <div class="meta-box">
        Report Generated: {{ now()->format('Y-m-d H:i:s') }} | Filtered Archive Records
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%;">Script Code</th>
                <th style="width: 25%;">Patient Name</th>
                <th style="width: 20%;">Chart ID</th>
                <th style="width: 20%;">Practitioner</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 10%;">Date Issued</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="font-mono">{{ $row->prescription_number }}</td>
                    <td style="font-weight: 600;">{{ $row->patient ? $row->patient->name : 'Walk-In Account' }}</td>
                    <td class="font-mono" style="color: #64748b;">{{ $row->patient ? $row->patient->patient_number : 'N/A' }}</td>
                    <td>{{ $row->doctor_name }}</td>
                    <td>
                        @if($row->status === 'Active')
                            <span class="badge badge-active">Active</span>
                        @else
                            <span class="badge badge-dispensed">Dispensed</span>
                        @endif
                    </td>
                    <td style="color: #475569;">{{ \Carbon\Carbon::parse($row->date_issued)->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

</body>
</html>
