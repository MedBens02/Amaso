<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    use HasFactory;

    public const TYPE_SCHOOL = 'school';
    public const TYPE_UNIVERSITY = 'university';

    protected $fillable = [
        'name',
        'type',
        'is_private',
        'is_amaso_linked',
        'notes',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'is_amaso_linked' => 'boolean',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(OrphanEnrollment::class);
    }
}
