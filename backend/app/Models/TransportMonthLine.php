<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransportMonthLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'transport_month_id',
        'support_id',
        'mode',
        'rode_consistently',
        'attendances',
        'rate',
        'amount',
        'notes',
    ];

    protected $casts = [
        'rode_consistently' => 'boolean',
        'attendances' => 'integer',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    /** Whether this line is one of the shares the month's pot is divided into. */
    public function countsTowardsSplit(): bool
    {
        return $this->mode === TransportSupport::MODE_BUS && $this->rode_consistently;
    }

    public function month(): BelongsTo
    {
        return $this->belongsTo(TransportMonth::class, 'transport_month_id');
    }

    public function support(): BelongsTo
    {
        return $this->belongsTo(TransportSupport::class, 'support_id');
    }
}
