<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FiscalYear;
use App\Models\Budget;
use App\Models\SubBudget;
use App\Models\IncomeCategory;
use App\Models\ExpenseCategory;
use App\Models\Income;
use App\Models\Expense;
use Carbon\Carbon;

class Budget2025Seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the 2025 fiscal year
        $fiscalYear = FiscalYear::where('year', 2025)->first();
        
        if (!$fiscalYear) {
            $this->command->error('Fiscal year 2025 not found. Please run FiscalYear2025Seeder first.');
            return;
        }

        // Create or get main budget for 2025
        $budget = Budget::firstOrCreate(
            ['fiscal_year_id' => $fiscalYear->id],
            [
                'current_amount' => 500000.00, // 500,000 DH initial budget
                'carryover_prev_year' => 50000.00, // 50,000 DH carryover from 2024
                'carryover_next_year' => 0.00, // Will be calculated at year end
                'created_at' => Carbon::create(2025, 1, 1, 9, 0, 0),
                'updated_at' => Carbon::create(2025, 1, 1, 9, 0, 0),
            ]
        );

        $this->command->info("Created budget for 2025 with total: " . number_format($budget->current_amount + $budget->carryover_prev_year, 2) . " DH");

        // Create sub-budgets first
        $this->createSubBudgets($budget);

        $this->command->info('Budget 2025 setup completed successfully.');
    }

    private function createSubBudgets(Budget $budget): void
    {
        $subBudgets = [
            ['label' => 'الإيرادات'],
            ['label' => 'المصروفات'],
            ['label' => 'الاستثمارات'],
        ];

        foreach ($subBudgets as $subBudgetData) {
            SubBudget::firstOrCreate([
                'budget_id' => $budget->id,
                'label' => $subBudgetData['label']
            ]);
        }

        $this->command->info('Created sub-budgets for 2025.');
    }

}