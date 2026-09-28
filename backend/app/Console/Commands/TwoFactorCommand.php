<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Switch the emailed login code off for an account, from the server.
 *
 * The break-glass. A login refuses when the code cannot be sent, which is
 * the right answer and also the one that locks everybody out if the mail
 * settings break while nobody is signed in. Someone with shell access on the
 * server can always get back in with this - and shell access on the server
 * is already the highest level of trust there is, so it grants nothing that
 * was not already granted.
 */
class TwoFactorCommand extends Command
{
    protected $signature = 'amaso:two-factor
                            {email? : The account to change. Omit to list them all}
                            {--all : Apply to every account instead of one}
                            {--on : Require the emailed code again}
                            {--off : Sign in with the password alone}';

    protected $description = 'Turn the emailed login code on or off for one account';

    public function handle(): int
    {
        $email = $this->argument('email');

        if ($this->option('on') === $this->option('off') && ($email !== null || $this->option('all'))) {
            $this->error('Choose one of --on or --off.');

            return self::FAILURE;
        }

        // The upgrade path: mail was not configured when this server
        // migrated, so nobody was switched on. Once `amaso:mail-test`
        // proves mail works, this turns the whole association on at once
        // rather than one address at a time.
        if ($this->option('all')) {
            $enabled = (bool) $this->option('on');
            $changed = User::where('two_factor_enabled', ! $enabled)->count();

            User::query()->update(['two_factor_enabled' => $enabled]);

            $this->info($enabled
                ? "The emailed login code is now required on every account ({$changed} changed)."
                : "Every account can now sign in with the password alone ({$changed} changed).");

            if ($enabled) {
                $this->line('Test it before you close this session - a wrong mail setting locks everybody out.');
            }

            return self::SUCCESS;
        }

        if ($email === null) {
            $this->table(
                ['Email', 'Name', 'Role', 'Active', 'Login code'],
                User::orderBy('email')->get()->map(fn (User $user) => [
                    $user->email,
                    $user->name,
                    $user->role,
                    $user->is_active ? 'yes' : 'no',
                    $user->two_factor_enabled ? 'required' : 'OFF',
                ])->all(),
            );

            $this->line('');
            $this->line('  php artisan amaso:two-factor <email> --off   # password only');
            $this->line('  php artisan amaso:two-factor <email> --on    # require the code');
            $this->line('  php artisan amaso:two-factor --all --on      # the whole association');

            return self::SUCCESS;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No account with the address {$email}.");

            return self::FAILURE;
        }

        $enabled = (bool) $this->option('on');
        $user->forceFill(['two_factor_enabled' => $enabled])->save();

        $this->info($enabled
            ? "{$user->email} now needs the emailed code again."
            : "{$user->email} can now sign in with the password alone. Turn it back on once mail works.");

        return self::SUCCESS;
    }
}
