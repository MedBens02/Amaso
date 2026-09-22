<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Read or change how long a password lasts, from the server.
 *
 * Thirty days is what the association asked for, and it is the default. It
 * is a setting rather than a constant because a policy that can only be
 * changed by a release is one that gets worked around instead: if thirty
 * days turns out to be a monthly interruption nobody has time for, the
 * choice should be lengthening it, not disabling the whole thing by hand in
 * the database.
 *
 * Zero switches expiry off, deliberately and visibly, so that turning it off
 * is a decision somebody made rather than a column somebody edited.
 */
class PasswordPolicyCommand extends Command
{
    protected $signature = 'amaso:password-policy
                            {--days= : How many days a password lasts. 0 switches expiry off}
                            {--code-minutes= : How long an emailed login code stays valid}';

    protected $description = 'Show or change the password expiry and login-code lifetime';

    public function handle(): int
    {
        $days = $this->option('days');
        $minutes = $this->option('code-minutes');

        foreach ([
            ['days', $days, 'password_max_age_days', 0, 3650],
            ['code-minutes', $minutes, 'login_code_lifetime_minutes', 1, 1440],
        ] as [$flag, $value, $key, $min, $max]) {
            if ($value === null) {
                continue;
            }

            if (! ctype_digit((string) $value) || (int) $value < $min || (int) $value > $max) {
                $this->error("--{$flag} must be a whole number between {$min} and {$max}.");

                return self::FAILURE;
            }

            Setting::putMany([$key => (string) (int) $value]);
        }

        $age = (int) Setting::get('password_max_age_days', '30');
        $life = (int) Setting::get('login_code_lifetime_minutes', '10');

        $this->line('');
        $this->line('  Passwords expire after: ' . ($age === 0 ? 'never (expiry is off)' : "{$age} days"));
        $this->line("  A login code is valid for: {$life} minutes");
        $this->line('');

        if ($age === 0) {
            $this->warn('Expiry is off. Passwords will never have to be changed.');

            return self::SUCCESS;
        }

        // Who this actually lands on, because "30 days" says nothing about
        // whether the change happens today or in a month.
        $due = User::where('is_active', true)
            ->get()
            ->filter(fn (User $user) => $user->mustChangePassword());

        $this->line($due->isEmpty()
            ? '  Nobody is due a change right now.'
            : "  Due a change at next sign-in: {$due->count()} of "
              . User::where('is_active', true)->count() . ' active accounts');

        foreach ($due as $user) {
            $this->line("    - {$user->email}");
        }

        return self::SUCCESS;
    }
}
