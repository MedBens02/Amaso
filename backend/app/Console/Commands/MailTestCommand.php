<?php

namespace App\Console\Commands;

use App\Mail\LoginCodeMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Prove mail works before the association depends on it.
 *
 * Login refuses when a code cannot be sent, so the first time anybody finds
 * out the settings are wrong must not be the morning they cannot open their
 * own records. This sends the real login-code email, through the real
 * transport, to an address you name.
 */
class MailTestCommand extends Command
{
    protected $signature = 'amaso:mail-test {email : Where to send the test}';

    protected $description = 'Send a test login-code email to check the mail settings';

    public function handle(): int
    {
        $to = $this->argument('email');
        $mailer = config('mail.default');

        $this->line("Transport: {$mailer}");

        if ($mailer === 'log') {
            $this->warn('MAIL_MAILER is "log": nothing is actually sent, it is written to storage/logs/laravel.log.');
            $this->warn('Logins will fail for anybody whose account requires a code. Set real SMTP settings first.');
        }

        // A real user so the email reads exactly as it will in service,
        // rather than a stub that proves less than it looks like it does.
        $user = User::where('email', $to)->first()
            ?? new User(['name' => 'اختبار', 'email' => $to]);

        try {
            Mail::to($to)->send(new LoginCodeMail($user, '123456', 10));
        } catch (\Throwable $e) {
            $this->error('Could not send: ' . $e->getMessage());
            $this->line('');
            $this->line('Check MAIL_HOST, MAIL_PORT, MAIL_USERNAME and MAIL_PASSWORD in backend/.env.');
            $this->line('For Gmail, MAIL_PASSWORD must be a 16-character app password, not the account password.');

            return self::FAILURE;
        }

        $this->info($mailer === 'log'
            ? "Written to the log. Look for the code 123456 in storage/logs/laravel.log."
            : "Sent to {$to}. If it does not arrive within a minute, check the spam folder.");

        return self::SUCCESS;
    }
}
