<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowMaouna extends Model
{
    use HasFactory;

    protected $table = 'widow_maouna';

    protected $fillable = [
        'widow_id',
        'partner_id',
        'amount',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }
}
