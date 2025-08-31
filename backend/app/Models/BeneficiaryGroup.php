<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeneficiaryGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'description',
    ];

    protected $appends = [
        'members_count',
        'name'
    ];

    public function getNameAttribute(): string
    {
        return $this->label ?? '';
    }

    /**
     * Get all beneficiaries that belong to this group
     */
    public function beneficiaries(): BelongsToMany
    {
        return $this->belongsToMany(Beneficiary::class, 'beneficiary_group_members', 'group_id', 'beneficiary_id')
                    ->withTimestamps();
    }

    /**
     * Get the members count attribute
     */
    public function getMembersCountAttribute(): int
    {
        return $this->beneficiaries()->count();
    }

    /**
     * Add beneficiaries to the group
     */
    public function addBeneficiaries(array $beneficiaryIds): void
    {
        $this->beneficiaries()->syncWithoutDetaching($beneficiaryIds);
    }

    /**
     * Remove beneficiaries from the group
     */
    public function removeBeneficiaries(array $beneficiaryIds): void
    {
        $this->beneficiaries()->detach($beneficiaryIds);
    }

    /**
     * Sync beneficiaries (replace all existing with new ones)
     */
    public function syncBeneficiaries(array $beneficiaryIds): void
    {
        $this->beneficiaries()->sync($beneficiaryIds);
    }

    // Legacy support - keeping old relations for backward compatibility
    public function members(): HasMany
    {
        return $this->hasMany(BeneficiaryGroupMember::class, 'group_id');
    }

    public function expenseGroups(): HasMany
    {
        return $this->hasMany(ExpenseBeneficiaryGroup::class, 'group_id');
    }
}