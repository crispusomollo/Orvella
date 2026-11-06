<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftReconciliation extends Model
{
    protected $fillable = [
        'user_id', 'shift_started_at', 'shift_ended_at', 
        'expected_cash', 'expected_mpesa', 'expected_card', 
        'actual_cash', 'actual_mpesa', 'actual_card', 
        'discrepancy_notes', 'status'
    ];
}

