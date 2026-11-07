<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Product extends Model
{
    protected $fillable = [
        'name', 
        'sku', 
        'generic_name', 
        'category', // Added to trace formulation shapes
        'reorder_level', 
        'requires_prescription'
    ];

    /**
     * Automated SKU Engine: Boot the model to capture standard formatting on creation.
     */
    /*protected static function booted()
    {
        static::creating(function ($product) {
            // 1. Extract the first 3 letters of the product name and strip numbers/spaces
            $cleanName = preg_replace('/[^A-Za-z]/', '', $product->name);
            $prefix = strtoupper(substr($cleanName, 0, 3));
            if (strlen($prefix) < 3) {
                $prefix = str_pad($prefix, 3, 'X');
            }

            // 2. Map the assigned category string parameters to a clean 3-letter token
            $categoryMap = [
                'Tablet'     => 'TAB',
                'Syrup'      => 'SYR',
                'Capsule'    => 'CAP',
                'Cream'      => 'CRM',
                'Lotion'     => 'LTN',
                'Powder'     => 'PWD',
                'Injectable' => 'INJ'
            ];
            $catAbbreviation = $categoryMap[$product->category] ?? 'GEN';

            // 3. Count total items registered under this specific category block to get the trailing count
            $lastSequenceNumber = self::where('category', $product->category)->count();
            $nextSequenceNumber = $lastSequenceNumber + 1;
            
            // 4. Pad the identifier number sequence cleanly to 4 digits (e.g., 0001)
            $paddedSequence = str_pad($nextSequenceNumber, 4, '0', STR_PAD_LEFT);

            // 5. Unify parameters into the final SKU structure
            $product->sku = "{$prefix}-{$catAbbreviation}-{$paddedSequence}";
        });
    }*/

    protected static function booted()
    {
        static::creating(function ($product) {
            // 1. Extract the first 3 letters of the product name and strip numbers/spaces
            $cleanName = preg_replace('/[^A-Za-z]/', '', $product->name);
            $prefix = strtoupper(substr($cleanName, 0, 3));
            if (strlen($prefix) < 3) {
                $prefix = str_pad($prefix, 3, 'X');
            }

            // 2. Map the assigned category string parameters to a clean 3-letter token
            $categoryMap = [
                'Tablet'     => 'TAB',
                'Syrup'      => 'SYR',
                'Capsule'    => 'CAP',
                'Cream'      => 'CRM',
                'Lotion'     => 'LTN',
                'Powder'     => 'PWD',
                'Injectable' => 'INJ'
            ];
            $catAbbreviation = $categoryMap[$product->category] ?? 'GEN';

            // 3. Count total items registered under this specific category block to get the trailing count
            $lastSequenceNumber = self::where('category', $product->category)->count();
            $nextSequenceNumber = $lastSequenceNumber + 1;
            
            // 4. Pad to 2 digits to match standard layout examples (e.g., 01, 02)
            $paddedSequence = str_pad($nextSequenceNumber, 2, '0', STR_PAD_LEFT);

            // 5. Unify parameters into the final SKU structure
            $product->sku = "{$prefix}-{$catAbbreviation}-{$paddedSequence}";
        });
    }


    public function batches(): HasMany
    {
        return $this->hasMany(Batch::class);
    }

    /**
     * Synthesize a real-time attribute calculating sum total inventory remaining across all batches.
     */
    public function getTotalStockAttribute(): int
    {
        return $this->batches()->sum('quantity_remaining');
    }

    /**
     * The verified wholesalers authorized to distribute this medication formula.
     */
    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class)->withPivot('contract_cost_price')->withTimestamps();
    }

    /**
     * Track all stock adjustment actions registered against any batch layer lot of this product.
     */
    public function stockAdjustments(): HasManyThrough
    {
        return $this->hasManyThrough(StockAdjustment::class, Batch::class);
    }
}
