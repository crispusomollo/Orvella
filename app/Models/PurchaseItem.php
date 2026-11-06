<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use Auditable;
    protected $fillable = ['purchase_id', 'product_id', 'consignment_batch_number', 'qty_purchased', 'unit_cost', 'suggested_retail_price', 'batch_expiry_date'];
}
