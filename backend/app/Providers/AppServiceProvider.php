<?php

namespace App\Providers;

use App\Observers\AuditObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Everything the activity log follows.
     *
     * These are the records the association manages in their own right - the
     * ones somebody would go looking for later. Their sub-rows are not here
     * on purpose: a family's phone numbers, social income lines, expense
     * lines and maouna entries are fields of the family form rather than
     * records of their own, and the form replaces each of those sections
     * wholesale on save. Following them individually would fill the log with
     * "created" rows that have no matching "deleted" (a mass delete fires no
     * model events), which reads as though rows keep appearing from nowhere.
     * WidowService records those sections against the family instead.
     *
     * bank_account_transactions is likewise absent: it is already an
     * append-only money trail carrying its own created_by, and every row in
     * it exists because of an approval or transfer that is logged here.
     */
    private const AUDITED = [
        // Money
        \App\Models\Income::class,
        \App\Models\Expense::class,
        \App\Models\Transfer::class,
        \App\Models\BankAccount::class,
        \App\Models\FiscalYear::class,

        // Accounting references
        \App\Models\Budget::class,
        \App\Models\IncomeCategory::class,
        \App\Models\ExpenseCategory::class,
        \App\Models\KafalaChamilaSplit::class,

        // Beneficiaries and sponsors
        \App\Models\Widow::class,
        \App\Models\Orphan::class,
        \App\Models\Donor::class,
        \App\Models\Kafil::class,
        \App\Models\KafilSponsorship::class,
        \App\Models\BeneficiaryGroup::class,

        // Education
        \App\Models\School::class,
        \App\Models\AcademicYear::class,
        \App\Models\OrphanEnrollment::class,
        \App\Models\OrphansEducationLevel::class,

        // Reference data
        \App\Models\AidType::class,
        \App\Models\Illness::class,
        \App\Models\Skill::class,
        \App\Models\HousingType::class,
        \App\Models\Partner::class,
        \App\Models\PartnerField::class,
        \App\Models\PartnerSubfield::class,
        \App\Models\WidowIncomeCategory::class,
        \App\Models\WidowExpenseCategory::class,

        // Administration
        \App\Models\User::class,
        \App\Models\Setting::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        foreach (self::AUDITED as $model) {
            $model::observe(AuditObserver::class);
        }
    }
}
