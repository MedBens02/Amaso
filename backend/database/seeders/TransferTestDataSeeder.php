<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transfer;
use App\Models\BankAccount;
use App\Models\FiscalYear;
use App\Models\User;

class TransferTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'admin@test.com')->first();
        if (!$user) {
            $this->command->error('User not found. Please run FiscalYearTestDataSeeder first.');
            return;
        }

        $fiscalYear2024 = FiscalYear::where('year', 2024)->first();
        if (!$fiscalYear2024) {
            $this->command->error('Fiscal year 2024 not found. Please run FiscalYearTestDataSeeder first.');
            return;
        }

        // Get bank accounts - we know these exist from the previous seeder
        $bankAccount1 = BankAccount::where('label', 'حساب البنك الشعبي الرئيسي')->first();
        $bankAccount2 = BankAccount::where('label', 'حساب التوفير - التجاري وفا')->first();

        if (!$bankAccount1 || !$bankAccount2) {
            $this->command->error('Bank accounts not found. Please run FiscalYearTestDataSeeder first.');
            return;
        }

        // Reset bank balances to start fresh for realistic transfers
        $bankAccount1->update(['balance' => 200000.00]);
        $bankAccount2->update(['balance' => 50000.00]);

        $this->command->info('Initial bank balances:');
        $this->command->info("- {$bankAccount1->label}: 200,000 DH");
        $this->command->info("- {$bankAccount2->label}: 50,000 DH");

        // Create realistic transfer scenarios
        $transfers = [
            // January transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-01-15',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 25000.00,
                'remarks' => 'تحويل لتغطية مصاريف الطوارئ - يناير',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(45)
            ],
            // February transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-02-10',
                'from_account_id' => $bankAccount2->id,
                'to_account_id' => $bankAccount1->id,
                'amount' => 10000.00,
                'remarks' => 'إعادة توزيع السيولة للحساب الرئيسي',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(38)
            ],
            // March transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-03-05',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 15000.00,
                'remarks' => 'تحويل لحساب التوفير - مارس',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(32)
            ],
            // April transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-04-22',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 30000.00,
                'remarks' => 'تحويل كبير لحساب الطوارئ',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(25)
            ],
            // May transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-05-18',
                'from_account_id' => $bankAccount2->id,
                'to_account_id' => $bankAccount1->id,
                'amount' => 20000.00,
                'remarks' => 'تحويل لتغطية المصاريف التشغيلية',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(18)
            ],
            // June transfers (approved)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-06-12',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 8000.00,
                'remarks' => 'تحويل صغير لضبط الأرصدة',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(12)
            ],
            // July transfers (pending approval)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-07-08',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 12000.00,
                'remarks' => 'تحويل في انتظار الموافقة - يوليو',
                'status' => 'Draft',
                'created_by' => $user->id,
                'approved_by' => null,
                'approved_at' => null
            ],
            // August transfers (pending approval)
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-08-15',
                'from_account_id' => $bankAccount2->id,
                'to_account_id' => $bankAccount1->id,
                'amount' => 5000.00,
                'remarks' => 'تحويل صغير في انتظار الموافقة',
                'status' => 'Draft',
                'created_by' => $user->id,
                'approved_by' => null,
                'approved_at' => null
            ],
            // Different amounts for filtering tests
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-06-25',
                'from_account_id' => $bankAccount1->id,
                'to_account_id' => $bankAccount2->id,
                'amount' => 2500.00,
                'remarks' => 'تحويل مبلغ صغير للاختبار',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(10)
            ],
            [
                'fiscal_year_id' => $fiscalYear2024->id,
                'transfer_date' => '2024-07-30',
                'from_account_id' => $bankAccount2->id,
                'to_account_id' => $bankAccount1->id,
                'amount' => 50000.00,
                'remarks' => 'تحويل مبلغ كبير للاختبار',
                'status' => 'Approved',
                'created_by' => $user->id,
                'approved_by' => $user->id,
                'approved_at' => now()->subDays(3)
            ]
        ];

        // Create transfers and apply balance changes for approved ones
        $currentBalance1 = 200000.00;
        $currentBalance2 = 50000.00;

        foreach ($transfers as $transferData) {
            $transfer = Transfer::create($transferData);
            
            // Apply balance changes for approved transfers
            if ($transferData['status'] === 'Approved') {
                if ($transferData['from_account_id'] === $bankAccount1->id) {
                    $currentBalance1 -= $transferData['amount'];
                    $currentBalance2 += $transferData['amount'];
                } else {
                    $currentBalance2 -= $transferData['amount'];
                    $currentBalance1 += $transferData['amount'];
                }
            }
        }

        // Update final balances
        $bankAccount1->update(['balance' => $currentBalance1]);
        $bankAccount2->update(['balance' => $currentBalance2]);

        $this->command->info('✅ Transfer test data created successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info("- Total transfers: " . count($transfers));
        $this->command->info("- Approved transfers: " . collect($transfers)->where('status', 'Approved')->count());
        $this->command->info("- Draft transfers: " . collect($transfers)->where('status', 'Draft')->count());
        $this->command->info('');
        $this->command->info('💰 Final bank balances:');
        $this->command->info("- {$bankAccount1->label}: " . number_format($currentBalance1, 2) . " DH");
        $this->command->info("- {$bankAccount2->label}: " . number_format($currentBalance2, 2) . " DH");
        $this->command->info('');
        $this->command->info('🔍 Test scenarios created for filtering:');
        $this->command->info('- Different months (Jan-Aug 2024)');
        $this->command->info('- Various amounts (2,500 - 50,000 DH)');
        $this->command->info('- Both account directions');
        $this->command->info('- Mixed approval status');
    }
}
