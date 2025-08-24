<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FiscalYear;
use App\Models\Budget;
use App\Models\SubBudget;
use App\Models\BankAccount;
use App\Models\IncomeCategory;
use App\Models\ExpenseCategory;
use App\Models\Donor;
use App\Models\Kafil;

class BasicDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create fiscal year 2025
        $fiscalYear = FiscalYear::create([
            'year' => 2025,
            'is_active' => true,
        ]);

        // Create budget for 2025
        $budget = Budget::create([
            'fiscal_year_id' => $fiscalYear->id,
            'current_amount' => 100000.00,
            'carryover_prev_year' => 0.00,
        ]);

        // Create sub-budgets
        $generalSubBudget = SubBudget::create([
            'budget_id' => $budget->id,
            'label' => 'الميزانية العامة',
        ]);

        $educationSubBudget = SubBudget::create([
            'budget_id' => $budget->id,
            'label' => 'ميزانية التعليم',
        ]);

        // Create bank accounts
        BankAccount::create([
            'label' => 'الحساب الرئيسي',
            'bank_name' => 'بنك فلسطين',
            'account_number' => '123456789',
            'balance' => 50000.00,
        ]);

        BankAccount::create([
            'label' => 'حساب النقد',
            'bank_name' => 'النقد',
            'account_number' => 'CASH001',
            'balance' => 5000.00,
        ]);

        // Create income categories
        IncomeCategory::create([
            'sub_budget_id' => $generalSubBudget->id,
            'label' => 'تبرعات عامة',
        ]);

        IncomeCategory::create([
            'sub_budget_id' => $generalSubBudget->id,
            'label' => 'رسوم كفالة',
        ]);

        // Create expense categories
        ExpenseCategory::create([
            'sub_budget_id' => $generalSubBudget->id,
            'label' => 'مساعدات نقدية',
        ]);

        ExpenseCategory::create([
            'sub_budget_id' => $educationSubBudget->id,
            'label' => 'رسوم مدرسية',
        ]);

        // Create sample donors
        Donor::create([
            'first_name' => 'محمد',
            'last_name' => 'أحمد',
            'phone' => '+970599123456',
            'email' => 'mohammed@example.com',
            'address' => 'غزة، فلسطين',
        ]);

        Donor::create([
            'first_name' => 'فاطمة',
            'last_name' => 'علي',
            'phone' => '+970599654321',
            'email' => 'fatma@example.com',
            'address' => 'رفح، فلسطين',
        ]);

        // Create sample kafils
        Kafil::create([
            'first_name' => 'عبد الرحمن',
            'last_name' => 'محمد',
            'phone' => '+970598123456',
            'email' => 'abdulrahman@example.com',
            'address' => 'خان يونس، فلسطين',
        ]);
    }
}