<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\BankAccount;
use App\Models\BeneficiaryGroup;
use App\Models\Donor;
use App\Models\Illness;
use App\Models\Income;
use App\Models\IncomeCategory;
use App\Models\Kafil;
use App\Models\KafalaChamilaSplit;
use App\Models\KafilSponsorship;
use App\Models\OrphanEnrollment;
use App\Models\Partner;
use App\Models\PartnerField;
use App\Models\PartnerSubfield;
use App\Models\School;
use App\Models\Skill;
use App\Models\Budget;
use App\Models\Widow;
use App\Services\ExpenseService;
use App\Services\IncomeService;
use App\Services\KafalaChamilaService;
use App\Services\WidowService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Fictional, entirely made-up data covering every feature area, so the app
 * can be clicked through end to end. Not part of DatabaseSeeder's default
 * run - this is test data, not the reference/config data every environment
 * needs. Run it explicitly:
 *
 *   php artisan db:seed --class=DemoDataSeeder
 *
 * Not idempotent by row-matching (unlike the reference seeders): running it
 * twice against the same database creates a second batch of everything. Run
 * it once against a fresh, empty database.
 */
class DemoDataSeeder extends Seeder
{
    private WidowService $widows;
    private ExpenseService $expenses;
    private IncomeService $incomes;
    private KafalaChamilaService $kafalaChamila;

    public function __construct()
    {
        $this->widows = app(WidowService::class);
        $this->expenses = app(ExpenseService::class);
        $this->incomes = app(IncomeService::class);
        $this->kafalaChamila = app(KafalaChamilaService::class);
    }

    public function run(): void
    {
        $fiscalYearId = DB::table('fiscal_years')->where('is_active', true)->value('id');

        $bankAccounts = $this->seedBankAccounts();
        $partners = $this->seedPartners();
        [$widows, $sponsorlessWidow] = $this->seedWidows($partners);
        [$donors, $kafils] = $this->seedDonorsAndKafils($widows);
        $this->seedSchoolsAndEnrollments($widows);
        $this->seedIncomes($fiscalYearId, $donors, $kafils, $bankAccounts);
        $this->seedExpenses($fiscalYearId, $widows, $bankAccounts);
        $this->seedBeneficiaryGroup($widows);
        $this->archiveOneFamily($sponsorlessWidow);

        $this->command?->info('Demo data seeded: '
            . Widow::count() . ' widows, '
            . \App\Models\Orphan::count() . ' orphans, '
            . Donor::count() . ' donors, '
            . Kafil::count() . ' kafils, '
            . Income::count() . ' incomes, '
            . \App\Models\Expense::count() . ' expenses.');
    }

    private function seedBankAccounts(): array
    {
        return [
            BankAccount::create(['label' => 'الحساب الرئيسي', 'bank_name' => 'بنك التجارة', 'account_number' => 'MA-1001', 'balance' => 50000]),
            BankAccount::create(['label' => 'حساب الكفالات', 'bank_name' => 'بنك الوفاء', 'account_number' => 'MA-1002', 'balance' => 20000]),
        ];
    }

    private function seedPartners(): array
    {
        $field = PartnerField::create(['label' => 'التغذية']);
        $subfield = PartnerSubfield::create(['label' => 'مواد غذائية', 'field_id' => $field->id]);

        return [
            Partner::create(['name' => 'جمعية الإحسان', 'phone' => '0522334455', 'field_id' => $field->id, 'subfield_id' => $subfield->id]),
            Partner::create(['name' => 'مؤسسة الخير', 'phone' => '0522667788', 'field_id' => $field->id, 'subfield_id' => $subfield->id]),
        ];
    }

    /** @return array{0: array<int, Widow>, 1: Widow} */
    private function seedWidows(array $partners): array
    {
        $skills = Skill::pluck('id')->all();
        $illnesses = Illness::pluck('id')->all();

        $families = [
            ['فاطمة', 'الزهراء', 'حي السلام', 2, ['is_schooled' => true]],
            ['خديجة', 'بنعلي', 'حي النور', 3, ['is_schooled' => true]],
            ['أمينة', 'الحسني', 'حي الأمل', 1, ['is_schooled' => true]],
            ['زينب', 'المرابط', 'حي الفتح', 2, ['is_working' => true, 'work_type' => 'خياطة منزلية', 'is_schooled' => false]],
            ['سعاد', 'بوزيان', 'حي الرحمة', 1, ['is_not_interested' => true]],
            ['نادية', 'العلوي', 'حي السلام', 3, ['is_schooled' => true]],
            ['حياة', 'الإدريسي', 'حي النور', 2, ['is_inactive' => true]],
            ['رشيدة', 'التازي', 'حي الأمل', 1, ['is_schooled' => true]],
            ['لطيفة', 'بنجلون', 'حي الفتح', 2, ['is_schooled' => true]],
            ['سميرة', 'الوردي', 'حي الرحمة', 1, ['is_married' => true, 'is_schooled' => false]],
            ['كريمة', 'الفاسي', 'حي السلام', 2, ['is_schooled' => true]],
        ];

        $created = [];
        foreach ($families as $index => [$first, $last, $neighborhood, $orphanCount, $orphanFlags]) {
            $children = [];
            for ($i = 0; $i < $orphanCount; $i++) {
                $children[] = array_merge([
                    'first_name' => ['يوسف', 'مريم', 'أحمد', 'سلمى', 'إلياس'][($index + $i) % 5],
                    'last_name' => $last,
                    'birth_date' => now()->subYears(rand(4, 17))->subDays(rand(0, 300))->format('Y-m-d'),
                    'gender' => $i % 2 === 0 ? 'male' : 'female',
                    'is_schooled' => true,
                ], $orphanFlags);
            }

            $widow = $this->widows->create([
                'first_name' => $first,
                'last_name' => $last,
                'phone' => '06' . rand(10000000, 99999999),
                'address' => "شارع {$index}, {$neighborhood}",
                'neighborhood' => $neighborhood,
                'admission_date' => now()->subMonths(rand(3, 30))->format('Y-m-d'),
                'national_id' => 'DEMO' . str_pad((string) ($index + 1), 6, '0', STR_PAD_LEFT),
                'birth_date' => now()->subYears(rand(30, 55))->format('Y-m-d'),
                'marital_status' => 'Widowed',
                'family_liaison' => $index % 4 === 0 ? 'عمة الأيتام' : null,
                'social_situation' => 'widow',
                'has_chronic_disease' => $index % 3 === 0,
                'has_maouna' => $index % 2 === 0,
                'extra_phones' => $index % 3 === 0 ? [['phone' => '05' . rand(10000000, 99999999), 'label' => 'هاتف الجيران']] : [],
                'children' => $children,
                'skills' => $skills ? [$skills[$index % count($skills)]] : [],
                'illnesses' => $illnesses ? [$illnesses[$index % count($illnesses)]] : [],
                'maouna' => $index % 2 === 0 ? [['partner_id' => $partners[$index % count($partners)]->id, 'amount' => rand(200, 500)]] : [],
            ]);

            $created[] = $widow;
        }

        return [$created, end($created)];
    }

    /** @return array{0: array<int, Donor>, 1: array<int, Kafil>} */
    private function seedDonorsAndKafils(array $widows): array
    {
        $donorNames = [
            ['عبد الكريم', 'الودغيري'], ['خالد', 'بنموسى'], ['ياسمين', 'الشرقاوي'],
            ['محمد', 'الغالي'], ['سارة', 'أمين'], ['عثمان', 'الفيلالي'],
            ['ليلى', 'حمداوي'], ['طارق', 'بوستة'],
        ];

        $donors = [];
        foreach ($donorNames as $index => [$first, $last]) {
            $donors[] = Donor::create([
                'first_name' => $first,
                'last_name' => $last,
                'phone' => '06' . rand(10000000, 99999999),
                'email' => strtolower($first) . '.' . strtolower($last) . '@example.com',
                'is_kafil' => $index < 4,
            ]);
        }

        $kafils = [];
        for ($i = 0; $i < 4; $i++) {
            $kafil = Kafil::create([
                'donor_id' => $donors[$i]->id,
                'first_name' => $donors[$i]->first_name,
                'last_name' => $donors[$i]->last_name,
                'phone' => $donors[$i]->phone,
                'email' => $donors[$i]->email,
                'monthly_pledge' => [800, 1600, 800, 400][$i],
            ]);
            $kafils[] = $kafil;

            // First two kafils sponsor one family each; the third sponsors two.
            $sponsoredWidows = match ($i) {
                0 => [$widows[0]],
                1 => [$widows[1]],
                2 => [$widows[2], $widows[3]],
                default => [],
            };
            foreach ($sponsoredWidows as $widow) {
                KafilSponsorship::create([
                    'kafil_id' => $kafil->id,
                    'widow_id' => $widow->id,
                    'amount' => $i === 1 ? 800 : 400,
                ]);
            }
        }

        return [$donors, $kafils];
    }

    private function seedSchoolsAndEnrollments(array $widows): void
    {
        // `type` is the education stage; public vs. private is the separate flag.
        $schools = [
            School::create(['name' => 'مدرسة الأمل الابتدائية', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]),
            School::create(['name' => 'ثانوية النهضة', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]),
            School::create(['name' => 'مدرسة النور الخاصة', 'type' => School::TYPE_SCHOOL, 'is_private' => true, 'is_amaso_linked' => true]),
            School::create(['name' => 'إعدادية الفتح', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]),
            School::create(['name' => 'كلية العلوم - جامعة ابن زهر', 'type' => School::TYPE_UNIVERSITY, 'is_private' => false, 'is_amaso_linked' => false]),
            School::create(['name' => 'المعهد العالي للتكنولوجيا التطبيقية', 'type' => School::TYPE_UNIVERSITY, 'is_private' => true, 'is_amaso_linked' => false]),
        ];

        // EducationSeeder already creates the current academic year.
        $academicYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::create([
                'start_year' => (int) now()->format('Y'),
                'label' => AcademicYear::labelFor((int) now()->format('Y')),
                'is_current' => true,
            ]);

        $educationLevelIds = DB::table('orphans_education_level')->orderBy('sort_order')->pluck('id')->all();
        $statuses = ['enrolled', 'enrolled', 'enrolled', 'passed', 'failed'];

        $index = 0;
        foreach ($widows as $widow) {
            foreach ($widow->orphans as $orphan) {
                if (!$orphan->is_schooled) {
                    continue;
                }

                $school = $schools[$index % count($schools)];
                $isUniversity = $school->type === School::TYPE_UNIVERSITY;

                // A spread of marks so the rankings and the top-N cut have
                // something to actually sort, plus a few students left ungraded
                // to exercise the "not yet graded" path.
                $graded = $index % 7 !== 0;

                // Creating the family already opened an enrollment for the
                // current year, so this fills it in rather than inserting again.
                OrphanEnrollment::updateOrCreate(
                    ['orphan_id' => $orphan->id, 'academic_year_id' => $academicYear->id],
                    [
                        'education_level_id' => $educationLevelIds[array_rand($educationLevelIds)] ?? null,
                        'school_id' => $school->id,
                        'specialty' => $isUniversity ? ['علوم الحياة والأرض', 'الإعلاميات', 'الاقتصاد'][$index % 3] : null,
                        'status' => $statuses[$index % count($statuses)],
                        'grade_scale' => 20,
                        'first_semester_grade' => $graded ? round(mt_rand(700, 1900) / 100, 2) : null,
                        'second_semester_grade' => $graded && $index % 5 !== 0 ? round(mt_rand(700, 1950) / 100, 2) : null,
                    ]
                );
                $index++;
            }
        }
    }

    private function seedIncomes(int $fiscalYearId, array $donors, array $kafils, array $bankAccounts): void
    {
        $generalBudgetId = Budget::where('is_default', true)->value('id') ?? Budget::value('id');

        $donationCategory = IncomeCategory::where('label', 'تبرعات عامة')->first()
            ?? IncomeCategory::whereNotIn('id', [999])->first();

        // Plain donations, mixed payment methods and approval status.
        foreach (array_slice($donors, 4) as $index => $donor) {
            $income = Income::create([
                'fiscal_year_id' => $fiscalYearId,
                'budget_id' => $generalBudgetId,
                'income_category_id' => $donationCategory->id,
                'donor_id' => $donor->id,
                'income_date' => now()->subDays(rand(1, 90))->format('Y-m-d'),
                'amount' => [500, 1200, 300, 2000][$index % 4],
                'payment_method' => 'Cash',
                'receipt_number' => 'RC-' . (1000 + $index),
                'status' => 'Draft',
                'created_by' => 1,
            ]);
            if ($index % 2 === 0) {
                $this->incomes->approve($income);
            }
        }

        // Per-widow kafala income (the older mechanic - still valid, just
        // superseded by kafala chamila for new payments). Given to the kafil
        // sponsoring two families, so both mechanics and a multi-family
        // sponsor are exercised. Goes through IncomeService::approve() (not
        // a raw status='Approved' create) so the BankWire balance credit
        // actually fires.
        $kafalaBudget = Budget::where('label', 'كفالة شاملة')->first();
        $kafalaCategory = IncomeCategory::where('label', 'كفالة شاملة')->first();
        if ($kafalaBudget && $kafalaCategory) {
            $multiFamilyKafilId = KafilSponsorship::select('kafil_id')
                ->groupBy('kafil_id')
                ->havingRaw('COUNT(*) > 1')
                ->value('kafil_id');

            foreach (KafilSponsorship::where('kafil_id', $multiFamilyKafilId)->get() as $sponsorship) {
                $income = Income::create([
                    'fiscal_year_id' => $fiscalYearId,
                    'budget_id' => $kafalaBudget->id,
                    'income_category_id' => $kafalaCategory->id,
                    'kafil_id' => $sponsorship->kafil_id,
                    'widow_id' => $sponsorship->widow_id,
                    'income_date' => now()->subDays(rand(1, 60))->format('Y-m-d'),
                    'amount' => $sponsorship->amount,
                    'payment_method' => 'BankWire',
                    'bank_account_id' => $bankAccounts[1]->id,
                    'status' => 'Draft',
                    'created_by' => 1,
                ]);
                $this->incomes->approve($income);
            }
        }

        // Kafala chamila (the 800dhs comprehensive package, 7-way split) -
        // one designated to a family and approved (so it actually shows up
        // in that kafil's statement), one left as a pending Draft batch (so
        // the incomes list has something awaiting approval too).
        $splitRules = KafalaChamilaSplit::orderBy('sort_order')->get();
        if ($splitRules->isNotEmpty() && count($kafils) > 0) {
            $percentTotal = $splitRules->sum(fn ($rule) => (float) $rule->percentage);
            $splitsFor = fn (float $total) => $splitRules->map(fn ($rule) => [
                'split_id' => $rule->id,
                'amount' => round($total * ((float) $rule->percentage / $percentTotal), 2),
            ])->all();

            $firstSponsorship = KafilSponsorship::where('kafil_id', $kafils[0]->id)->first();
            $firstBatch = $this->kafalaChamila->createIncomeBatch([
                'kafil_id' => $kafils[0]->id,
                'widow_id' => $firstSponsorship?->widow_id,
                'fiscal_year_id' => $fiscalYearId,
                'income_date' => now()->subDays(15)->format('Y-m-d'),
                'payment_method' => 'Cash',
                'receipt_number' => 'RC-KC-1',
                'status' => 'Draft',
                'created_by' => 1,
            ], $splitsFor(800));
            foreach ($firstBatch as $income) {
                $this->incomes->approve($income);
            }

            $this->kafalaChamila->createIncomeBatch([
                'kafil_id' => $kafils[1]->id,
                'fiscal_year_id' => $fiscalYearId,
                'income_date' => now()->subDays(5)->format('Y-m-d'),
                'payment_method' => 'Cash',
                'receipt_number' => 'RC-KC-2',
                'status' => 'Draft',
                'created_by' => 1,
            ], $splitsFor(800));
        }
    }

    private function seedExpenses(int $fiscalYearId, array $widows, array $bankAccounts): void
    {
        $generalBudgetId = Budget::where('is_default', true)->value('id') ?? Budget::value('id');

        $categories = DB::table('expense_categories')->where('id', '!=', 999)->get();
        $beneficiaryByWidowId = DB::table('beneficiaries')->pluck('id', 'widow_id');

        foreach (array_slice($widows, 0, 6) as $index => $widow) {
            $category = $categories[$index % $categories->count()];
            $budgetId = $generalBudgetId;
            $beneficiaryId = $beneficiaryByWidowId[$widow->id] ?? null;

            $expense = $this->expenses->create([
                'fiscal_year_id' => $fiscalYearId,
                'budget_id' => $budgetId,
                'expense_category_id' => $category->id,
                'expense_date' => now()->subDays(rand(1, 75))->format('Y-m-d'),
                'amount' => [300, 750, 1200, 450, 600, 900][$index],
                'payment_method' => 'Cash',
                'receipt_number' => 'EX-' . (2000 + $index),
                'unrelated_to_benef' => $beneficiaryId === null,
                'beneficiaries' => $beneficiaryId ? [['beneficiary_id' => $beneficiaryId, 'amount' => [300, 750, 1200, 450, 600, 900][$index]]] : [],
            ]);

            if ($index % 2 === 0) {
                $this->expenses->approve($expense);
            }
        }

        // One general-overhead expense, not tied to any family. Approved, so
        // its BankWire deduction actually exercises the bank balance effect.
        $overheadCategory = $categories->first();
        $overhead = $this->expenses->create([
            'fiscal_year_id' => $fiscalYearId,
            'budget_id' => $generalBudgetId,
            'expense_category_id' => $overheadCategory->id,
            'expense_date' => now()->subDays(10)->format('Y-m-d'),
            'amount' => 1500,
            'payment_method' => 'BankWire',
            'bank_account_id' => $bankAccounts[0]->id,
            'unrelated_to_benef' => true,
        ]);
        $this->expenses->approve($overhead);
    }

    private function seedBeneficiaryGroup(array $widows): void
    {
        $group = BeneficiaryGroup::create(['label' => 'مجموعة حي السلام', 'description' => 'الأسر المستفيدة في حي السلام']);

        $beneficiaryIds = DB::table('beneficiaries')
            ->whereIn('widow_id', collect($widows)->take(3)->pluck('id'))
            ->pluck('id');

        foreach ($beneficiaryIds as $beneficiaryId) {
            DB::table('beneficiary_group_members')->insert([
                'group_id' => $group->id,
                'beneficiary_id' => $beneficiaryId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function archiveOneFamily(Widow $widow): void
    {
        // Demonstrates the archive feature - only works on a family with no
        // active sponsorships, which is why this one was chosen.
        $this->widows->archive($widow, [
            'leaving_date' => now()->subDays(3)->format('Y-m-d'),
            'leaving_reason' => 'graduated',
            'leaving_details' => 'انتقلت الأسرة إلى مدينة أخرى بعد تحسن وضعها',
        ]);
    }
}
