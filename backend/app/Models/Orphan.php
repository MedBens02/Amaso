<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Orphan extends Model
{
    use HasFactory;

    protected $fillable = [
        'widow_id',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'education_level_id',
        'health_status',
    ];

    protected $casts = [
        'birth_date' => 'date',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(OrphansEducationLevel::class, 'education_level_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    public function getAgeAttribute(): ?int
    {
        return $this->birth_date ? $this->birth_date->age : null;
    }
}