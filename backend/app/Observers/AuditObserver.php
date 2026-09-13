<?php

namespace App\Observers;

use App\Support\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * One observer for every audited model - see AppServiceProvider for the list.
 *
 * Attached to the models rather than called from the services, so a change
 * is recorded whichever way it was made: through a controller, through a
 * service, through the rollover that promotes a whole class at once, or from
 * a one-off script. The write itself is what triggers the record.
 */
class AuditObserver
{
    public function created(Model $model): void
    {
        AuditLogger::record('created', $model, AuditLogger::initialValues($model));
    }

    public function updated(Model $model): void
    {
        $changes = AuditLogger::diff($model);

        // Saving a record without changing anything is not an event.
        if ($changes === []) {
            return;
        }

        AuditLogger::record(AuditLogger::actionFor($model, $changes), $model, $changes);
    }

    /**
     * Soft deletes arrive here too - Eloquent fires deleted, not updated,
     * when a model with SoftDeletes is archived. Archiving a family and
     * deleting a reference row are both "the record is gone from the
     * screens" as far as somebody reading the log is concerned.
     */
    public function deleted(Model $model): void
    {
        AuditLogger::record('deleted', $model, AuditLogger::finalValues($model));
    }

    public function restored(Model $model): void
    {
        AuditLogger::record('restored', $model);
    }

    public function forceDeleted(Model $model): void
    {
        AuditLogger::record('force_deleted', $model, AuditLogger::finalValues($model));
    }
}
