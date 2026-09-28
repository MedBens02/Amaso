<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HousingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
    ];

    /** The families living in this kind of housing. */
    public function widowSocials(): HasMany
    {
        return $this->hasMany(WidowSocial::class);
    }
}