<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\MailDelivery;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * The two accounts the system starts with, both superusers.
 *
 * There used to be three demo accounts sharing the password "password",
 * listed on the login page with a button that filled them in. That was right
 * for showing the application to somebody and wrong for a server anybody can
 * reach: the credentials were in the repository, on the sign-in screen, and
 * identical everywhere the application had ever been installed.
 *
 * Now each account is created with a password invented here and printed once
 * while seeding. Nothing secret is committed, two installations never share
 * a password, and the only copy is in the output of the command that made
 * it - so it has to be written down at that moment, which is the behaviour
 * worth encouraging anyway.
 *
 * Re-running this does NOT reset an existing account's password. A deploy
 * re-seeds whenever it finds no users, and silently putting the password
 * back to something printed months ago would be a quiet way to lose control
 * of an account.
 */
class UserSeeder extends Seeder
{
    /**
     * Set AMASO_SEED_PASSWORD to choose the password instead of having one
     * invented - which is how regenerate-demo-sql.sh produces a dump a
     * colleague can actually sign in to. Never set it on a real server.
     */
    private const PASSWORD_ENV = 'AMASO_SEED_PASSWORD';

    public function run(): void
    {
        $accounts = [
            ['name' => 'محمد بنصديق', 'email' => 'mohamed@amaso.site'],
            ['name' => 'بشرى', 'email' => 'bouchra@amaso.site'],
        ];

        $created = [];

        foreach ($accounts as $account) {
            if (User::where('email', $account['email'])->exists()) {
                continue;
            }

            $password = env(self::PASSWORD_ENV) ?: $this->invent();

            User::create([
                'name' => $account['name'],
                'email' => $account['email'],
                'role' => User::ROLE_SUPERUSER,
                'password' => Hash::make($password),
                'email_verified_at' => now(),
                'is_active' => true,
                // A fresh install runs this after the migration, so the
                // migration's backfill never saw these rows. Without this
                // they would take the column default and require a code
                // that a log-file "mailer" can never deliver - locking
                // somebody out of a server they just installed.
                'two_factor_enabled' => MailDelivery::works(),
            ]);

            $created[$account['email']] = $password;
        }

        $this->announce($created);
    }

    /**
     * A password worth having: long enough that it cannot be guessed at over
     * the network, and drawn from a set with no characters that are read
     * wrongly off a screen - no l or 1, no O or 0 - because this one gets
     * copied by hand exactly once.
     */
    private function invent(): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        $password = '';

        for ($i = 0; $i < 20; $i++) {
            $password .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        // Grouped, because twenty unbroken characters get mistyped.
        return implode('-', str_split($password, 5));
    }

    private function announce(array $created): void
    {
        if ($this->command === null) {
            return;
        }

        if ($created === []) {
            $this->command->info('The starting accounts already exist - their passwords were left alone.');

            return;
        }

        $this->command->warn('');
        $this->command->warn('  ┌─ WRITE THESE DOWN NOW ' . str_repeat('─', 40));
        $this->command->warn('  │  They are not stored anywhere else and cannot be shown again.');
        $this->command->warn('  │');

        foreach ($created as $email => $password) {
            $this->command->warn(sprintf('  │  %-24s %s', $email, $password));
        }

        $this->command->warn('  │');
        $this->command->warn('  │  Change them after signing in:  الإعدادات ← الملف الشخصي');
        $this->command->warn('  └' . str_repeat('─', 63));
        $this->command->warn('');

        if (! MailDelivery::works()) {
            foreach (MailDelivery::adviceLines() as $line) {
                $this->command->warn('  ' . $line);
            }
            $this->command->warn('');
        }
    }
}
