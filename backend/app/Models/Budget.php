<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'is_idda',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_idda' => 'boolean',
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

    /**
     * The fund the عدة allowance is paid from.
     *
     * Found by its flag rather than its name, so the association can call it
     * whatever they call it without the beneficiary list quietly reverting to
     * showing everybody.
     */
    public static function idda(): ?self
    {
        return static::where('is_idda', true)->first();
    }

    /**
     * Make sure the عدة fund exists, without stepping on the seeded ones.
     *
     * Called from two places and it has to be, for a reason worth writing
     * down. The accounting seeder pins its budget ids - 1 is health care, 2
     * is education, and so on - while this one takes whatever id is next.
     * On a fresh install the migration runs against an empty table and would
     * take id 1, and the seeder would then rename it to الرعاية الصحية and
     * leave the عدة flag sitting on the health fund. Every beneficiary list
     * would then offer only عدة families whenever anybody picked health care,
     * and nothing on screen would say why.
     *
     * So the seeder calls this after its own inserts, when the pinned ids are
     * taken, and the migration calls it for databases that already exist. It
     * is idempotent, and it adopts a fund the association already made and
     * called عدة rather than creating a second one beside it.
     */
    public static function ensureIdda(): self
    {
        $existing = static::where('is_idda', true)->first();

        if ($existing) {
            return $existing;
        }

        $named = static::whereIn('label', ['عدة', 'عدّة'])->first();

        if ($named) {
            $named->update(['is_idda' => true]);

            return $named;
        }

        return static::create(['label' => 'عدّة', 'is_default' => false, 'is_idda' => true]);
    }

    /**
     * What this fund's money is spent on, and where its money comes from.
     *
     * A link rather than ownership: the same category can sit under several
     * funds and still be one category, so a report totalling it sees one row
     * rather than one per fund.
     */
    public function incomeCategories(): BelongsToMany
    {
        return $this->belongsToMany(IncomeCategory::class, 'budget_income_category', 'budget_id', 'category_id')
            ->withTimestamps();
    }

    public function expenseCategories(): BelongsToMany
    {
        return $this->belongsToMany(ExpenseCategory::class, 'budget_expense_category', 'budget_id', 'category_id')
            ->withTimestamps();
    }
}
