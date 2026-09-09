<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A fund: money goes in, money comes out, and what is left is its balance.
 *
 * Deliberately separate from categories. A budget answers "which pot did this
 * come out of"; a category answers "what was it for". Keeping them apart is
 * what lets any category be used from any budget, and what lets the kafala
 * chamila parts be real funds with their own balances.
 */
class Budget extends Model
{
    use HasFactory;

    protected $fillable = [
        'label',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /** The fund used for anything not tied to a specific one. */
    public static function default(): ?self
    {
        return static::where('is_default', true)->first();
    }
}
