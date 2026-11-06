<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prescription extends Model
{
    use Auditable;

    protected $fillable = ['patient_id', 'prescription_number', 'doctor_name', 'date_issued', 'status'];

    protected $casts = [
        'date_issued' => 'date'
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }


        /**
     * Get the individual medication line items authorized under this prescription.
     */
    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

}
