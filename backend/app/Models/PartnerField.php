<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerField extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
    ];

    public function subfields(): HasMany
    {
        return $this->hasMany(PartnerSubfield::class, 'field_id');
    }

    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class, 'field_id');
    }
}