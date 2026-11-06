<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use Auditable;

    protected $fillable = ['title', 'category', 'amount', 'date_incurred', 'description'];

    protected $casts = [
        'date_incurred' => 'date'
    ];
}
