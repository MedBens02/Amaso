<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo accounts, one per role, all using the same password so they're easy
 * to hand out for a demo. Safe to re-run (matched on email).
 */
class UserSeeder extends Seeder
{
    public const DEMO_PASSWORD = 'password';

    public function run(): void
    {
        $accounts = [
            ['name' => 'بنصديق محمد', 'email' => 'admin@amaso.org', 'role' => User::ROLE_ADMIN],
            ['name' => 'سارة المحاسبة', 'email' => 'accountant@amaso.org', 'role' => User::ROLE_ACCOUNTANT],
            ['name' => 'أحمد الأخصائي', 'email' => 'social@amaso.org', 'role' => User::ROLE_SOCIAL_WORKER],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'role' => $account['role'],
                    'password' => Hash::make(self::DEMO_PASSWORD),
                    'email_verified_at' => now(),
                    // Re-seeding is how a demo gets back to a known-good
                    // state, so an account suspended during the demo is
                    // deliberately reactivated here.
                    'is_active' => true,
                ]
            );
        }
    }
}
