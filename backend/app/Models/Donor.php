<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Donor extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'is_kafil',
        'total_given',
    ];

    protected $casts = [
        'is_kafil' => 'boolean',
        'total_given' => 'decimal:2',
    ];

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function kafil(): HasOne
    {
        return $this->hasOne(Kafil::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }
}