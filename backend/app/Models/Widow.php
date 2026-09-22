<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Widow extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'first_name',
        'last_name',
        'phone',
        'email',
        'address',
        'neighborhood',
        'admission_date',
        'national_id',
        'birth_date',
        'husband_death_date',
        'idda_end_date',
        'is_idda_case',
        'marital_status',
        'family_liaison',
        'education_level',
        'disability_flag',
        'disability_type',
        'leaving_date',
        'leaving_reason',
        'leaving_details',
    ];

    protected $casts = [
        'admission_date' => 'date',
        'birth_date' => 'date',
        'husband_death_date' => 'date',
        'idda_end_date' => 'date',
        'is_idda_case' => 'boolean',
        'disability_flag' => 'boolean',
        'leaving_date' => 'date',
    ];

    protected $appends = [
        'full_name',
        'idda',
    ];

    /** Still only a عدة case: supported, not yet one of the families. */
    public const IDDA_ACTIVE = 'active';

    /** Her عدة has run out and nobody has decided about the family yet. */
    public const IDDA_ENDED = 'ended';

    /** Not a عدة case - an ordinary family, whether or not she ever was one. */
    public const IDDA_NONE = 'none';

    /**
     * The families the association actually supports.
     *
     * A woman in عدة is not one of them yet: she is being helped through the
     * waiting period while the case is looked at. Counting her would
     * overstate every figure the association reports, so every list, count
     * and picker that means "our families" goes through this.
     *
     * Applied at the call sites rather than as a global scope. A global one
     * would be safer against a call site nobody remembered, but it would also
     * hide these families from the screen that exists to manage them and from
     * the expense history that has already paid them - and a name silently
     * missing from a paid expense is a worse failure than a count that is
     * visibly wrong.
     */
    public function scopeRegular($query)
    {
        return $query->where('is_idda_case', false);
    }

    /** Families being supported through عدة, whether or not it has run out. */
    public function scopeIddaCases($query)
    {
        return $query->where('is_idda_case', true);
    }

    /**
     * Families whose عدة is still running.
     *
     * These are the only ones the عدة budget can be spent on: once the period
     * is over the allowance stops, and paying it afterwards would be paying
     * for something that has ended.
     */
    public function scopeIddaActive($query)
    {
        return $query->where('is_idda_case', true)
            ->whereNotNull('idda_end_date')
            ->whereDate('idda_end_date', '>=', now()->toDateString());
    }

    /**
     * Where this family stands in her عدة, and what it comes to.
     *
     * The allowance runs from the admission date, not from the death: the
     * association pays from when the case reached them, which is what they
     * asked for and is usually days or weeks after the husband died.
     *
     * Months are counted whole. A part month is left priced at nothing and
     * reported as days instead, because "400 a month" does not say what half
     * a month is worth and inventing an answer would put a figure in front of
     * somebody that the association never agreed to.
     */
    public function getIddaAttribute(): ?array
    {
        if (! $this->is_idda_case) {
            return null;
        }

        $end = $this->idda_end_date;
        $start = $this->admission_date;
        $today = now()->startOfDay();
        $monthly = (float) (Setting::get('idda_monthly_allowance', '400'));

        $status = $end === null
            ? self::IDDA_ACTIVE
            : ($end->copy()->startOfDay()->lt($today) ? self::IDDA_ENDED : self::IDDA_ACTIVE);

        // Nothing is owed before she was admitted, and nothing after the عدة
        // ends - so the elapsed side is measured to whichever came first.
        $paidTo = $end !== null && $end->copy()->startOfDay()->lt($today)
            ? $end->copy()->startOfDay()
            : $today;

        // Floored, because diffInMonths gives a fraction and a fraction of a
        // month is exactly what must not be priced here.
        $monthsElapsed = $start === null
            ? 0
            : max(0, (int) floor($start->copy()->startOfDay()->diffInMonths($paidTo)));
        $monthsTotal = ($start === null || $end === null)
            ? null
            : max(0, (int) floor($start->copy()->startOfDay()->diffInMonths($end->copy()->startOfDay())));

        // The days past the last whole month, shown rather than priced.
        $afterWholeMonths = $start === null
            ? null
            : $start->copy()->startOfDay()->addMonths($monthsElapsed);

        return [
            'status' => $status,
            'end_date' => $end?->toDateString(),
            'monthly_allowance' => $monthly,
            'months_elapsed' => $monthsElapsed,
            'extra_days' => $afterWholeMonths === null
                ? 0
                : max(0, (int) floor($afterWholeMonths->diffInDays($paidTo))),
            'amount_due' => round($monthsElapsed * $monthly, 2),
            'months_total' => $monthsTotal,
            'amount_total' => $monthsTotal === null ? null : round($monthsTotal * $monthly, 2),
            'days_remaining' => ($end === null || $status === self::IDDA_ENDED)
                ? 0
                : max(0, (int) floor($today->diffInDays($end->copy()->startOfDay()))),
        ];
    }


    public function orphans(): HasMany
    {
        return $this->hasMany(Orphan::class);
    }

    // Additional phone numbers (the primary one stays in widows.phone)
    public function phones(): HasMany
    {
        return $this->hasMany(WidowPhone::class);
    }

    public function sponsorships(): HasMany
    {
        return $this->hasMany(KafilSponsorship::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    // Widow Files - Social situation and chronic disease
    public function widowFiles(): HasOne
    {
        return $this->hasOne(WidowFiles::class);
    }

    // Widow Social Information
    public function widowSocial(): HasOne
    {
        return $this->hasOne(WidowSocial::class);
    }

    // Social Income entries
    public function socialIncome(): HasMany
    {
        return $this->hasMany(WidowSocialIncome::class);
    }

    // Social Expense entries
    public function socialExpenses(): HasMany
    {
        return $this->hasMany(WidowSocialExpense::class);
    }

    // Skills (many-to-many)
    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'widow_skill');
    }

    // Illnesses (many-to-many)
    public function illnesses(): BelongsToMany
    {
        return $this->belongsToMany(Illness::class, 'widow_illness');
    }

    // Aid Types (many-to-many)
    public function aidTypes(): BelongsToMany
    {
        return $this->belongsToMany(AidType::class, 'widow_aid')->withPivot('is_active');
    }

    // Maouna (allowance) entries
    public function maouna(): HasMany
    {
        return $this->hasMany(WidowMaouna::class);
    }

    // Active Maouna
    public function activeMaouna(): HasMany
    {
        return $this->hasMany(WidowMaouna::class)->where('is_active', true);
    }
}