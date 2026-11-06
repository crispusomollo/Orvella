<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    // Ensure 'status' is explicitly added to this array
    protected $fillable = [
        'supplier_id',
        'purchase_order_number',
        'grand_total',
        'delivery_date',
        'status',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
