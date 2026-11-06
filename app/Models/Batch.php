<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Batch extends Model
{
    protected $fillable = [
        'product_id', 
        'supplier_id', 
        'batch_number', 
        'quantity_received', 
        'quantity_remaining', 
        'cost_price', 
        'selling_price', 
        'expiry_date'
    ];

    // Tell Laravel to treat this column explicitly as a clean Carbon date object
    protected $casts = [
        'expiry_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
