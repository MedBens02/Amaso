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

    // national_id is deliberately not appended: it reads through the donor
    // relation, and appending it would fetch one donor per kafil every time
    // a list of them is serialised.
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
     * The card number, read from the donor record rather than stored here.
     *
     * A kafil row keeps its own copy of the name, phone and address, which
     * is why editing a donor and editing their sponsor record are two
     * separate things that can disagree. A person has one card number, and
     * it is on the donor, so this reads it there instead of adding a sixth
     * field that can drift out of step.
     */
    public function getNationalIdAttribute(): ?string
    {
        return $this->donor?->national_id;
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