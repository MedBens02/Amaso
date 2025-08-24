<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartnerSubfield extends Model
{
    use HasFactory;

    protected $fillable = [
        'field_id',
        'label',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(PartnerField::class, 'field_id');
    }

    public function partners(): HasMany
    {
        return $this->hasMany(Partner::class, 'subfield_id');
    }
}