<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\FiscalYear;
use App\Models\Transfer;
use App\Models\BankAccount;
use Carbon\Carbon;

class FiscalYear2025Seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Close all existing fiscal years
        FiscalYear::where('is_active', true)
            ->update(['is_active' => false]);
            
        // Create fiscal year 2025
        $fiscalYear2025 = FiscalYear::create([
            'year' => 2025,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Get all bank accounts
        $bankAccounts = BankAccount::all();
        
        if ($bankAccounts->count() < 2) {
            $this->command->warn('Not enough bank accounts found. Creating sample accounts...');
            
            // Create sample bank accounts if they don't exist
            $account1 = BankAccount::firstOrCreate(
                ['account_number' => '123456789'],
                [
                    'label' => 'الحساب الجاري الرئيسي',
                    'bank_name' => 'بنك المغرب',
                    'balance' => 250000.00,
                    'notes' => 'الحساب الرئيسي للشركة',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $account2 = BankAccount::firstOrCreate(
                ['account_number' => '987654321'],
                [
                    'label' => 'حساب التوفير',
                    'bank_name' => 'البنك الشعبي',
                    'balance' => 180000.00,
                    'notes' => 'حساب التوفير والاستثمار',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $account3 = BankAccount::firstOrCreate(
                ['account_number' => '555666777'],
                [
                    'label' => 'حساب العمليات',
                    'bank_name' => 'بنك التجارة والصناعة',
                    'balance' => 95000.00,
                    'notes' => 'حساب العمليات اليومية',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $bankAccounts = collect([$account1, $account2, $account3]);
        }

        // Create sample transfers for 2025
        $transfers = [
            [
                'transfer_date' => '2025-01-15',
                'from_account_id' => $bankAccounts->first()->id,
                'to_account_id' => $bankAccounts->skip(1)->first()->id,
                'amount' => 25000.00,
                'remarks' => 'تحويل رأس المال للاستثمار',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-01-15 10:30:00'),
            ],
            [
                'transfer_date' => '2025-02-01',
                'from_account_id' => $bankAccounts->skip(1)->first()->id,
                'to_account_id' => $bankAccounts->last()->id,
                'amount' => 15000.00,
                'remarks' => 'تمويل العمليات الشهرية',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-02-01 14:20:00'),
            ],
            [
                'transfer_date' => '2025-03-10',
                'from_account_id' => $bankAccounts->first()->id,
                'to_account_id' => $bankAccounts->last()->id,
                'amount' => 8500.00,
                'remarks' => 'سداد مستحقات المورديين',
                'status' => 'Draft',
                'approved_at' => null,
            ],
            [
                'transfer_date' => '2025-03-20',
                'from_account_id' => $bankAccounts->last()->id,
                'to_account_id' => $bankAccounts->first()->id,
                'amount' => 12000.00,
                'remarks' => 'إعادة تمويل الحساب الرئيسي',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-03-20 09:15:00'),
            ],
            [
                'transfer_date' => '2025-04-05',
                'from_account_id' => $bankAccounts->skip(1)->first()->id,
                'to_account_id' => $bankAccounts->first()->id,
                'amount' => 30000.00,
                'remarks' => 'تحويل أرباح الاستثمار',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-04-05 16:45:00'),
            ],
            [
                'transfer_date' => '2025-05-12',
                'from_account_id' => $bankAccounts->first()->id,
                'to_account_id' => $bankAccounts->skip(1)->first()->id,
                'amount' => 18000.00,
                'remarks' => 'استثمار في الأسهم',
                'status' => 'Draft',
                'approved_at' => null,
            ],
            [
                'transfer_date' => '2025-06-18',
                'from_account_id' => $bankAccounts->last()->id,
                'to_account_id' => $bankAccounts->skip(1)->first()->id,
                'amount' => 7500.00,
                'remarks' => 'تسوية حسابات ربع السنة',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-06-18 11:30:00'),
            ],
            [
                'transfer_date' => '2025-07-25',
                'from_account_id' => $bankAccounts->skip(1)->first()->id,
                'to_account_id' => $bankAccounts->last()->id,
                'amount' => 22000.00,
                'remarks' => 'تمويل مشروع جديد',
                'status' => 'Approved',
                'approved_at' => Carbon::parse('2025-07-25 13:20:00'),
            ],
            [
                'transfer_date' => '2025-08-10',
                'from_account_id' => $bankAccounts->first()->id,
                'to_account_id' => $bankAccounts->last()->id,
                'amount' => 5000.00,
                'remarks' => 'مصاريف إدارية',
                'status' => 'Draft',
                'approved_at' => null,
            ],
            [
                'transfer_date' => '2025-08-28',
                'from_account_id' => $bankAccounts->last()->id,
                'to_account_id' => $bankAccounts->first()->id,
                'amount' => 35000.00,
                'remarks' => 'إيرادات شهر أغسطس',
                'status' => 'Draft',
                'approved_at' => null,
            ]
        ];

        // Create the transfers
        foreach ($transfers as $transferData) {
            Transfer::create([
                'fiscal_year_id' => $fiscalYear2025->id,
                'transfer_date' => $transferData['transfer_date'],
                'from_account_id' => $transferData['from_account_id'],
                'to_account_id' => $transferData['to_account_id'],
                'amount' => $transferData['amount'],
                'remarks' => $transferData['remarks'],
                'status' => $transferData['status'],
                'approved_at' => $transferData['approved_at'],
                'created_at' => Carbon::parse($transferData['transfer_date'])->addHours(rand(1, 5)),
                'updated_at' => Carbon::parse($transferData['transfer_date'])->addHours(rand(6, 10)),
            ]);
        }

        // Update bank account balances based on approved transfers
        $this->updateAccountBalances($bankAccounts, $fiscalYear2025->id);

        $this->command->info('Fiscal Year 2025 created successfully with ' . count($transfers) . ' sample transfers.');
        $this->command->info('Account balances updated based on approved transfers.');
    }

    /**
     * Update account balances based on approved transfers
     */
    private function updateAccountBalances($bankAccounts, $fiscalYearId): void
    {
        // Reset balances to a base amount
        $baseBalances = [
            250000.00, // Main account
            180000.00, // Savings account  
            95000.00   // Operations account
        ];

        $bankAccounts->each(function ($account, $index) use ($baseBalances, $fiscalYearId) {
            $balance = $baseBalances[$index] ?? 100000.00;

            // Calculate balance changes from approved transfers
            $outgoingTransfers = Transfer::where('from_account_id', $account->id)
                ->where('fiscal_year_id', $fiscalYearId)
                ->where('status', 'Approved')
                ->sum('amount');

            $incomingTransfers = Transfer::where('to_account_id', $account->id)
                ->where('fiscal_year_id', $fiscalYearId)
                ->where('status', 'Approved')
                ->sum('amount');

            $finalBalance = $balance - $outgoingTransfers + $incomingTransfers;

            $account->update(['balance' => $finalBalance]);

            $this->command->info("Account {$account->label}: Balance updated to " . number_format($finalBalance, 2) . " DH");
        });
    }
}