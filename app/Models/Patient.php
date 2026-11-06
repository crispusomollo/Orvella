<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    use Auditable;

    protected $fillable = ['name', 'phone', 'patient_number'];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }
}

