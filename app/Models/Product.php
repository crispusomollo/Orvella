<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = ['name', 'sku', 'generic_name', 'reorder_level', 'requires_prescription'];

    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    /**
     * Synthesize a real-time attribute calculating sum total inventory remaining across all batches
     */
    public function getTotalStockAttribute(): int
    {
        return $this->batches()->sum('quantity_remaining');
    }

     /**
     * The verified wholesalers authorized to distribute this medication formula.
     */
    public function suppliers(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Supplier::class)->withPivot('contract_cost_price')->withTimestamps();
    }

        /**
     * Track all stock adjustment actions registered against any batch layer lot of this product.
     */
    public function stockAdjustments(): \Illuminate\Database\Eloquent\Relations\HasManyThrough
    {
        return $this->hasManyThrough(StockAdjustment::class, Batch::class);
    }


}
