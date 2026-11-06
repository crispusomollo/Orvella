<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Prescription Script - {{ $prescription->prescription_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; color: #334155; margin: 30px; }
        .receipt-card { max-w: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; }
        .header-block { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 16px; }
        /* The title color updates instantly whenever the hex value shifts in settings! */
        .brand-title { margin: 0; font-size: 20px; font-weight: 900; uppercase; color: {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }}; }
        .meta-text { margin: 2px 0; font-size: 11px; color: #64748b; }
        .section-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; }
        .patient-info { background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
        .med-table { w-full: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; w-full: 100%; text-align: left; }
        .med-table th { padding: 8px; background: #f1f5f9; color: #475569; font-weight: bold; }
        .med-table td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; }
        .footer-msg { text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
    </style>
</head>
<body>

    <div class="receipt-card">
        <div class="header-block">
    <!-- LOGO PRIORITIZATION ENVELOPE -->
    @if(!empty($corporateBranding->logo_path))
        <img 
            src="{{ asset('storage/' . $corporateBranding->logo_path) }}" 
            alt="Prescription Corporate Logo" 
            style="max-height: 55px; max-width: 220px; object-fit: contain; margin-bottom: 5px;"
        />
    @else
        <h2 style="margin: 0; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: {{ $corporateBranding->primary_color_hex ?? '#4f46e5' }};">
            {{ $corporateBranding->company_name ?? 'PHARMACORE ECOSYSTEM' }}
        </h2>
    @endif

    <p style="margin: 3px 0; font-size: 11px; color: #64748b;">{{ $corporateBranding->address ?? '' }}</p>
    <p style="margin: 3px 0; font-size: 11px; font-family: monospace; color: #64748b;">{{ $corporateBranding->phone_number ? 'TEL: ' . $corporateBranding->phone_number : '' }}</p>
</div>

        <div class="section-title">Patient Chart Details</div>
        <div class="patient-info">
            <table style="width: 100%; font-size: 12px;">
                <tr><td><strong>Patient Name:</strong> {{ $prescription->patient->name ?? 'Walk-In' }}</td><td style="text-align: right;"><strong>Chart Number:</strong> {{ $prescription->patient->patient_number ?? 'N/A' }}</td></tr>
                <tr><td><strong>Prescribed By:</strong> Dr. {{ $prescription->doctor_name }}</td><td style="text-align: right;"><strong>Date Issued:</strong> {{ \Carbon\Carbon::parse($prescription->date_issued)->format('d M Y') }}</td></tr>
            </table>
        </div>

        <div class="section-title">Authorized Formulations Matrix</div>
        <table class="med-table">
            <thead>
                <tr>
                    <th>Medication Description</th>
                    <th style="text-align: center;">Authorized Qty</th>
                </tr>
            </thead>
            <tbody>
                @foreach($prescription->items as $item)
                    <tr>
                        <td>
                            <strong>{{ $item->product->name }}</strong>
                            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Sig: {{ $item->dosage_instructions }}</div>
                        </td>
                        <td style="text-align: center; font-weight: bold;">{{ $item->quantity_ordered }} Units</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="footer-msg">
            {{ $corporateBranding->receipt_footer_text ?? '*** Statutory Copy - Medical Records Registry ***' }}
        </div>
    </div>

    <script>
        // Trigger print interface automatically on load
        window.onload = function() { window.print(); }
    </script>
</body>
</html>
