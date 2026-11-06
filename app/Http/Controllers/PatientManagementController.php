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
    public function exportPrescriptionsData(Request $request)
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
        }*/

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
    }
}

