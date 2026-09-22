<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * One six-digit code, on its way to one person's inbox.
 *
 * Stored hashed and never in the clear: while it lives, this row is as good
 * as the password it sits behind, and a database copy - a nightly backup, a
 * developer with a connection - must not hand over the means to sign in as
 * somebody else.
 */
class LoginCode extends Model
{
    protected $fillable = [
        'user_id',
        'challenge',
        'code_hash',
        'expires_at',
        'consumed_at',
        'attempts',
        'ip',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'consumed_at' => 'datetime',
        'attempts' => 'integer',
    ];

    protected $hidden = ['code_hash', 'challenge'];

    /**
     * How many wrong guesses a code survives.
     *
     * Six digits is one in a million per try, which is only a wall while the
     * tries are counted. Five and the code is dead - the person asks for
     * another, and whoever was guessing starts from one in a million again.
     */
    public const MAX_ATTEMPTS = 5;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mint a code for this user and return it in the clear, once.
     *
     * The caller has exactly one chance to put the digits in an email; they
     * are not recoverable afterwards, which is the point.
     *
     * Any code the user already had is consumed first. Two live codes would
     * mean an old email still works after a new one was asked for, and
     * somebody who asked twice because the first was slow would have doubled
     * the guesses against them rather than replaced them.
     *
     * @return array{code: string, row: self}
     */
    public static function issueFor(User $user, int $lifetimeMinutes, ?string $ip = null): array
    {
        self::where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        // random_int, not rand: this is a credential, and a predictable one
        // is no credential at all.
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $row = self::create([
            'user_id' => $user->id,
            'challenge' => Str::random(64),
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(max(1, $lifetimeMinutes)),
            'ip' => $ip,
        ]);

        return ['code' => $code, 'row' => $row];
    }

    public function isUsable(): bool
    {
        return $this->consumed_at === null
            && $this->attempts < self::MAX_ATTEMPTS
            && $this->expires_at->isFuture();
    }

    /**
     * Check a guess, counting it whether it was right or wrong.
     *
     * The count goes up before the comparison so that a crash, a timeout or
     * anything else between the two cannot hand back a free attempt.
     */
    public function matches(string $code): bool
    {
        $this->increment('attempts');

        return Hash::check($code, $this->code_hash);
    }
}
