<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KafilSponsorship extends Model
{
    use HasFactory;

    protected $table = 'kafil_sponsorship';

    protected $fillable = [
        'kafil_id',
        'widow_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function kafil(): BelongsTo
    {
        return $this->belongsTo(Kafil::class);
    }

    public function widow(): BelongsTo
    {
        return $this->belongsTo(Widow::class);
    }

    public function getSponsoredEntityAttribute(): string
    {
        if ($this->widow_id) {
            return $this->widow->full_name;
        }
        return 'غير محدد';
    }

    /**
     * Boot the model to add validation events
     * Note: Validation removed to allow over-budget sponsorships with warnings
     */
    protected static function boot()
    {
        parent::boot();

        // Note: Budget validation moved to controller level to allow warnings
        // instead of hard validation errors
    }

    /**
     * Validate that the kafil can afford this sponsorship amount
     */
    public function validateKafilPledgeAmount(): bool
    {
        $kafil = $this->kafil;
        if (!$kafil) return false;

        // Calculate total other sponsorships (excluding this one if updating)
        $otherSponsorships = $kafil->sponsorships()
            ->where('id', '!=', $this->id ?? 0)
            ->sum('amount');

        $totalAmount = $otherSponsorships + $this->amount;
        
        return $totalAmount <= $kafil->monthly_pledge;
    }

    /**
     * Static method to validate multiple sponsorships for a kafil
     */
    public static function validateMultipleSponsorships(int $kafilId, array $sponsorshipAmounts): bool
    {
        $kafil = Kafil::find($kafilId);
        if (!$kafil) return false;

        $totalNewAmount = array_sum($sponsorshipAmounts);
        $existingAmount = $kafil->total_sponsorship_amount;

        return ($existingAmount + $totalNewAmount) <= $kafil->monthly_pledge;
    }
}