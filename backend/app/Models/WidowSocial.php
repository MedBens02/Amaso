<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidowSocial extends Model
{
    use HasFactory;

    protected $table = 'widow_social';

    protected $fillable = [
        'widow_id',
        'housing_type_id',
        'housing_status',
        'has_water',
        'has_electricity',
        'has_furniture',
    ];

    protected $casts = [
        'has_water' => 'boolean',
        'has_electricity' => 'boolean',
        'has_furniture' => 'integer',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function housingType(): BelongsTo
    {
        return $this->belongsTo(HousingType::class);
    }
}