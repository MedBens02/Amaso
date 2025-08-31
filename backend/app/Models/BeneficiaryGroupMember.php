<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BeneficiaryGroupMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'beneficiary_id',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(BeneficiaryGroup::class, 'group_id');
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }
}