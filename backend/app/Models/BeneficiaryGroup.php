<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeneficiaryGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'description',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(BeneficiaryGroupMember::class, 'group_id');
    }

    public function expenseGroups(): HasMany
    {
        return $this->hasMany(ExpenseBeneficiaryGroup::class, 'group_id');
    }
}