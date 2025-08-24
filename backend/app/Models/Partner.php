<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'field_id',
        'subfield_id',
    ];

    public function field(): BelongsTo
    {
        return $this->belongsTo(PartnerField::class, 'field_id');
    }

    public function subfield(): BelongsTo
    {
        return $this->belongsTo(PartnerSubfield::class, 'subfield_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}