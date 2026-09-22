<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ChangePasswordRequest;
use App\Http\Requests\V1\UpdateProfileRequest;
use App\Mail\LoginCodeMail;
use App\Models\LoginCode;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    /**
     * Issue a personal access token for valid credentials.
     * Sessions/cookies are not used - the frontend sends the token back as
     * an Authorization: Bearer header on every request.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب',
            'email.email' => 'البريد الإلكتروني غير صحيح',
            'password.required' => 'كلمة المرور مطلوبة',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'بيانات الدخول غير صحيحة',
            ], 401);
        }

        // A deactivated account keeps its history but must not get in. This
        // is said plainly rather than as "wrong credentials", so the person
        // knows to ask an admin instead of resetting a password that works.
        if (!$user->is_active) {
            return response()->json([
                'message' => 'هذا الحساب موقوف. يرجى الاتصال بمدير النظام',
            ], 403);
        }

        // The password was only the first of two steps. A code goes to the
        // address on the account and nothing is issued until it comes back.
        if ($user->two_factor_enabled) {
            return $this->sendCode($user, $request);
        }

        return $this->issueToken($user, $request, 'تم تسجيل الدخول بنجاح');
    }

    /**
     * Finish a login that is waiting on its code.
     *
     * The challenge names the attempt; the code proves the person reading
     * the inbox is the one at the keyboard. Every failure says the same
     * thing, because telling the difference between "that challenge is not
     * a thing", "it expired" and "wrong digits" tells somebody guessing
     * which part to change.
     */
    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'challenge' => ['required', 'string', 'size:64'],
            'code' => ['required', 'string', 'digits:6'],
        ], [
            'challenge.required' => 'انتهت جلسة التحقق. أعد تسجيل الدخول',
            'code.required' => 'رمز التحقق مطلوب',
            'code.digits' => 'رمز التحقق من ست أرقام',
        ]);

        $refused = fn () => response()->json([
            'message' => 'رمز التحقق غير صحيح أو انتهت صلاحيته',
        ], 401);

        $row = LoginCode::with('user')->where('challenge', $validated['challenge'])->first();

        if (! $row || ! $row->isUsable() || ! $row->user) {
            return $refused();
        }

        if (! $row->matches($validated['code'])) {
            return $refused();
        }

        // Consumed the moment it works. A code that stays valid after it has
        // been used is a code somebody can use again from a read inbox.
        $row->forceFill(['consumed_at' => now()])->save();

        $user = $row->user;

        if (! $user->is_active) {
            return response()->json([
                'message' => 'هذا الحساب موقوف. يرجى الاتصال بمدير النظام',
            ], 403);
        }

        return $this->issueToken($user, $request, 'تم تسجيل الدخول بنجاح');
    }

    /**
     * Send this user a fresh code, or refuse the login if it cannot go.
     *
     * Refusing is the whole point. Letting the login through when the mail
     * fails would mean the second factor disappears exactly when somebody
     * has broken your mail delivery, which is to say it was never a second
     * factor. The way back in is an administrator switching the code off for
     * one account, or `php artisan amaso:two-factor` from the server.
     *
     * The code row is deleted when the send fails, so a dead code is not
     * left occupying the one-live-code slot.
     */
    private function sendCode(User $user, Request $request): JsonResponse
    {
        $minutes = (int) Setting::get('login_code_lifetime_minutes', '10');
        ['code' => $code, 'row' => $row] = LoginCode::issueFor($user, $minutes, $request->ip());

        try {
            Mail::to($user->email)->send(new LoginCodeMail($user, $code, $minutes));
        } catch (\Throwable $e) {
            $row->delete();

            Log::error('Login code could not be sent', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'تعذّر إرسال رمز التحقق إلى بريدك. راجع إعدادات البريد أو اطلب من مدير النظام تعطيل التحقق بخطوتين لحسابك.',
            ], 503);
        }

        return response()->json([
            'message' => "تم إرسال رمز التحقق إلى {$this->maskEmail($user->email)}",
            'data' => [
                'requires_code' => true,
                'challenge' => $row->challenge,
                'expires_in_minutes' => $minutes,
                'email_hint' => $this->maskEmail($user->email),
            ],
        ]);
    }

    /**
     * "mohamed@amaso.site" -> "m******d@amaso.site"
     *
     * Enough for the person to recognise their own address and no help to
     * anybody who does not already know it.
     */
    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');

        $visible = mb_strlen($name) <= 2
            ? mb_substr($name, 0, 1)
            : mb_substr($name, 0, 1) . str_repeat('*', max(1, mb_strlen($name) - 2)) . mb_substr($name, -1);

        return $domain === '' ? $visible : "{$visible}@{$domain}";
    }

    /** The one place a token is minted, so every path records the login. */
    private function issueToken(User $user, Request $request, string $message): JsonResponse
    {
        $token = $user->createToken($request->userAgent() ?? 'amaso-frontend');

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => $message,
            'data' => [
                'token' => $token->plainTextToken,
                'user' => $user->toProfileArray(),
            ],
        ]);
    }

    /**
     * Revoke the token used for the current request only - other
     * devices/sessions for the same user stay logged in.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->toProfileArray(),
        ]);
    }

    /**
     * Update the signed-in user's own details. Role and active status are
     * deliberately not editable here - those belong to an admin, on the
     * account management screen.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return response()->json([
            'message' => 'تم حفظ التغييرات بنجاح',
            'data' => $user->fresh()->toProfileArray(),
        ]);
    }

    /**
     * Change the signed-in user's own password.
     *
     * Every other token is revoked and a fresh one issued: if the password
     * was changed because it may have leaked, a session already open
     * somewhere else must not survive the change. The new token is returned
     * so the caller's own session continues uninterrupted.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!Hash::check($request->validated()['current_password'], $user->password)) {
            return response()->json([
                'message' => 'كلمة المرور الحالية غير صحيحة',
                'errors' => ['current_password' => ['كلمة المرور الحالية غير صحيحة']],
            ], 422);
        }

        // Stamped here and nowhere else: the clock restarts when the owner
        // picks a password, not when an administrator hands them one.
        $user->forceFill([
            'password' => $request->validated()['password'],
            'password_changed_at' => now(),
        ])->save();

        $user->tokens()->delete();
        $token = $user->createToken($request->userAgent() ?? 'amaso-frontend');

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح',
            'data' => [
                'token' => $token->plainTextToken,
                'user' => $user->fresh()->toProfileArray(),
            ],
        ]);
    }
}
