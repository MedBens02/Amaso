<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'widow_id',
        'orphan_id',
    ];

    protected $casts = [
        'type' => 'string',
    ];

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function orphan(): BelongsTo
    {
        return $this->belongsTo(Orphan::class);
    }

    public function beneficiaryGroups(): BelongsToMany
    {
        return $this->belongsToMany(BeneficiaryGroup::class, 'beneficiary_group_members', 'beneficiary_id', 'group_id')
                    ->withTimestamps();
    }

    public function getFullNameAttribute(): string
    {
        if ($this->type === 'Widow' && $this->widow) {
            return $this->widow->first_name . ' ' . $this->widow->last_name;
        } elseif ($this->type === 'Orphan' && $this->orphan) {
            return $this->orphan->first_name . ' ' . $this->orphan->last_name;
        }
        return '';
    }

    public function getDetailsAttribute(): array
    {
        if ($this->type === 'Widow' && $this->widow) {
            return [
                'phone' => $this->widow->phone,
                'address' => $this->widow->address,
                'birth_date' => $this->widow->birth_date,
            ];
        } elseif ($this->type === 'Orphan' && $this->orphan) {
            return [
                'phone' => $this->orphan->phone ?? '',
                'birth_date' => $this->orphan->birth_date,
                'education_level' => $this->orphan->educationLevel->name ?? '',
            ];
        }
        return [];
    }

    protected $appends = [
        'full_name',
        'details'
    ];
}