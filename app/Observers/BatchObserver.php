<?php

namespace App\Observers;

use App\Models\Batch;
use App\Models\AuditLog;

class BatchObserver
{
    /**
     * Listen dynamically to the Batch model saved/updated event lifecycle hook
     */
    public function updated(Batch $batch): void
    {
        // Isolate specific attributes changed (exchanges password hashes or raw counters)
        $dirtyFields = $batch->getDirty();
        
        if (empty($dirtyFields)) return;

        $oldValues = [];
        $newValues = [];

        foreach ($dirtyFields as $field => $newValue) {
            $oldValues[$field] = $batch->getOriginal($field);
            $newValues[$field] = $newValue;
        }

        AuditLog::create([
            'user_id' => auth()->id() ?? 1, // Fallback placeholder if system runs CLI seeders
            'action' => 'STOCK_ADJUSTMENT',
            'auditable_type' => Batch::class,
            'auditable_id' => $batch->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip() ?? '127.0.0.1',
        ]);
    }
}
