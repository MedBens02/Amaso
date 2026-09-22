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

    /**
     * Whether this line takes a share of the month's bus pot, and how big.
     *
     * The weight is the number of trips the child made, so a child carried
     * twice as often is owed twice as much. It used to be a tick - rode
     * consistently or did not - and every tick was worth the same share;
     * `rode_consistently` is still on the table because it is the record of
     * how the months settled under that rule were decided, but nothing
     * computes from it any more.
     */
    public function splitWeight(): int
    {
        return $this->mode === TransportSupport::MODE_BUS ? max(0, (int) $this->attendances) : 0;
    }

    /** Whether this line is one of the shares the month's pot is divided into. */
    public function countsTowardsSplit(): bool
    {
        return $this->splitWeight() > 0;
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
