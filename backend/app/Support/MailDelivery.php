<?php

namespace App\Support;

use Illuminate\Support\Facades\Config;

/**
 * Can this installation actually send an email to a person?
 *
 * One question, asked from two places that must answer it the same way: the
 * migration that switches the login code on for existing accounts, and the
 * seeder that creates the first accounts on a new server. They run at
 * different moments - the migration before any seeder, always - so neither
 * can do the other's work, and a second copy of this rule would be a second
 * copy that drifts.
 *
 * It matters because of how mail fails when it is not configured. A missing
 * SMTP server throws, the login refuses, and somebody reads an error. The
 * "log" transport does not throw: it accepts the message, writes it to
 * storage/logs/laravel.log and reports success. An account requiring a code
 * it can never receive is locked, silently, with nothing on screen to say
 * why - and .env.example ships MAIL_MAILER=log, so that is the state every
 * new installation starts in.
 *
 * So the requirement is not switched on until mail can leave the building.
 */
class MailDelivery
{
    /** Transports that accept a message and deliver it to nobody. */
    private const SINKS = ['log', 'array', 'null'];

    public static function works(): bool
    {
        return ! in_array(Config::get('mail.default'), self::SINKS, true);
    }

    /** What to tell somebody who has just been told it does not work. */
    public static function adviceLines(): array
    {
        return [
            'Mail is not configured (MAIL_MAILER=' . Config::get('mail.default') . '),',
            'so the emailed login code is OFF - otherwise the code would be written',
            'to a log file and nobody could sign in.',
            '',
            'Set the mail settings in backend/.env, then:',
            '  php artisan amaso:mail-test you@example.com',
            '  php artisan amaso:two-factor --all --on',
        ];
    }
}
