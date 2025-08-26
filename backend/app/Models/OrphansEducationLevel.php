<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrphansEducationLevel extends Model
{
    use HasFactory;

    protected $table = 'orphans_education_level';

    protected $fillable = [
        'name_ar',
        'name_en', 
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Scope to get only active education levels
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Get orphans with this education level
     */
    public function orphans()
    {
        return $this->hasMany(Orphan::class, 'education_level_id');
    }
}