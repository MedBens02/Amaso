<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FiscalYear;
use App\Models\BankAccount;
use App\Models\SubBudget;
use App\Models\IncomeCategory;
use App\Models\ExpenseCategory;
use App\Models\Donor;
use App\Models\Income;
use App\Models\Expense;
use App\Models\User;

class FiscalYearTestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create a mock user first
        $user = User::firstOrCreate([
            'email' => 'admin@test.com'
        ], [
            'name' => 'Test Admin',
            'password' => bcrypt('password123')
        ]);

        // Create fiscal years
        $fiscalYear2023 = FiscalYear::firstOrCreate(['year' => 2023], [
            'is_active' => false,
            'carryover_prev_year' => 15000.00,
            'carryover_next_year' => 45000.00
        ]);

        $fiscalYear2024 = FiscalYear::firstOrCreate(['year' => 2024], [
            'is_active' => true,
            'carryover_prev_year' => 45000.00,
            'carryover_next_year' => 0.00
        ]);

        // Create bank accounts
        $bankAccount1 = BankAccount::firstOrCreate([
            'label' => 'حساب البنك الشعبي الرئيسي'
        ], [
            'bank_name' => 'البنك الشعبي',
            'account_number' => '001234567890',
            'balance' => 150000.00,
            'notes' => 'الحساب الرئيسي للجمعية'
        ]);

        $bankAccount2 = BankAccount::firstOrCreate([
            'label' => 'حساب التوفير - التجاري وفا'
        ], [
            'bank_name' => 'التجاري وفا بنك',
            'account_number' => '002345678901',
            'balance' => 75000.00,
            'notes' => 'حساب التوفير للطوارئ'
        ]);

        // Create sub budgets
        $subBudget1 = SubBudget::firstOrCreate([
            'fiscal_year_id' => $fiscalYear2024->id,
            'label' => 'المساعدات الاجتماعية'
        ]);

        $subBudget2 = SubBudget::firstOrCreate([
            'fiscal_year_id' => $fiscalYear2024->id,
            'label' => 'التعليم والتدريب'
        ]);

        // Create income categories
        $incomeCategory1 = IncomeCategory::firstOrCreate([
            'sub_budget_id' => $subBudget1->id,
            'label' => 'التبرعات النقدية'
        ]);

        $incomeCategory2 = IncomeCategory::firstOrCreate([
            'sub_budget_id' => $subBudget2->id,
            'label' => 'رسوم التدريب'
        ]);

        // Create expense categories
        $expenseCategory1 = ExpenseCategory::firstOrCreate([
            'sub_budget_id' => $subBudget1->id,
            'label' => 'مساعدات الأرامل'
        ]);

        $expenseCategory2 = ExpenseCategory::firstOrCreate([
            'sub_budget_id' => $subBudget2->id,
            'label' => 'مواد تعليمية'
        ]);

        // Create donors
        $donor1 = Donor::firstOrCreate([
            'email' => 'ahmed.donor@email.com'
        ], [
            'first_name' => 'أحمد',
            'last_name' => 'المحسن',
            'phone' => '+212661234567',
            'address' => 'الرباط، المغرب'
        ]);

        $donor2 = Donor::firstOrCreate([
            'email' => 'fatima.donor@email.com'
        ], [
            'first_name' => 'فاطمة',
            'last_name' => 'الخيرية',
            'phone' => '+212662345678',
            'address' => 'الدار البيضاء، المغرب'
        ]);

        // Create test incomes with different statuses and payment methods
        $incomes = [
            // Approved bank wire - no issue
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget1->id,
                'income_category_id' => $incomeCategory1->id,
                'donor_id' => $donor1->id,
                'income_date' => '2024-03-15',
                'amount' => 25000.00,
                'payment_method' => 'BankWire',
                'bank_account_id' => $bankAccount1->id,
                'receipt_number' => 'REC-2024-001',
                'remarks' => 'تبرع شهري من أحمد المحسن',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(10)
            ],
            // Approved cash - NOT transferred (should block closing)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget1->id,
                'income_category_id' => $incomeCategory1->id,
                'donor_id' => $donor2->id,
                'income_date' => '2024-04-20',
                'amount' => 5000.00,
                'payment_method' => 'Cash',
                'receipt_number' => 'REC-2024-002',
                'remarks' => 'تبرع نقدي من فاطمة الخيرية',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(5),
                'transferred_at' => null, // Not transferred
                'bank_account_id' => null
            ],
            // Approved cheque - transferred (ok)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget2->id,
                'income_category_id' => $incomeCategory2->id,
                'donor_id' => $donor1->id,
                'income_date' => '2024-05-10',
                'amount' => 15000.00,
                'payment_method' => 'Cheque',
                'cheque_number' => 'CHQ-001234',
                'receipt_number' => 'REC-2024-003',
                'remarks' => 'تبرع بشيك لبرنامج التعليم',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(8),
                'transferred_at' => now()->subDays(3),
                'bank_account_id' => $bankAccount2->id
            ],
            // Draft income - NOT approved (should block closing)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget1->id,
                'income_category_id' => $incomeCategory1->id,
                'donor_id' => $donor2->id,
                'income_date' => '2024-06-01',
                'amount' => 8000.00,
                'payment_method' => 'Cash',
                'receipt_number' => 'REC-2024-004',
                'remarks' => 'تبرع في انتظار الموافقة',
                'status' => 'Draft',
                'created_by' => $user->id,
                'approved_by' => null,
                'approved_at' => null
            ],
            // Approved cheque - NOT transferred (should block closing)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget2->id,
                'income_category_id' => $incomeCategory2->id,
                'donor_id' => $donor1->id,
                'income_date' => '2024-07-15',
                'amount' => 12000.00,
                'payment_method' => 'Cheque',
                'cheque_number' => 'CHQ-005678',
                'receipt_number' => 'REC-2024-005',
                'remarks' => 'شيك لم يتم إيداعه بعد',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(2),
                'transferred_at' => null,
                'bank_account_id' => null
            ]
        ];

        foreach ($incomes as $incomeData) {
            Income::firstOrCreate([
                'receipt_number' => $incomeData['receipt_number']
            ], $incomeData);
        }

        // Create test expenses with different statuses
        $expenses = [
            // Approved expense - ok
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget1->id,
                'expense_category_id' => $expenseCategory1->id,
                'details' => 'مساعدة شهرية للأرامل - مارس 2024',
                'expense_date' => '2024-03-25',
                'amount' => 15000.00,
                'payment_method' => 'BankWire',
                'bank_account_id' => $bankAccount1->id,
                'receipt_number' => 'EXP-2024-001',
                'remarks' => 'دفعة مارس للأرامل المستفيدات',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(12)
            ],
            // Draft expense - NOT approved (should block closing)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget2->id,
                'expense_category_id' => $expenseCategory2->id,
                'details' => 'شراء مواد تعليمية للبرنامج',
                'expense_date' => '2024-06-20',
                'amount' => 3500.00,
                'payment_method' => 'Cash',
                'receipt_number' => 'EXP-2024-002',
                'remarks' => 'مصروف في انتظار الموافقة',
                'status' => 'Draft',
                'created_by' => $user->id,
                'approved_by' => null,
                'approved_at' => null
            ],
            // Approved expense - ok
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'sub_budget_id' => $subBudget1->id,
                'expense_category_id' => $expenseCategory1->id,
                'details' => 'مساعدة طبية عاجلة',
                'expense_date' => '2024-05-30',
                'amount' => 2500.00,
                'payment_method' => 'Cheque',
                'cheque_number' => 'CHQ-EXP-001',
                'receipt_number' => 'EXP-2024-003',
                'remarks' => 'مساعدة طبية للأرملة خديجة',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(6)
            ]
        ];

        foreach ($expenses as $expenseData) {
            Expense::firstOrCreate([
                'receipt_number' => $expenseData['receipt_number']
            ], $expenseData);
        }

        $this->command->info('✅ Test data created successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info("- Fiscal Years: 2023 (closed), 2024 (open)");
        $this->command->info("- Bank Accounts: 2 accounts with balances");
        $this->command->info("- Incomes: 5 total (3 approved, 1 draft, 2 untransferred cash/cheque)");
        $this->command->info("- Expenses: 3 total (2 approved, 1 draft)");
        $this->command->info("");
        $this->command->info("🚫 Fiscal Year 2024 CANNOT be closed because:");
        $this->command->info("- 1 unapproved income");
        $this->command->info("- 1 unapproved expense");
        $this->command->info("- 2 untransferred cash/cheque incomes");
    }
}
