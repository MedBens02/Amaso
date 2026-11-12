<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\BudgetCategoryController;
use App\Http\Controllers\Api\V1\BankAccountController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DonorController;
use App\Http\Controllers\Api\V1\WidowController;
use App\Http\Controllers\Api\V1\KafilController;
use App\Http\Controllers\Api\V1\OrphanController;
use App\Http\Controllers\Api\V1\IncomeController;
use App\Http\Controllers\Api\V1\ExpenseController;
use App\Http\Controllers\Api\V1\TransferController;
use App\Http\Controllers\Api\V1\TransportMonthController;
use App\Http\Controllers\Api\V1\TransportSupportController;
use App\Http\Controllers\Api\V1\FiscalYearController;
use App\Http\Controllers\Api\V1\SchoolController;
use App\Http\Controllers\Api\V1\AcademicYearController;
use App\Http\Controllers\Api\V1\EnrollmentController;
use App\Http\Controllers\Api\V1\KafalaChamilaController;
use App\Http\Controllers\Api\V1\CardController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\BeneficiaryGroupController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\References;
use App\Support\Roles;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
        'service' => 'Amaso API',
    ]);
});

// API v1 routes
Route::prefix('v1')->group(function () {

    // Authentication (public)
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    // The second step. Throttled harder than the first: the password is
    // already known by whoever gets here, so this is the last wall, and six
    // digits only hold while the guesses are rationed.
    Route::post('auth/verify-code', [AuthController::class, 'verifyCode'])
        ->middleware('throttle:10,1');

    // fresh.password: once a password is past its age, or was reset by an
    // administrator, nothing but changing it answers. Applied to the whole
    // group rather than per route, because the rule is "nothing else" and a
    // list of exceptions kept by hand grows a hole the first time somebody
    // adds an endpoint.
    Route::middleware(['auth:sanctum', 'fresh.password'])->group(function () {

    // Authentication (requires a valid token)
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    // Your own account
    Route::patch('auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('auth/password', [AuthController::class, 'changePassword'])
        ->middleware('throttle:10,1');

    // The home screen. Shaped by the caller's own role - see DashboardService.
    Route::get('dashboard', [DashboardController::class, 'index']);

    // The association's identity - everyone reads it, admins edit it
    Route::get('settings/organization', [SettingsController::class, 'organization']);
    Route::put('settings/organization', [SettingsController::class, 'updateOrganization'])
        ->middleware('role:admin,superuser');

    // The two things an admin is not given: handing out everybody else's
    // access, and reading the record of what everybody did.
    Route::middleware('role:superuser')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::patch('users/{user}/active', [UserController::class, 'setActive']);
        Route::post('users/{user}/password', [UserController::class, 'resetPassword']);
        // The way back in when mail stops: see UserController::setTwoFactor.
        Route::patch('users/{user}/two-factor', [UserController::class, 'setTwoFactor']);

        // The activity log. Read-only: there is no route that writes,
        // edits or deletes a row, deliberately.
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/filters', [AuditLogController::class, 'filters']);
    });

    // Donors and sponsors. Reading them is open - an expense or an income
    // is unreadable without the person it came from - but the register
    // itself is the fundraising side's to keep.
    Route::apiResource('donors', DonorController::class)->only(['index', 'show']);
    Route::apiResource('donors', DonorController::class)->except(['index', 'show'])
        ->middleware(Roles::FINANCE);

    // Widows CRUD (families; destroy archives instead of deleting)
    Route::apiResource('widows', WidowController::class)->only(['index', 'show'])
        ->withTrashed(['show']);
    Route::get('widows-reference-data', [WidowController::class, 'getReferenceData']);
    Route::middleware(Roles::FAMILIES)->group(function () {
        Route::apiResource('widows', WidowController::class)->except(['index', 'show']);
        Route::post('widows/{widow}/restore', [WidowController::class, 'restore'])->withTrashed();
        // A family whose عدة is over, taken on as one of the association's own.
        Route::post('widows/{widow}/enrol', [WidowController::class, 'enrol']);
    });

    // Orphans CRUD (read-only, managed through widows)
    Route::get('orphans', [OrphanController::class, 'index']);
    Route::get('orphans/{orphan}', [OrphanController::class, 'show']);
    // These three only ever answer "manage orphans through the family".
    // Gated anyway, so the rule reads the same here as everywhere else.
    Route::middleware(Roles::FAMILIES)->group(function () {
        Route::post('orphans', [OrphanController::class, 'store']); // Returns error message
        Route::put('orphans/{orphan}', [OrphanController::class, 'update']); // Returns error message
        Route::delete('orphans/{orphan}', [OrphanController::class, 'destroy']); // Returns error message
    });

    // Kafils CRUD
    Route::apiResource('kafils', KafilController::class)->only(['index', 'show']);
    Route::get('kafils-for-sponsorship', [KafilController::class, 'getKafilsForSponsorship']);
    Route::middleware(Roles::FINANCE)->group(function () {
        Route::apiResource('kafils', KafilController::class)->except(['index', 'show']);
        Route::post('kafils/{kafil}/remove-status', [KafilController::class, 'removeKafilStatus']);
        // Who funds which family, and for how much a month.
        Route::post('sponsorships', [KafilController::class, 'createSponsorship']);
    });

    // Incomes CRUD + approval
    Route::apiResource('incomes', IncomeController::class)->only(['index', 'show']);
    Route::apiResource('incomes', IncomeController::class)->except(['index', 'show'])
        ->middleware(Roles::FINANCE);
    // Approving is what turns a recorded figure into money the books count,
    // so it is the accountants' and the administration's to do - not
    // everybody's. The button is hidden for the rest, but hiding a button
    // stops nobody calling the endpoint, which is why the rule lives here.
    Route::post('incomes/{income}/approve', [IncomeController::class, 'approve'])
        ->middleware(Roles::FINANCE);
    // Moves received money into an account, which changes a balance.
    Route::post('incomes/{income}/transfer-to-bank', [IncomeController::class, 'transferToBank'])
        ->middleware(Roles::FINANCE);

    // Kafala Chamila (comprehensive sponsorship) split
    Route::get('kafala-chamila/splits', [KafalaChamilaController::class, 'splits']);
    Route::get('kafala-chamila/balances', [KafalaChamilaController::class, 'balances']);
    Route::get('kafala-chamila/family-balances', [KafalaChamilaController::class, 'familyBalances']);
    // Recording a comprehensive sponsorship payment is ordinary income work.
    Route::post('kafala-chamila/incomes', [KafalaChamilaController::class, 'storeIncome'])
        ->middleware(Roles::FINANCE);

    // The split rules themselves are narrower. They decide how every such
    // payment is divided between the seven funds, so whoever edits them
    // moves where the association's sponsorship money lands. The controller
    // has required an admin for this all along (requireAdmin, which answers
    // "مقتصرة على المديرين فقط"); the gate here says the same thing at the
    // door, so the route and the controller cannot drift apart.
    Route::middleware(Roles::ADMIN)->group(function () {
        Route::put('kafala-chamila/splits', [KafalaChamilaController::class, 'updateSplits']);
        Route::post('kafala-chamila/splits', [KafalaChamilaController::class, 'storeSplit']);
        Route::put('kafala-chamila/splits/{split}', [KafalaChamilaController::class, 'updateSplit']);
        Route::delete('kafala-chamila/splits/{split}', [KafalaChamilaController::class, 'destroySplit']);
    });

    // Per-entity information cards (PDF)
    Route::get('cards/widows/{widow}.pdf', [CardController::class, 'widow']);
    Route::get('cards/orphans/{orphan}.pdf', [CardController::class, 'orphan']);
    Route::get('cards/donors/{donor}.pdf', [CardController::class, 'donor']);
    Route::get('cards/kafils/{kafil}.pdf', [CardController::class, 'kafil']);

    // Reports
    Route::get('reports/kafils/{kafil}/statement', [ReportController::class, 'kafilStatement']);
    Route::get('reports/incomes.pdf', [ReportController::class, 'incomeListPdf']);
    Route::get('reports/expenses.pdf', [ReportController::class, 'expenseListPdf']);
    Route::get('reports/incomes.xlsx', [ReportController::class, 'incomeListExcel']);
    Route::get('reports/expenses.xlsx', [ReportController::class, 'expenseListExcel']);
    Route::get('reports/families/{widow}/financial', [ReportController::class, 'familyFinancial']);
    Route::get('reports/families/{widow}/financial.pdf', [ReportController::class, 'familyFinancialPdf']);
    Route::get('reports/families/{widow}/financial.xlsx', [ReportController::class, 'familyFinancialExcel']);
    Route::get('reports/sponsorship-gaps', [ReportController::class, 'sponsorshipGaps']);
    Route::get('reports/sponsorship-gaps.pdf', [ReportController::class, 'sponsorshipGapsPdf']);
    Route::get('reports/sponsorship-gaps.xlsx', [ReportController::class, 'sponsorshipGapsExcel']);
    Route::get('reports/kafil-follow-up', [ReportController::class, 'kafilFollowUp']);
    Route::get('reports/kafil-follow-up.pdf', [ReportController::class, 'kafilFollowUpPdf']);
    Route::get('reports/kafil-follow-up.xlsx', [ReportController::class, 'kafilFollowUpExcel']);
    Route::get('reports/budget-utilization', [ReportController::class, 'budgetUtilization']);
    Route::get('reports/budget-utilization.pdf', [ReportController::class, 'budgetUtilizationPdf']);
    Route::get('reports/budget-utilization.xlsx', [ReportController::class, 'budgetUtilizationExcel']);
    Route::get('reports/widows', [ReportController::class, 'widows']);
    Route::get('reports/widows.pdf', [ReportController::class, 'widowsPdf']);
    Route::get('reports/widows.xlsx', [ReportController::class, 'widowsExcel']);
    Route::get('reports/orphans.pdf', [ReportController::class, 'orphansPdf']);
    Route::get('reports/orphans.xlsx', [ReportController::class, 'orphansExcel']);
    Route::get('reports/financial', [ReportController::class, 'financial']);
    Route::get('reports/financial.pdf', [ReportController::class, 'financialPdf']);
    Route::get('reports/financial.xlsx', [ReportController::class, 'financialExcel']);
    Route::get('reports/donors', [ReportController::class, 'donors']);
    Route::get('reports/donors.pdf', [ReportController::class, 'donorsPdf']);
    Route::get('reports/donors.xlsx', [ReportController::class, 'donorsExcel']);
    Route::get('reports/annual', [ReportController::class, 'annual']);
    Route::get('reports/annual.pdf', [ReportController::class, 'annualPdf']);
    Route::get('reports/annual.xlsx', [ReportController::class, 'annualExcel']);
    Route::get('reports/school-performance', [ReportController::class, 'schoolPerformance']);
    Route::get('reports/school-performance.pdf', [ReportController::class, 'schoolPerformancePdf']);
    Route::get('reports/school-performance.xlsx', [ReportController::class, 'schoolPerformanceExcel']);
    Route::get('reports/kafils/{kafil}/statement.pdf', [ReportController::class, 'kafilStatementPdf']);
    Route::get('reports/kafils/{kafil}/statement.xlsx', [ReportController::class, 'kafilStatementExcel']);

    // Expenses CRUD + approval.
    //
    // Writing one down is wider than approving one: the social worker who
    // handed out the aid is the person who knows it went out. Turning that
    // record into money the books count stays with the books.
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'show']);
    Route::apiResource('expenses', ExpenseController::class)->except(['index', 'show'])
        ->middleware(Roles::EXPENSE_ENTRY);
    Route::post('expenses/{expense}/approve', [ExpenseController::class, 'approve'])
        ->middleware(Roles::FINANCE);

    // Transfers CRUD + approval. Moving money between the association's own
    // accounts, and saying it has moved, are both the books'.
    Route::apiResource('transfers', TransferController::class)->only(['index', 'show']);
    Route::middleware(Roles::FINANCE)->group(function () {
        Route::apiResource('transfers', TransferController::class)->except(['index', 'show']);
        Route::post('transfers/{transfer}/approve', [TransferController::class, 'approve']);
    });

    // Beneficiary Groups CRUD + member management
    Route::apiResource('beneficiary-groups', BeneficiaryGroupController::class)->only(['index', 'show']);
    Route::get('beneficiary-groups/{beneficiaryGroup}/members', [BeneficiaryGroupController::class, 'getMembers']);
    Route::get('beneficiaries', [BeneficiaryGroupController::class, 'getBeneficiaries']);
    Route::middleware(Roles::FAMILIES)->group(function () {
        Route::apiResource('beneficiary-groups', BeneficiaryGroupController::class)->except(['index', 'show']);
        Route::post('beneficiary-groups/{beneficiaryGroup}/members', [BeneficiaryGroupController::class, 'addMembers']);
        Route::delete('beneficiary-groups/{beneficiaryGroup}/members/{beneficiary}', [BeneficiaryGroupController::class, 'removeMember']);
    });

    // Education tracking
    Route::apiResource('schools', SchoolController::class)->only(['index']);
    Route::get('academic-years', [AcademicYearController::class, 'index']);
    Route::apiResource('enrollments', EnrollmentController::class)->only(['index'])
        ->parameters(['enrollments' => 'enrollment']);

    Route::middleware(Roles::EDUCATION)->group(function () {
        Route::apiResource('schools', SchoolController::class)->except(['show', 'index']);
        Route::post('academic-years', [AcademicYearController::class, 'store']);
        // Opens next year and carries every continuing child into it.
        Route::post('academic-years/rollover', [AcademicYearController::class, 'rollover']);
        Route::post('enrollments/grades', [EnrollmentController::class, 'storeGrades']);
        // The named exam marks on one enrollment, saved as a set.
        Route::put('enrollments/{enrollment}/grades', [EnrollmentController::class, 'saveGrades']);
        Route::apiResource('enrollments', EnrollmentController::class)->except(['show', 'index'])
            ->parameters(['enrollments' => 'enrollment']);
    });

    // Transport - getting children to the association's centre and home.
    //
    // The sub-routes are declared before the resource so that
    // /transport-months/summary is not swallowed by /transport-months/{month}
    // and handed to the model binding as an id of "summary".
    Route::get('transport-months/{transportMonth}/expense-draft', [TransportMonthController::class, 'expenseDraft']);
    Route::apiResource('transport-months', TransportMonthController::class)
        ->only(['index', 'show'])
        ->parameters(['transport-months' => 'transportMonth']);
    Route::apiResource('transport-support', TransportSupportController::class)
        ->only(['index'])
        ->parameters(['transport-support' => 'transportSupport']);

    // The riders and the month sheet: who travels, and how often they did.
    Route::middleware(Roles::EDUCATION)->group(function () {
        Route::post('transport-months/{transportMonth}/refresh', [TransportMonthController::class, 'refresh']);
        Route::apiResource('transport-months', TransportMonthController::class)
            ->except(['index', 'show'])
            ->parameters(['transport-months' => 'transportMonth']);
        Route::apiResource('transport-support', TransportSupportController::class)
            ->except(['show', 'index'])
            ->parameters(['transport-support' => 'transportSupport']);
    });

    // Freezing a month's split and linking the expense that pays it. Both
    // take ?part=bus|allowance - the two halves settle independently. The
    // expense this links still needs FINANCE to approve it, so closing a
    // month is not a way to spend money without an accountant.
    Route::middleware(Roles::TRANSPORT_SETTLEMENT)->group(function () {
        Route::post('transport-months/{transportMonth}/close', [TransportMonthController::class, 'close']);
        Route::post('transport-months/{transportMonth}/reopen', [TransportMonthController::class, 'reopen']);
    });

    // Lookup data endpoints
    Route::get('bank-accounts', [BankAccountController::class, 'index']);
    // Adding or removing an account is a change to where the association's
    // money is held, so it sits with the people who answer for the books.
    Route::post('bank-accounts', [BankAccountController::class, 'store'])
        ->middleware('role:admin,superuser,accountant');
    Route::put('bank-accounts/{bankAccount}', [BankAccountController::class, 'update'])
        ->middleware('role:admin,superuser,accountant');
    Route::delete('bank-accounts/{bankAccount}', [BankAccountController::class, 'destroy'])
        ->middleware('role:admin,superuser,accountant');
    // The ledger has always been written; this is what reads it back, so a
    // balance can be traced and checked against the bank's own statement.
    Route::get('bank-accounts/{bankAccount}/statement', [BankAccountController::class, 'statement']);

    Route::get('budgets', function () {
        return response()->json([
            'data' => \App\Models\Budget::orderByDesc('is_default')->orderBy('label')->get(),
        ]);
    });

    // Which categories each fund offers. Read by the income and expense
    // forms to narrow their category lists, and by the screen that sets them.
    Route::get('budget-categories', [BudgetCategoryController::class, 'index']);
    Route::get('budgets/{budget}/categories', [BudgetCategoryController::class, 'show']);
    Route::put('budgets/{budget}/categories', [BudgetCategoryController::class, 'update'])
        ->middleware('role:admin,superuser,accountant');

    Route::get('income-categories', function () {
        return response()->json([
            'data' => \App\Models\IncomeCategory::with('parent')
                ->where('id', '!=', \App\Models\IncomeCategory::DELETED_CATEGORY_ID)
                ->orderBy('label')
                ->get(),
        ]);
    });

    Route::get('expense-categories', function () {
        return response()->json([
            'data' => \App\Models\ExpenseCategory::with('parent')
                ->where('id', '!=', \App\Models\ExpenseCategory::DELETED_CATEGORY_ID)
                ->orderBy('label')
                ->get(),
        ]);
    });

    Route::get('orphans-education-levels', function () {
        // With the marking scheme: the registrations screen needs to know
        // which levels are the plain two semesters it can edit in the table,
        // and the year-marks dialog needs the components to lay out.
        return response()->json([
            'data' => \App\Models\OrphansEducationLevel::with('gradeComponents')
                ->active()
                ->ordered()
                ->get(),
        ]);
    });

    // References Management
    // The lists every other screen picks from. Reading them is open -
    // every form needs them - and each list is written by whoever lives in
    // it: the social file's lists by FAMILIES, the chart of accounts and
    // the funds by FINANCE, the school levels by EDUCATION.
    Route::prefix('references')->group(function () {
        // Skills
        Route::get('skills', [References\SkillController::class, 'index']);
        Route::post('skills', [References\SkillController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('skills/{skill}', [References\SkillController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('skills/{skill}', [References\SkillController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Illnesses
        Route::get('illnesses', [References\IllnessController::class, 'index']);
        Route::post('illnesses', [References\IllnessController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('illnesses/{illness}', [References\IllnessController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('illnesses/{illness}', [References\IllnessController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Sectors, and the neighborhoods inside them
        Route::get('sectors', [References\SectorController::class, 'index']);
        Route::post('sectors', [References\SectorController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('sectors/{sector}', [References\SectorController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('sectors/{sector}', [References\SectorController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        Route::get('neighborhoods', [References\NeighborhoodController::class, 'index']);
        Route::post('neighborhoods', [References\NeighborhoodController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('neighborhoods/{neighborhood}', [References\NeighborhoodController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('neighborhoods/{neighborhood}', [References\NeighborhoodController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Housing Types
        Route::get('housing-types', [References\HousingTypeController::class, 'index']);
        Route::post('housing-types', [References\HousingTypeController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('housing-types/{housingType}', [References\HousingTypeController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('housing-types/{housingType}', [References\HousingTypeController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Aid Types
        Route::get('aid-types', [References\AidTypeController::class, 'index']);
        Route::post('aid-types', [References\AidTypeController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('aid-types/{aidType}', [References\AidTypeController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('aid-types/{aidType}', [References\AidTypeController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Income Categories (Accounting)
        Route::get('income-categories', [References\AccountingIncomeCategoryController::class, 'index']);
        Route::post('income-categories', [References\AccountingIncomeCategoryController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('income-categories/{category}', [References\AccountingIncomeCategoryController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::get('income-categories/{category}/related-count', [References\AccountingIncomeCategoryController::class, 'relatedCount']);
        Route::delete('income-categories/{category}', [References\AccountingIncomeCategoryController::class, 'destroy'])
            ->middleware(Roles::FINANCE);

        // Expense Categories (Accounting)
        Route::get('expense-categories', [References\AccountingExpenseCategoryController::class, 'index']);
        Route::post('expense-categories', [References\AccountingExpenseCategoryController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('expense-categories/{category}', [References\AccountingExpenseCategoryController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::get('expense-categories/{category}/related-count', [References\AccountingExpenseCategoryController::class, 'relatedCount']);
        Route::delete('expense-categories/{category}', [References\AccountingExpenseCategoryController::class, 'destroy'])
            ->middleware(Roles::FINANCE);

        // Partner Fields
        Route::get('partner-fields', [References\PartnerFieldController::class, 'index']);
        Route::post('partner-fields', [References\PartnerFieldController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('partner-fields/{field}', [References\PartnerFieldController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::delete('partner-fields/{field}', [References\PartnerFieldController::class, 'destroy'])
            ->middleware(Roles::FINANCE);

        // Partner Subfields
        Route::get('partner-subfields', [References\PartnerSubfieldController::class, 'index']);
        Route::post('partner-subfields', [References\PartnerSubfieldController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('partner-subfields/{subfield}', [References\PartnerSubfieldController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::delete('partner-subfields/{subfield}', [References\PartnerSubfieldController::class, 'destroy'])
            ->middleware(Roles::FINANCE);

        // Partners
        Route::get('partners', [References\PartnerController::class, 'index']);
        Route::post('partners', [References\PartnerController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('partners/{partner}', [References\PartnerController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::delete('partners/{partner}', [References\PartnerController::class, 'destroy'])
            ->middleware(Roles::FINANCE);

        // Education Levels
        Route::get('education-levels', [References\EducationLevelController::class, 'index']);
        Route::post('education-levels', [References\EducationLevelController::class, 'store'])
            ->middleware(Roles::EDUCATION);
        Route::put('education-levels/{level}', [References\EducationLevelController::class, 'update'])
            ->middleware(Roles::EDUCATION);
        Route::delete('education-levels/{level}', [References\EducationLevelController::class, 'destroy'])
            ->middleware(Roles::EDUCATION);
        Route::post('education-levels/reorder', [References\EducationLevelController::class, 'reorder'])
            ->middleware(Roles::EDUCATION);
        // How a year's mark is worked out at this level, saved as a whole.
        Route::put('education-levels/{level}/components', [References\EducationLevelController::class, 'saveComponents'])
            ->middleware(Roles::EDUCATION);

        // Sub-Budgets
        Route::get('budgets', [References\BudgetController::class, 'index']);
        Route::post('budgets', [References\BudgetController::class, 'store'])
            ->middleware(Roles::FINANCE);
        Route::put('budgets/{budget}', [References\BudgetController::class, 'update'])
            ->middleware(Roles::FINANCE);
        Route::delete('budgets/{budget}', [References\BudgetController::class, 'destroy'])
            ->middleware(Roles::FINANCE);
        Route::post('budgets/{budget}/default', [References\BudgetController::class, 'setDefault'])
            ->middleware(Roles::FINANCE);

        // Widow Income Categories
        Route::get('widow-income-categories', [References\WidowIncomeCategoryController::class, 'index']);
        Route::post('widow-income-categories', [References\WidowIncomeCategoryController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('widow-income-categories/{category}', [References\WidowIncomeCategoryController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('widow-income-categories/{category}', [References\WidowIncomeCategoryController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);

        // Widow Expense Categories
        Route::get('widow-expense-categories', [References\WidowExpenseCategoryController::class, 'index']);
        Route::post('widow-expense-categories', [References\WidowExpenseCategoryController::class, 'store'])
            ->middleware(Roles::FAMILIES);
        Route::put('widow-expense-categories/{category}', [References\WidowExpenseCategoryController::class, 'update'])
            ->middleware(Roles::FAMILIES);
        Route::delete('widow-expense-categories/{category}', [References\WidowExpenseCategoryController::class, 'destroy'])
            ->middleware(Roles::FAMILIES);
    });

    // Fiscal Year Management
    Route::get('fiscal-years', [FiscalYearController::class, 'index']);
    Route::get('fiscal-years/{fiscalYear}/closing-status', [FiscalYearController::class, 'getClosingStatus']);
    Route::get('fiscal-years/{fiscalYear}/closing-summary', [FiscalYearController::class, 'getClosingSummary']);
    // The year-end. It carries balances forward and shuts the books on a
    // whole year of records.
    //
    // Admin rather than FINANCE, deliberately. The accountant is the one who
    // gets the year ready - every draft approved, every income banked, the
    // balances agreed with the bank - but the controller has restricted the
    // closing itself to the administration all along (canCloseFiscalYear,
    // which answers "مقتصرة على المديرين فقط"). Widening the route would
    // have left the door open and the room locked.
    Route::post('fiscal-years/{fiscalYear}/close', [FiscalYearController::class, 'closeFiscalYear'])
        ->middleware(Roles::ADMIN);
    Route::get('fiscal-years/{fiscalYear}/untransferred-incomes', [FiscalYearController::class, 'getUntransferredIncomes']);

    });

});
