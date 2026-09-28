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

    /**
     * How a year's mark is worked out at this level.
     *
     * Ordinary levels carry the two semesters at half each; the final years
     * carry the ministry's own weighting, with the national exam worth most
     * of the mark. Set once here by somebody who knows the rules, so nobody
     * marking a child ever types a weight.
     */
    public function gradeComponents()
    {
        return $this->hasMany(EducationLevelGradeComponent::class, 'education_level_id')
            ->orderBy('sort_order')
            ->orderBy('id');
    }
}