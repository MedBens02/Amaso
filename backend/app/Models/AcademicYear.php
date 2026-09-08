<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_year',
        'label',
        'is_current',
    ];

    protected $casts = [
        'start_year' => 'integer',
        'is_current' => 'boolean',
    ];

    public function enrollments(): HasMany
    {
        return $this->hasMany(OrphanEnrollment::class);
    }

    public static function current(): ?self
    {
        return static::where('is_current', true)->first();
    }

    public static function labelFor(int $startYear): string
    {
        return $startYear . '/' . ($startYear + 1);
    }
}
