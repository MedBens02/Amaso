<?php

use App\Models\Setting;
use App\Support\MailDelivery;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A second step at the door, and passwords that do not last forever.
 *
 * Signing in was a password and nothing else, so a password written on a
 * note beside a shared office computer was the whole of the security on a
 * database of real families. Now the password is the first of two steps: get
 * it right and a six-digit code goes to the address on the account, and only
 * that code finishes the login.
 *
 * The code is stored hashed, like the password, and for the same reason.
 * These rows are a credential while they live; a database copy taken for a
 * backup, or read by anybody with a connection, must not hand over the means
 * to sign in as somebody else.
 *
 * The challenge is what the browser holds between the two steps. It is a
 * random string rather than the user's id: the first step would otherwise
 * tell an unauthenticated caller which addresses have accounts, and a login
 * screen is the last place to answer that question.
 *
 * two_factor_enabled is the way back in when the post stops. Mail failing
 * refuses the login rather than waving it through - a second factor that
 * disappears when somebody breaks your mail server is not a second factor -
 * but an administrator can switch it off for one account, and a command can
 * do the same from the server when nobody can get in at all.
 *
 * Which is why existing accounts are only switched on when this server can
 * actually send mail. The shipped .env.example sets MAIL_MAILER=log, so the
 * server the association is running today writes its email to a file instead
 * of sending it. Turning the requirement on regardless would not refuse
 * anybody's login - it would succeed, "send" the code to a log nobody reads,
 * and lock out every member of staff at once with no error to explain it.
 * Silent is the worst way for this to fail, so it does not start that way:
 * set the mail settings, prove them with `amaso:mail-test`, then switch the
 * requirement on with `amaso:two-factor --all --on`.
 *
 * password_changed_at is backfilled to the moment of the upgrade rather than
 * to when each account was made. Dating it truthfully would expire every
 * password the day this ships and meet the whole association with a forced
 * change at once; starting the clock now gives everybody their first full
 * period, and the policy is the same from the second one onwards.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // What the browser carries between the two steps, and all it
            // carries: it names no account to anybody who intercepts it.
            $table->string('challenge', 64)->unique();

            // Hashed, never the digits. See the note above.
            $table->string('code_hash');

            $table->timestamp('expires_at');
            $table->timestamp('consumed_at')->nullable();

            // Guessing six digits is 1 in a million per try, which is only
            // safe while the tries are counted.
            $table->unsignedTinyInteger('attempts')->default(0);

            // Where the attempt came from, for the activity log to answer
            // "who was trying" after the fact.
            $table->string('ip', 45)->nullable();
            $table->timestamps();

            // Every verification looks a code up by challenge and expiry.
            $table->index(['user_id', 'expires_at'], 'login_codes_user_expiry_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')->default(true)->after('is_active');
            $table->timestamp('password_changed_at')->nullable()->after('two_factor_enabled');
        });

        $now = now();

        // Asked in one place, because the seeder has to answer it the same
        // way when it creates the first accounts on a new server.
        $mailWorks = MailDelivery::works();

        DB::table('users')->update([
            'password_changed_at' => $now,
            'two_factor_enabled' => $mailWorks,
        ]);

        if (! $mailWorks) {
            // Said out loud during the upgrade, because the alternative is
            // an administrator who believes the second step is on.
            fwrite(STDERR, PHP_EOL . '  '
                . implode(PHP_EOL . '  ', MailDelivery::adviceLines())
                . PHP_EOL . PHP_EOL);
        }

        foreach ([
            // How long a password is good for. Zero switches the rule off
            // entirely, which is worth having: a policy nobody can turn off
            // is one somebody works around.
            'password_max_age_days' => '30',
            // How long a code is worth typing. Long enough for mail to
            // arrive and be read, short enough that one left in an inbox is
            // no use tomorrow.
            'login_code_lifetime_minutes' => '10',
        ] as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => $now, 'created_at' => $now],
            );
        }
        // Written through the query builder, so the model's cache still
        // holds the values from before this ran.
        Setting::forget();
    }

    public function down(): void
    {
        DB::table('settings')
            ->whereIn('key', ['password_max_age_days', 'login_code_lifetime_minutes'])
            ->delete();

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['two_factor_enabled', 'password_changed_at']);
        });

        Schema::dropIfExists('login_codes');
    }
};
