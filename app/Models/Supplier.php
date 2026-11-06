<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use Auditable;

    protected $fillable = ['name', 'contact_person', 'phone', 'email', 'address'];

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

     /**
     * The products that this wholesaler is authorized to supply.
     */
    public function products(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Product::class)->withPivot('contract_cost_price')->withTimestamps();
    }

}

