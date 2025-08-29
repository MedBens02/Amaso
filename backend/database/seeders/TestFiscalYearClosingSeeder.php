<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FiscalYear;
use App\Models\Income;
use App\Models\Expense;
use App\Models\IncomeCategory;
use App\Models\ExpenseCategory;
use Carbon\Carbon;

class TestFiscalYearClosingSeeder extends Seeder
{
    /**
     * Run the database seeds - Create test data to verify closing validation
     */
    public function run(): void
    {
        // Get the 2026 fiscal year
        $fiscalYear = FiscalYear::where('year', 2026)->first();
        
        if (!$fiscalYear) {
            $this->command->error('Fiscal year 2026 not found.');
            return;
        }

        // Get first available categories or create them
        $incomeCategory = IncomeCategory::first();
        $expenseCategory = ExpenseCategory::first();

        if (!$incomeCategory || !$expenseCategory) {
            $this->command->warn('No income/expense categories found. Skipping test data creation.');
            return;
        }

        // Create a draft income to test validation
        Income::create([
            'fiscal_year_id' => $fiscalYear->id,
            'income_category_id' => $incomeCategory->id,
            'date' => '2026-01-15',
            'amount' => 25000.00,
            'description' => 'إيراد اختبار - مسودة',
            'status' => 'Draft', // This will prevent closing
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Create a draft expense to test validation
        Expense::create([
            'fiscal_year_id' => $fiscalYear->id,
            'expense_category_id' => $expenseCategory->id,
            'date' => '2026-01-20',
            'amount' => 15000.00,
            'description' => 'مصروف اختبار - مسودة',
            'status' => 'Draft', // This will prevent closing
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $this->command->info('Created test draft income and expense for 2026 to test closing validation.');
    }
}