<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransportProvider extends Model
{
    use HasFactory;

    /**
     * Who is running the vehicle.
     *
     * Not decoration: it decides what the association is actually paying for.
     * Its own van is a driver's wage, insurance and maintenance - three
     * expense categories that already exist. A contractor is one invoice. The
     * school's bus may cost nothing at all beyond a subscription.
     */
    public const TYPES = [
        'association' => 'حافلة الجمعية',
        'contractor' => 'ناقل متعاقد',
        'school' => 'نقل المؤسسة',
        'other' => 'أخرى',
    ];

    protected $fillable = [
        'name',
        'type',
        'contact_name',
        'phone',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['type_label'];

    public function getTypeLabelAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function routes(): HasMany
    {
        return $this->hasMany(TransportRoute::class, 'provider_id');
    }

    /** Only the standalone arrangements; riders on a run belong to the run. */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(OrphanTransportSubscription::class, 'provider_id');
    }
}
