<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Sale extends Model
{
    use Auditable;

    // FIXED: Appended subtotal_amount and payment_splits to the fillable property whitelist
    protected $fillable = [
        'patient_id', 
        'user_id', 
        'invoice_number', 
        'subtotal_amount', // <-- Added
        'total_amount', 
        'tax_amount', 
        'discount', 
        'payment_method',
        'payment_splits'   // <-- Added
    ];

    /**
     * FIXED: Added missing relation mapping the sale record back to the cashier user account profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesItem::class, 'sale_id');
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    /**
     * Get the shift reconciliation bundle that contains this sale transaction entry.
     */
    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(ShiftReconciliation::class, 'user_id', 'user_id');
    }
}

