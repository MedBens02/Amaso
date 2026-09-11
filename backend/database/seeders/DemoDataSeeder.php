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
use App\Models\Transfer;
use App\Models\Widow;
use App\Services\ExpenseService;
use App\Services\IncomeService;
use App\Services\KafalaChamilaService;
use App\Services\TransferService;
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
    private TransferService $transfers;

    public function __construct()
    {
        $this->widows = app(WidowService::class);
        $this->expenses = app(ExpenseService::class);
        $this->incomes = app(IncomeService::class);
        $this->kafalaChamila = app(KafalaChamilaService::class);
        $this->transfers = app(TransferService::class);
    }

    public function run(): void
    {
        // Three fiscal years and three academic years, so the year-over-year
        // reports, the academic-year filter and the "all periods" exports
        // have more than one period to actually compare.
        $fiscalYears = $this->seedFiscalYears();
        $academicYears = $this->seedAcademicYears();
        $fiscalYearId = end($fiscalYears)['id'];

        $bankAccounts = $this->seedBankAccounts();
        $partners = $this->seedPartners();
        [$widows, $sponsorlessWidow] = $this->seedWidows($partners);
        [$donors, $kafils] = $this->seedDonorsAndKafils($widows);
        $this->seedSchoolsAndEnrollments($widows, $academicYears);
        $this->seedIncomes($fiscalYearId, $donors, $kafils, $bankAccounts);
        $this->seedExpenses($fiscalYearId, $widows, $bankAccounts);
        $this->seedTransfers($fiscalYearId, $bankAccounts);
        $this->seedPriorYears($fiscalYears, $donors, $widows);
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

    /**
     * The active year plus the two before it. Prior years are left open
     * rather than closed: closing one is a deliberate action a demo should
     * show being performed, not arrive having already happened.
     *
     * @return array<int, array{id: int, year: int, active: bool}>
     */
    private function seedFiscalYears(): array
    {
        $current = (int) date('Y');
        $years = [];

        foreach ([$current - 2, $current - 1, $current] as $year) {
            $isActive = $year === $current;

            DB::table('fiscal_years')->updateOrInsert(
                ['year' => $year],
                [
                    'is_active' => $isActive,
                    'carryover_prev_year' => 0,
                    'carryover_next_year' => 0,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $years[] = [
                'id' => (int) DB::table('fiscal_years')->where('year', $year)->value('id'),
                'year' => $year,
                'active' => $isActive,
            ];
        }

        return $years;
    }

    /**
     * @return array<int, AcademicYear> oldest first, current last
     */
    private function seedAcademicYears(): array
    {
        // Academic years run September-August, so before September the year
        // in progress is the one that started last calendar year.
        $currentStart = (int) date('n') >= 9 ? (int) date('Y') : (int) date('Y') - 1;

        $years = [];
        foreach ([$currentStart - 2, $currentStart - 1, $currentStart] as $startYear) {
            $years[] = AcademicYear::updateOrCreate(
                ['start_year' => $startYear],
                [
                    'label' => AcademicYear::labelFor($startYear),
                    'is_current' => $startYear === $currentStart,
                ]
            );
        }

        return $years;
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
        $aidTypes = DB::table('aid_types')->orderBy('id')->pluck('id')->all();
        $housingTypes = DB::table('housing_types')->orderBy('id')->pluck('id')->all();
        $familyIncomeCategories = DB::table('widow_income_categories')->orderBy('id')->pluck('id')->all();
        $familyExpenseCategories = DB::table('widow_expense_categories')->orderBy('id')->pluck('id')->all();
        $educationLevels = DB::table('orphans_education_level')->orderBy('sort_order')->pluck('id')->all();

        // Enough families that the lists paginate, the neighbourhood
        // breakdown has shape, and the school reports have a real cohort to
        // rank. The unusual cases are kept deliberately: a mother who works,
        // a family that declined help, an inactive file, a married orphan,
        // and one family with no children at all.
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
            ['نعيمة', 'بركة', 'حي المسيرة', 4, ['is_schooled' => true]],
            ['حنان', 'الصقلي', 'حي النهضة', 2, ['is_schooled' => true]],
            ['بشرى', 'العمراني', 'حي الوفاق', 3, ['is_schooled' => true]],
            ['مليكة', 'الحداد', 'حي السلام', 1, ['is_working' => true, 'work_type' => 'تنظيف', 'is_schooled' => true]],
            ['سناء', 'الرامي', 'حي النور', 2, ['is_schooled' => true]],
            ['وفاء', 'الشامي', 'حي المسيرة', 3, ['is_schooled' => true]],
            ['ثريا', 'بنعمر', 'حي الأمل', 2, ['is_schooled' => true]],
            ['جميلة', 'الكتاني', 'حي النهضة', 1, ['is_schooled' => true]],
            ['رجاء', 'السباعي', 'حي الفتح', 3, ['is_schooled' => true]],
            ['هدى', 'المنصوري', 'حي الوفاق', 2, ['is_schooled' => true]],
            ['أسماء', 'بلحاج', 'حي الرحمة', 4, ['is_schooled' => true]],
            ['ابتسام', 'الغزواني', 'حي المسيرة', 1, ['is_schooled' => true]],
            ['مينة', 'الرگراگي', 'حي النهضة', 2, ['is_working' => true, 'work_type' => 'بيع منتجات منزلية', 'is_schooled' => true]],
            ['فتيحة', 'أوبيهي', 'حي الوفاق', 3, ['is_schooled' => true]],
            ['زهور', 'التمسماني', 'حي السلام', 0, []],
        ];

        $created = [];
        foreach ($families as $index => [$first, $last, $neighborhood, $orphanCount, $orphanFlags]) {
            $children = [];
            for ($i = 0; $i < $orphanCount; $i++) {
                // Ages spread from primary school to university rather than
                // clustering in one band, so the age-group breakdown, the
                // school-stage rankings and the university specialties all
                // have somebody in them.
                $age = 6 + (($index * 3 + $i * 5) % 17);
                $levelId = $this->educationLevelForAge($educationLevels, $age);

                $children[] = array_merge([
                    'first_name' => ['يوسف', 'مريم', 'أحمد', 'سلمى', 'إلياس', 'زكرياء', 'خديجة', 'عمر', 'هاجر', 'أيوب', 'نور', 'حمزة'][($index + $i) % 12],
                    'last_name' => $last,
                    'birth_date' => now()->subYears($age)->subDays(rand(0, 300))->format('Y-m-d'),
                    'gender' => $i % 2 === 0 ? 'male' : 'female',
                    'is_schooled' => true,
                    'education_level_id' => $levelId,
                    'masar_code' => 'M' . str_pad((string) (($index + 1) * 100 + $i), 9, '0', STR_PAD_LEFT),
                    // Only the ones old enough to hold a card and a line of
                    // their own; the rest are reached through their mother.
                    'cin' => $age >= 18 ? 'D' . rand(100000, 999999) : null,
                    'phone' => $age >= 18 ? '06' . rand(10000000, 99999999) : null,
                    'health_status' => $i === 0 && $index % 6 === 0 ? 'ربو مزمن - متابعة شهرية' : null,
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
                'education_level' => ['بدون', 'ابتدائي', 'إعدادي', 'ثانوي', 'جامعي'][$index % 5],
                // One family carries a disability, since the field is
                // conditional in the form and worth seeing filled in.
                'disability_flag' => $index === 12,
                'disability_type' => $index === 12 ? 'إعاقة حركية جزئية' : null,
                'social_situation' => 'widow',
                'has_chronic_disease' => $index % 3 === 0,
                'has_maouna' => $index % 2 === 0,
                'extra_phones' => $index % 3 === 0 ? [['phone' => '05' . rand(10000000, 99999999), 'label' => 'هاتف الجيران']] : [],

                // Housing and utilities - what the social survey captures, and
                // what the housing breakdown on the dashboard counts.
                'housing_type_id' => $housingTypes[$index % count($housingTypes)],
                'housing_status' => ['rented', 'owned', 'free'][$index % 3],
                'has_water' => $index % 5 !== 0,
                'has_electricity' => $index % 7 !== 0,
                'has_furniture' => $index % 6,

                // The family's own monthly budget, shown on the family file
                // next to what the association gives - the gap between the two
                // is the whole point of recording it.
                'income' => $this->familyIncome($familyIncomeCategories, $index),
                'expenses' => $this->familyExpenses($familyExpenseCategories, $index, $orphanCount),

                'children' => $children,
                'skills' => $skills ? [$skills[$index % count($skills)]] : [],
                'illnesses' => $illnesses ? [$illnesses[$index % count($illnesses)]] : [],
                'aid_types' => $this->aidTypesFor($aidTypes, $index),
                'maouna' => $index % 2 === 0 ? [['partner_id' => $partners[$index % count($partners)]->id, 'amount' => rand(200, 500)]] : [],
            ]);

            $created[] = $widow;
        }

        return [$created, end($created)];
    }

    /**
     * Maps an age onto the reference education levels, which are ordered
     * not-enrolled, kindergarten, the twelve school grades, then the
     * post-school stages. A six year old sits in first grade and each year
     * after steps one along, so a child's level matches their birth date
     * instead of being drawn at random.
     *
     * @param  array<int, int>  $levelIds  ids in sort_order
     */
    private function educationLevelForAge(array $levelIds, int $age): ?int
    {
        if ($levelIds === []) {
            return null;
        }

        $position = match (true) {
            $age < 5 => 0,
            $age === 5 => 1,
            // Six is first grade, and each year after steps one grade on,
            // through to the last year of secondary at seventeen.
            $age <= 17 => $age - 4,
            // The two "graduated" levels are deliberately skipped: they
            // describe someone who has left, and every child seeded here is
            // still enrolled somewhere.
            $age <= 24 => 15,
            default => 16,
        };

        return $levelIds[min($position, count($levelIds) - 1)] ?? null;
    }

    /**
     * A small, plausible household income: most families have a pension or a
     * standing allowance, some add a little from a trade or piecework, and a
     * few have nothing of their own at all.
     *
     * @param  array<int, int>  $categoryIds
     * @return array<int, array<string, mixed>>
     */
    private function familyIncome(array $categoryIds, int $index): array
    {
        if ($categoryIds === [] || $index % 8 === 3) {
            return [];
        }

        $entries = [[
            'category_id' => $categoryIds[$index % 2],
            'amount' => [600, 850, 400, 1100, 750][$index % 5],
            'description' => 'مدخول شهري قار',
        ]];

        if ($index % 3 === 0 && count($categoryIds) > 4) {
            $entries[] = [
                'category_id' => $categoryIds[4],
                'amount' => [200, 350, 500][$index % 3],
                'description' => 'عمل موسمي',
            ];
        }

        return $entries;
    }

    /**
     * Rent, food and one variable line, scaled by the number of children -
     * enough for the family file to show spending running ahead of income,
     * which is the situation the association exists to close.
     *
     * @param  array<int, int>  $categoryIds
     * @return array<int, array<string, mixed>>
     */
    private function familyExpenses(array $categoryIds, int $index, int $orphanCount): array
    {
        if ($categoryIds === []) {
            return [];
        }

        $entries = [
            [
                'category_id' => $categoryIds[1],
                'amount' => 500 + $orphanCount * 250,
                'description' => 'مصاريف التغذية',
            ],
        ];

        // Only the families that rent carry a rent line.
        if ($index % 3 === 0) {
            $entries[] = [
                'category_id' => $categoryIds[0],
                'amount' => [700, 900, 1200][$index % 3],
                'description' => 'كراء السكن',
            ];
        }

        $variable = $index % 4;
        if (isset($categoryIds[2 + $variable])) {
            $entries[] = [
                'category_id' => $categoryIds[2 + $variable],
                'amount' => [150, 300, 220, 400][$variable],
                'description' => null,
            ];
        }

        return $entries;
    }

    /**
     * One to three kinds of aid per family, so the aid-type filter on the
     * families list returns something for every option.
     *
     * @param  array<int, int>  $aidTypeIds
     * @return array<int, int>
     */
    private function aidTypesFor(array $aidTypeIds, int $index): array
    {
        if ($aidTypeIds === []) {
            return [];
        }

        $count = count($aidTypeIds);
        $selected = [$aidTypeIds[$index % $count]];

        if ($index % 2 === 0) {
            $selected[] = $aidTypeIds[($index + 3) % $count];
        }

        if ($index % 5 === 0) {
            $selected[] = $aidTypeIds[($index + 5) % $count];
        }

        return array_values(array_unique($selected));
    }

    /** @return array{0: array<int, Donor>, 1: array<int, Kafil>} */
    private function seedDonorsAndKafils(array $widows): array
    {
        $donorNames = [
            ['عبد الكريم', 'الودغيري'], ['خالد', 'بنموسى'], ['ياسمين', 'الشرقاوي'],
            ['محمد', 'الغالي'], ['سارة', 'أمين'], ['عثمان', 'الفيلالي'],
            ['ليلى', 'حمداوي'], ['طارق', 'بوستة'], ['رشيد', 'العلمي'],
            ['نبيلة', 'بنكيران'], ['يوسف', 'الحلو'], ['سلمى', 'برادة'],
            ['إدريس', 'المكاوي'], ['غزلان', 'الطاهري'], ['أنس', 'زروال'],
            ['سميرة', 'القادري'], ['مصطفى', 'العروسي'], ['نزهة', 'بنشقرون'],
        ];

        $donors = [];
        foreach ($donorNames as $index => [$first, $last]) {
            $donors[] = Donor::create([
                'first_name' => $first,
                'last_name' => $last,
                'phone' => '06' . rand(10000000, 99999999),
                'email' => strtolower($first) . '.' . strtolower($last) . '@example.com',
                'is_kafil' => $index < 8,
            ]);
        }

        $kafils = [];
        $pledges = [800, 1600, 800, 400, 2400, 800, 1200, 800];
        for ($i = 0; $i < 8; $i++) {
            $kafil = Kafil::create([
                'donor_id' => $donors[$i]->id,
                'first_name' => $donors[$i]->first_name,
                'last_name' => $donors[$i]->last_name,
                'phone' => $donors[$i]->phone,
                'email' => $donors[$i]->email,
                'monthly_pledge' => $pledges[$i],
            ]);
            $kafils[] = $kafil;

            // A spread of arrangements: single-family sponsors, one covering
            // two families, one covering three, and the last left with no
            // family yet so the sponsorship-gap report has both sides of its
            // question - unsponsored families and unassigned sponsors.
            $sponsoredWidows = match ($i) {
                0 => [$widows[0]],
                1 => [$widows[1]],
                2 => [$widows[2], $widows[3]],
                3 => [$widows[5]],
                4 => [$widows[6], $widows[7], $widows[8]],
                5 => [$widows[10]],
                6 => [$widows[12], $widows[13]],
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

    private function seedSchoolsAndEnrollments(array $widows, array $academicYears): void
    {
        // `type` is the education stage; public vs. private is the separate flag.
        $primary = School::create(['name' => 'مدرسة الأمل الابتدائية', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]);
        $privatePrimary = School::create(['name' => 'مدرسة النور الخاصة', 'type' => School::TYPE_SCHOOL, 'is_private' => true, 'is_amaso_linked' => true]);
        $middle = School::create(['name' => 'إعدادية الفتح', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]);
        $high = School::create(['name' => 'ثانوية النهضة', 'type' => School::TYPE_SCHOOL, 'is_private' => false, 'is_amaso_linked' => false]);
        $faculty = School::create(['name' => 'كلية العلوم - جامعة ابن زهر', 'type' => School::TYPE_UNIVERSITY, 'is_private' => false, 'is_amaso_linked' => false]);
        $institute = School::create(['name' => 'المعهد العالي للتكنولوجيا التطبيقية', 'type' => School::TYPE_UNIVERSITY, 'is_private' => true, 'is_amaso_linked' => false]);

        $educationLevelIds = DB::table('orphans_education_level')->orderBy('sort_order')->pluck('id')->all();
        $statuses = ['enrolled', 'enrolled', 'enrolled', 'passed', 'failed'];
        $currentYear = end($academicYears);
        $lastYearIndex = count($academicYears) - 1;

        $index = 0;
        foreach ($widows as $widow) {
            foreach ($widow->orphans as $orphan) {
                if (!$orphan->is_schooled) {
                    continue;
                }

                // The child's level was set from their age when the family was
                // created; the school has to match it, or a nine year old ends
                // up enrolled in a faculty.
                $position = array_search($orphan->education_level_id, $educationLevelIds, true);
                $position = $position === false ? 5 : $position;

                foreach ($academicYears as $yearOffset => $academicYear) {
                    $isCurrent = $academicYear->id === $currentYear->id;

                    // Each year back is a year earlier in school, floored at
                    // first grade so nobody regresses into kindergarten.
                    $yearsBack = $lastYearIndex - $yearOffset;
                    $yearPosition = max(2, $position - $yearsBack);

                    // 14 and 16 are "graduated from secondary" and "graduated
                    // from university" - endings, not years of study. A seeded
                    // student sitting on one would be enrolled in a year that
                    // does not exist, so they are placed at university (15)
                    // instead, which is where a graduate of 14 actually goes.
                    $yearPosition = in_array($yearPosition, [14, 16], true) ? 15 : $yearPosition;
                    $levelId = $educationLevelIds[$yearPosition] ?? $orphan->education_level_id;

                    $school = $this->schoolForLevel($yearPosition, $index, [
                        'primary' => [$primary, $privatePrimary],
                        'middle' => [$middle],
                        'high' => [$high],
                        'university' => [$faculty, $institute],
                    ]);
                    $isUniversity = $school->type === School::TYPE_UNIVERSITY;

                    // Faculties mark out of 100 and schools out of 20 - though
                    // plenty of Moroccan faculties mark out of 20 too, so some
                    // of the seeded ones do. Both ceilings appear on purpose:
                    // the rankings have to exercise the normalisation that lets
                    // them compare, where a 78/100 places between an 18/20 and
                    // a 14/20 rather than above both.
                    $scale = $isUniversity && ($index + $yearOffset) % 2 === 0 ? 100 : 20;

                    // Which year of which course, for the students the level
                    // ladder's single "جامعي" rung cannot describe on its own.
                    $courses = ['licence', 'licence', 'licence', 'technician', 'master'];
                    $course = $isUniversity ? $courses[$index % count($courses)] : null;
                    // Spread across the course rather than everyone in the same
                    // year, and never past the course's own length.
                    $courseYear = $isUniversity
                        ? 1 + (($index + $yearOffset) % OrphanEnrollment::HIGHER_EDUCATION_PHASES[$course]['years'])
                        : null;

                    // Tutoring is the help the association pays for on top of
                    // schooling. Roughly a third of the roll gets it, weighted
                    // to the exam years where it actually tends to be given.
                    $examYear = in_array($yearPosition, [10, 13], true);
                    $hasTutoring = $examYear || $index % 3 === 0;

                    // A few of the current year's students are left ungraded,
                    // which is the ordinary mid-year state and the case the
                    // "not yet graded" path has to handle.
                    $graded = !$isCurrent || $index % 7 !== 0;
                    $secondSemester = $graded && ($index + $yearOffset) % 5 !== 0;

                    $mark = fn () => $scale === 100
                        ? round(mt_rand(3500, 9600) / 100, 2)
                        : round(mt_rand(700, 1900) / 100, 2);

                    // Creating the family already opened an enrollment for the
                    // current year, so this fills it in rather than inserting again.
                    OrphanEnrollment::updateOrCreate(
                        ['orphan_id' => $orphan->id, 'academic_year_id' => $academicYear->id],
                        [
                            'education_level_id' => $levelId,
                            'school_id' => $school->id,
                            'specialty' => $isUniversity ? ['علوم الحياة والأرض', 'الإعلاميات', 'الاقتصاد'][$index % 3] : null,
                            'higher_education_phase' => $course,
                            'higher_education_year' => $courseYear,
                            'status' => $isCurrent ? $statuses[$index % count($statuses)] : 'passed',
                            'grade_scale' => $scale,
                            'first_semester_grade' => $graded ? $mark() : null,
                            'second_semester_grade' => $secondSemester ? $mark() : null,
                            'has_tutoring' => $hasTutoring,
                            'tutoring_subjects' => $hasTutoring
                                ? ['الرياضيات', 'الفيزياء والكيمياء', 'اللغة الفرنسية', 'الرياضيات، الفيزياء'][$index % 4]
                                : null,
                            'tutoring_provider' => $hasTutoring
                                ? ['الجمعية', 'أستاذ متطوع', 'مركز الدعم المدرسي'][$index % 3]
                                : null,
                        ]
                    );
                }

                $index++;
            }
        }
    }

    /**
     * Which school a student at this level attends. Positions follow the
     * reference ordering: 2-7 are the primary grades, 8-10 lower secondary,
     * 11-13 upper secondary, and anything past that is higher education. The
     * caller has already moved the two graduation markers off the ladder, so
     * nothing reaching here is an ending rather than a year of study.
     *
     * @param  array<string, array<int, School>>  $schools
     */
    private function schoolForLevel(int $position, int $index, array $schools): School
    {
        $stage = match (true) {
            $position <= 7 => 'primary',
            $position <= 10 => 'middle',
            $position <= 13 => 'high',
            default => 'university',
        };

        $options = $schools[$stage];

        return $options[$index % count($options)];
    }

    /**
     * Donations and spending in the two years before this one, so the annual
     * comparison and the unfiltered exports have history behind them. Kept
     * deliberately plain - the elaborate paths (kafala chamila batches, bank
     * transfers, approval workflow) all run against the active year, where
     * someone demonstrating the app will actually be looking.
     *
     * @param  array<int, array{id: int, year: int, active: bool}>  $fiscalYears
     */
    private function seedPriorYears(array $fiscalYears, array $donors, array $widows): void
    {
        $generalBudgetId = Budget::where('is_default', true)->value('id') ?? Budget::value('id');
        $donationCategory = IncomeCategory::where('label', 'تبرعات عامة')->first() ?? IncomeCategory::first();
        $expenseCategories = DB::table('expense_categories')->where('id', '!=', 999)->get();
        $beneficiaryByWidowId = DB::table('beneficiaries')->pluck('id', 'widow_id');

        $currentYear = (int) date('Y');

        foreach ($fiscalYears as $fiscalYear) {
            if ($fiscalYear['active']) {
                continue;
            }

            // The association took in less in earlier years, so the annual
            // comparison shows a trend to read rather than two identical
            // columns. Neither the months nor the amounts line up between
            // years either - the offset shifts the pattern along.
            $yearsBack = $currentYear - $fiscalYear['year'];
            $scale = [1 => 0.85, 2 => 0.7][$yearsBack] ?? 1.0;
            $round = fn (float $amount) => round($amount / 10) * 10;

            foreach (range(1, 12) as $month) {
                $date = sprintf('%d-%02d-%02d', $fiscalYear['year'], $month, rand(3, 27));
                $donor = $donors[($month + $fiscalYear['year']) % count($donors)];

                // Cash and cheque only: a bank wire would move the account
                // balances, and those belong to the year on screen.
                $paymentMethod = $month % 4 === 0 ? 'Cheque' : 'Cash';

                $this->incomes->approve(Income::create([
                    'fiscal_year_id' => $fiscalYear['id'],
                    'budget_id' => $generalBudgetId,
                    'income_category_id' => $donationCategory->id,
                    'donor_id' => $donor->id,
                    'income_date' => $date,
                    'amount' => $round([500, 1200, 300, 2000, 850, 1500][($month + $yearsBack) % 6] * $scale),
                    'payment_method' => $paymentMethod,
                    'receipt_number' => sprintf('RC-%d-%02d', $fiscalYear['year'], $month),
                    'status' => 'Draft',
                    'created_by' => 1,
                ]));
            }

            foreach (range(1, 10 - $yearsBack) as $n) {
                $widow = $widows[($n * 3 + $yearsBack) % count($widows)];
                $beneficiaryId = $beneficiaryByWidowId[$widow->id] ?? null;
                $amount = $round([400, 900, 650, 1100][($n + $yearsBack) % 4] * $scale);

                $expense = $this->expenses->create([
                    'fiscal_year_id' => $fiscalYear['id'],
                    'budget_id' => $generalBudgetId,
                    'expense_category_id' => $expenseCategories[($n + $yearsBack) % $expenseCategories->count()]->id,
                    'expense_date' => sprintf('%d-%02d-%02d', $fiscalYear['year'], ($n * 5 + $yearsBack) % 12 + 1, rand(3, 27)),
                    'amount' => $amount,
                    'payment_method' => $n % 3 === 0 ? 'Cheque' : 'Cash',
                    'receipt_number' => sprintf('EX-%d-%02d', $fiscalYear['year'], $n),
                    'unrelated_to_benef' => $beneficiaryId === null,
                    'beneficiaries' => $beneficiaryId ? [['beneficiary_id' => $beneficiaryId, 'amount' => $amount]] : [],
                ]);

                $this->expenses->approve($expense);
            }
        }
    }

    /**
     * A date inside the current calendar year, never in the future.
     *
     * Subtracting days from today is not good enough for the active fiscal
     * year: run the seeder in January and "90 days ago" lands in last year,
     * posted against this year's books. Anchoring to a month of the current
     * year and clamping at today keeps every row inside the year it belongs
     * to, whenever the seeder happens to be run.
     */
    private function dateInCurrentYear(int $month, int $day): string
    {
        $date = now()->setDate((int) date('Y'), $month, min($day, 28))->startOfDay();

        return ($date->isFuture() ? now() : $date)->format('Y-m-d');
    }

    private function seedIncomes(int $fiscalYearId, array $donors, array $kafils, array $bankAccounts): void
    {
        $generalBudgetId = Budget::where('is_default', true)->value('id') ?? Budget::value('id');

        $donationCategory = IncomeCategory::where('label', 'تبرعات عامة')->first()
            ?? IncomeCategory::whereNotIn('id', [999])->first();

        $monthsElapsed = (int) date('n');

        // A donation in every month so far this year, so the monthly movement
        // chart on the annual report covers the year to date instead of the
        // last few weeks. The most recent two months are left as drafts -
        // an association's current books are normally part-approved.
        foreach (range(1, $monthsElapsed) as $month) {
            $income = Income::create([
                'fiscal_year_id' => $fiscalYearId,
                'budget_id' => $generalBudgetId,
                'income_category_id' => $donationCategory->id,
                'donor_id' => $donors[$month % count($donors)]->id,
                'income_date' => $this->dateInCurrentYear($month, 5 + ($month * 3) % 20),
                'amount' => [1500, 900, 2400, 1100, 1800, 700][$month % 6],
                'payment_method' => $month % 3 === 0 ? 'Cheque' : 'Cash',
                'receipt_number' => sprintf('RC-%d-%02d', (int) date('Y'), $month),
                'status' => 'Draft',
                'created_by' => 1,
            ]);

            if ($month <= $monthsElapsed - 2) {
                $this->incomes->approve($income);
            }
        }

        // One-off gifts on top of the monthly stream, spread over the year so
        // the donor list has more than one entry each and the date filter has
        // something to narrow.
        foreach (array_slice($donors, 4) as $index => $donor) {
            $income = Income::create([
                'fiscal_year_id' => $fiscalYearId,
                'budget_id' => $generalBudgetId,
                'income_category_id' => $donationCategory->id,
                'donor_id' => $donor->id,
                'income_date' => $this->dateInCurrentYear(($index % $monthsElapsed) + 1, 11 + $index % 15),
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
                    'income_date' => $this->dateInCurrentYear($monthsElapsed, 3),
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
                'income_date' => $this->dateInCurrentYear(max(1, $monthsElapsed - 1), 14),
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
                'income_date' => $this->dateInCurrentYear($monthsElapsed, 24),
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

        $monthsElapsed = (int) date('n');
        $amounts = [300, 750, 1200, 450, 600, 900, 1350, 520, 680, 1050, 400, 830];

        // Aid paid out to a different family each month, so the year has a
        // spending curve to sit against the donation curve, and enough
        // families have received something for the per-family financial
        // report to be worth opening on more than one of them.
        foreach (range(1, $monthsElapsed) as $month) {
            $widow = $widows[($month * 4) % count($widows)];
            $category = $categories[$month % $categories->count()];
            $beneficiaryId = $beneficiaryByWidowId[$widow->id] ?? null;
            $amount = $amounts[$month % count($amounts)];

            $expense = $this->expenses->create([
                'fiscal_year_id' => $fiscalYearId,
                'budget_id' => $generalBudgetId,
                'expense_category_id' => $category->id,
                'expense_date' => $this->dateInCurrentYear($month, 8 + ($month * 5) % 18),
                'amount' => $amount,
                'payment_method' => $month % 4 === 0 ? 'Cheque' : 'Cash',
                'receipt_number' => sprintf('EX-%d-%02d', (int) date('Y'), $month),
                'unrelated_to_benef' => $beneficiaryId === null,
                'beneficiaries' => $beneficiaryId ? [['beneficiary_id' => $beneficiaryId, 'amount' => $amount]] : [],
            ]);

            if ($month <= $monthsElapsed - 2) {
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
            'expense_date' => $this->dateInCurrentYear($monthsElapsed, 12),
            'amount' => 1500,
            'payment_method' => 'BankWire',
            'bank_account_id' => $bankAccounts[0]->id,
            'unrelated_to_benef' => true,
        ]);
        $this->expenses->approve($overhead);
    }

    /**
     * Money moved between the association's own accounts: one already
     * approved, so the balances and the account ledger show the pair of
     * entries a transfer leaves behind, and one still a draft, so the
     * approve button on the transfers page has something to act on.
     *
     * @param  array<int, \App\Models\BankAccount>  $bankAccounts
     */
    private function seedTransfers(int $fiscalYearId, array $bankAccounts): void
    {
        if (count($bankAccounts) < 2) {
            return;
        }

        [$main, $kafala] = $bankAccounts;

        $this->transfers->approve(Transfer::create([
            'fiscal_year_id' => $fiscalYearId,
            'transfer_date' => $this->dateInCurrentYear((int) date('n'), 6),
            'from_account_id' => $main->id,
            'to_account_id' => $kafala->id,
            'amount' => 6000,
            'remarks' => 'تغطية مستحقات الكفالات الشهرية',
            'status' => 'Draft',
            'created_by' => 1,
        ]));

        Transfer::create([
            'fiscal_year_id' => $fiscalYearId,
            'transfer_date' => $this->dateInCurrentYear((int) date('n'), 27),
            'from_account_id' => $kafala->id,
            'to_account_id' => $main->id,
            'amount' => 1500,
            'remarks' => 'إرجاع فائض الشهر الماضي',
            'status' => 'Draft',
            'created_by' => 1,
        ]);
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
