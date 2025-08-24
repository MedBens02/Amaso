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
     */
    protected static function boot()
    {
        parent::boot();

        // Validate before creating a new sponsorship
        static::creating(function ($sponsorship) {
            if (!$sponsorship->validateKafilPledgeAmount()) {
                throw new \Exception('مبلغ الكفالة يتجاوز التعهد الشهري المتاح للكفيل');
            }
        });

        // Validate before updating an existing sponsorship
        static::updating(function ($sponsorship) {
            if (!$sponsorship->validateKafilPledgeAmount()) {
                throw new \Exception('مبلغ الكفالة يتجاوز التعهد الشهري المتاح للكفيل');
            }
        });
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