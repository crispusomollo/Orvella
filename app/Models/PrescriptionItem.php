<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionItem extends Model
{
    protected $fillable = ['prescription_id', 'product_id', 'quantity_ordered', 'dosage_instructions'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

