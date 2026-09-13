<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One recorded change. Append-only - see the migration.
 */
class AuditLog extends Model
{
    /** Rows are never updated, so there is no updated_at to maintain. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'user_name',
        'action',
        'entity_type',
        'entity_id',
        'entity_label',
        'changes',
        'ip_address',
    ];

    protected $casts = [
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * The account that made the change, when it still exists. The log reads
     * off user_name rather than this, so a deleted account does not take
     * its history with it.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
