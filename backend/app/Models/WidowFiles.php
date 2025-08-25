<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowFiles extends Model
{
    use HasFactory;

    protected $fillable = [
        'widow_id',
        'social_situation',
        'has_chronic_disease',
        'has_maouna',
    ];

    protected $casts = [
        'has_chronic_disease' => 'boolean',
        'has_maouna' => 'boolean',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }
}