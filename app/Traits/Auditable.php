<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

trait Auditable
{
    /**
     * Boot the trait and automatically bind system model event listeners.
     */
    protected static function bootAuditable(): void
    {
        // 1. Audit CREATION actions
        static::created(function (Model $model) {
            static::logAuditEvent($model, 'RECORD_CREATED', null, $model->getAttributes());
        });

        // 2. Audit UPDATE actions (Captures granular cell modifications)
        static::updated(function (Model $model) {
            $dirtyFields = $model->getDirty();
            if (empty($dirtyFields)) return;

            $oldValues = [];
            $newValues = [];

            foreach ($dirtyFields as $field => $newValue) {
                // Ignore standard timestamp fields to prevent log clutter
                if (in_array($field, ['updated_at', 'created_at'])) continue;
                
                $oldValues[$field] = $model->getOriginal($field);
                $newValues[$field] = $newValue;
            }

            if (!empty($newValues)) {
                static::logAuditEvent($model, 'RECORD_MODIFIED', $oldValues, $newValues);
            }
        });

        // 3. Audit DELETION actions (Preserves safety history vectors before destruction)
        static::deleted(function (Model $model) {
            static::logAuditEvent($model, 'RECORD_DELETED', $model->getOriginal(), null);
        });
    }

    /**
     * Dispatch structured entries into the PostgreSQL database tracking sink.
     */
    protected static function logAuditEvent(Model $model, string $actionType, ?array $old, ?array $new): void
    {
        // Infer explicit event tags based on model classes
        $className = class_basename($model);
        $actionTag = strtoupper($className) . "_" . explode('_', $actionType)[1];

        AuditLog::create([
            'user_id' => auth()->id() ?? 1, // System administrator or automated CLI runner fallback
            'action' => $actionTag,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'old_values' => $old,
            'new_values' => $new,
            'ip_address' => request()->ip() ?? '127.0.0.1',
        ]);
    }
}

