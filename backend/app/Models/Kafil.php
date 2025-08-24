<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kafil extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'donor_id',
        'monthly_pledge',
    ];

    protected $casts = [
        'monthly_pledge' => 'decimal:2',
    ];

    protected $appends = [
        'full_name',
        'total_sponsorship_amount',
        'remaining_pledge_amount',
        'sponsorship_utilization',
    ];

    public function donor(): BelongsTo
    {
        return $this->belongsTo(Donor::class);
    }

    public function sponsorships(): HasMany
    {
        return $this->hasMany(KafilSponsorship::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    /**
     * Get the total amount currently sponsored by this kafil
     */
    public function getTotalSponsorshipAmountAttribute(): float
    {
        return (float) $this->sponsorships->sum('amount');
    }

    /**
     * Get the remaining amount available for new sponsorships
     */
    public function getRemainingPledgeAmountAttribute(): float
    {
        return (float) ($this->monthly_pledge - $this->total_sponsorship_amount);
    }

    /**
     * Check if this kafil can afford a new sponsorship amount
     */
    public function canAffordSponsorship(float $amount): bool
    {
        return $this->remaining_pledge_amount >= $amount;
    }

    /**
     * Check if multiple sponsorship amounts can be afforded
     */
    public function canAffordSponsorships(array $amounts): bool
    {
        $totalNewAmount = array_sum($amounts);
        return $this->remaining_pledge_amount >= $totalNewAmount;
    }

    /**
     * Get sponsorship utilization percentage
     */
    public function getSponsorshipUtilizationAttribute(): float
    {
        if ($this->monthly_pledge == 0) return 0;
        return ($this->total_sponsorship_amount / $this->monthly_pledge) * 100;
    }
}