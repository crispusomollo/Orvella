<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Product;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class PatientManagementController extends Controller
{
    /**
     * Display the master-detail patient dashboard ledger.
     */
    public function index(Request $request)
    {
        $search = $request->get('search_name');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        // 1. MASTER DIRECTORY QUERY WITH DRILLED HISTORY FILTERS
        $patientQuery = Patient::with(['prescriptions' => function ($query) use ($startDate, $endDate) {
            if (!empty($startDate)) {
                $query->whereDate('date_issued', '>=', $startDate);
            }
            if (!empty($endDate)) {
                $query->whereDate('date_issued', '<=', $endDate);
            }
            $query->orderBy('date_issued', 'desc');
        }]);

        if (!empty($search)) {
            $patientQuery->where(function($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                  ->orWhere('patient_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('prescriptions', function($subQ) use ($search) {
                      $subQ->where('prescription_number', 'ILIKE', "%{$search}%");
                  });
            });
        }

        // 2. OPERATIONAL PIPELINE WIDGET (LATEST 5 PIPELINE ROWS)
        $latestPrescriptions = Prescription::with('patient')
            ->latest()
            ->take(5)
            ->get();

        $products = Product::select('id', 'name', 'sku')->get();

        return Inertia::render('Patients/PatientConsole', [
            'patients' => $patientQuery->get(),
            'products' => $products,
            'latestPrescriptions' => $latestPrescriptions,
            'filters' => $request->only(['search_name', 'start_date', 'end_date'])
        ]);
    }

    /**
     * Export streaming channel handling both CSV/Excel and clear raw formatting.
     */
    /*public function exportPrescriptionsData(Request $request)
    {
        $format = $request->get('format', 'excel');
        $search = $request->get('search_name');
        
        $query = Prescription::with(['patient', 'items.product']);
        
        if (!empty($search)) {
            $query->where('prescription_number', 'ILIKE', "%{$search}%");
        }
        
        $data = $query->get();

        /*if ($format === 'pdf') {
            // For simple, dependency-free PDF stream under WSL, you can return a printable layout view
            return view('exports.prescriptions_pdf', compact('data'));
        }*

                if ($format === 'pdf') {
            // STEP B REGISTRY: LOAD PERSISTENT CORPORATE METADATA VALUES
            $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
            return view('exports.prescriptions_pdf', compact('data', 'corporateBranding'));
        }


        // Excel/CSV Stream Generator
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=prescriptions_report_" . now()->format('Ymd') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($data) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Script Reference', 'Patient Name', 'Doctor', 'Status', 'Date Sourced']);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->prescription_number,
                    $row->patient ? $row->patient->name : 'Walk-In',
                    $row->doctor_name,
                    $row->status,
                    $row->date_issued
                ]);
            }
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }*/

    /**
     * Export streaming channel handling both CSV/Excel and cohesive corporate PDF layouts.
     * Route Sourced: GET /api/prescriptions/export
     */
    public function exportPrescriptionsData(Request $request)
    {
        $format = $request->get('format', 'excel');
        $search = $request->get('search_name');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');
        
        // Build base query eagerly loading relationships matching user criteria bounds
        $query = Prescription::with(['patient', 'items.product']);
        
        if (!empty($search)) {
            $query->where(function($q) use ($search) {
                $q->where('prescription_number', 'ILIKE', "%{$search}%")
                  ->orWhereHas('patient', function($pq) use ($search) {
                      $pq->where('name', 'ILIKE', "%{$search}%");
                  });
            });
        }
        
        if (!empty($startDate)) {
            $query->whereDate('date_issued', '>=', $startDate);
        }
        
        if (!empty($endDate)) {
            $query->whereDate('date_issued', '<=', $endDate);
        }
        
        $data = $query->orderBy('date_issued', 'desc')->get();

        // Pull persistent seed configuration details from metadata registries
        $corporateBranding = DB::table('system_settings')->where('id', 1)->first();
        $companyName = $corporateBranding->company_name ?? 'ORVELLA PHARMACY';
        $companyPhone = $corporateBranding->phone_number ?? '+254 700 123456';
        $companyAddress = $corporateBranding->address ?? 'Bungoma Town CBD';
        $companyEmail = $corporateBranding->company_email ?? 'chemists@zack.com';

        // BRANCH A: Clean, browser-printable layout for PDF conversions
        if ($format === 'pdf') {
            return view('exports.prescriptions_pdf', compact('data', 'corporateBranding'));
        }

        // BRANCH B: High-Velocity Excel/CSV direct memory stream channel
        $fileName = 'prescriptions_pipeline_report_' . now()->format('Ymd_His') . '.csv';
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use ($data, $companyName, $companyAddress, $companyPhone, $companyEmail) {
            $file = fopen('php://output', 'w');
            
            // PREPEND DYNAMIC COHESIVE SYSTEM BANNER REPORT HEADER BLOCKS
            fputcsv($file, [strtoupper($companyName)]);
            fputcsv($file, ["Location: " . $companyAddress . " | Tel: " . $companyPhone . " | Email: " . $companyEmail]);
            fputcsv($file, ["CLINICAL PRESCRIPTION DISPENSATION PIPELINE REGISTRY REPORT"]);
            fputcsv($file, ["Exported on: " . now()->toFormattedDateString() . " " . now()->format('H:i:s')]);
            fputcsv($file, []); // Spacer row for visual alignment

            // Baseline Matrix Columns
            fputcsv($file, ['Script Code Reference', 'Patient Name', 'Chart Number Reference', 'Prescribing Practitioner', 'Pipeline Status', 'Date Sourced']);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->prescription_number,
                    $row->patient ? $row->patient->name : 'Walk-In Account',
                    $row->patient ? $row->patient->patient_number : 'N/A',
                    $row->doctor_name,
                    $row->status === 'Active' ? 'ACTIVE QUEUE' : 'DISPENSED',
                    \Carbon\Carbon::parse($row->date_issued)->format('Y-m-d')
                ]);
            }
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

}

