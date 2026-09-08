<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowPhone extends Model
{
    use HasFactory;

    protected $fillable = [
        'widow_id',
        'phone',
        'label',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }
}
