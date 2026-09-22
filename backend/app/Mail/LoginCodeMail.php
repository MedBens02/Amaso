<?php

namespace App\Mail;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The email carrying a login code.
 *
 * Sent synchronously, not queued, and that is deliberate: the login is
 * waiting on it. Queueing would return a token-less success to somebody
 * whose code is sitting in a queue that may not be running - the worst kind
 * of failure, because the screen says to check an inbox that will never
 * receive anything.
 */
class LoginCodeMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $code,
        public readonly int $lifetimeMinutes,
    ) {
    }

    public function envelope(): Envelope
    {
        $association = Setting::get('organization_name', 'جمعية المنصور لكفالة اليتيم');

        return new Envelope(
            // The code is in the subject as well as the body: on a phone the
            // preview is often all somebody needs to read.
            subject: "رمز الدخول: {$this->code} — {$association}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.login-code',
            with: [
                'name' => $this->user->name,
                'code' => $this->code,
                'minutes' => $this->lifetimeMinutes,
                'association' => Setting::get('organization_name', 'جمعية المنصور لكفالة اليتيم'),
            ],
        );
    }
}
