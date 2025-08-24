<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Widow extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'neighborhood',
        'admission_date',
        'national_id',
        'birth_date',
        'marital_status',
        'education_level',
        'disability_flag',
        'disability_type',
    ];

    protected $casts = [
        'admission_date' => 'date',
        'birth_date' => 'date',
        'disability_flag' => 'boolean',
    ];

    protected $appends = [
        'full_name',
    ];


    public function orphans(): HasMany
    {
        return $this->hasMany(Orphan::class);
    }

    public function sponsorships(): HasMany
    {
        return $this->hasMany(KafilSponsorship::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Widow Files - Social situation and chronic disease
    public function widowFiles(): HasOne
    {
        return $this->hasOne(WidowFiles::class);
    }

    // Widow Social Information
    public function widowSocial(): HasOne
    {
        return $this->hasOne(WidowSocial::class);
    }

    // Social Income entries
    public function socialIncome(): HasMany
    {
        return $this->hasMany(WidowSocialIncome::class);
    }

    // Social Expense entries
    public function socialExpenses(): HasMany
    {
        return $this->hasMany(WidowSocialExpense::class);
    }

    // Skills (many-to-many)
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'widow_skill');
    }

    // Illnesses (many-to-many)
    public function illnesses(): BelongsToMany
    {
        return $this->belongsToMany(Illness::class, 'widow_illness');
    }

    // Aid Types (many-to-many)
    public function aidTypes(): BelongsToMany
    {
        return $this->belongsToMany(AidType::class, 'widow_aid')->withPivot('is_active');
    }

    // Maouna (allowance) entries
    public function maouna(): HasMany
    {
        return $this->hasMany(WidowMaouna::class);
    }

    // Active Maouna
    public function activeMaouna(): HasMany
    {
        return $this->hasMany(WidowMaouna::class)->where('is_active', true);
    }
}