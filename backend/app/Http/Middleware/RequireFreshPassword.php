<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Nothing but changing the password, once the password is due.
 *
 * Enforced here rather than in the browser, because a rule that only the
 * frontend applies is a rule anybody with the token can ignore - and the
 * token is handed out before the password is changed, deliberately: the
 * person has to be signed in to change it.
 *
 * The exceptions are the few calls the change itself needs. Reading your own
 * profile, because the screen shows who you are signed in as; changing the
 * password, obviously; logging out, because somebody who does not want to
 * change it now must still be able to leave rather than be stuck with a
 * session they cannot use or end.
 */
class RequireFreshPassword
{
    /** The calls a person with an overdue password may still make. */
    private const ALLOWED = [
        'api/v1/auth/me',
        'api/v1/auth/password',
        'api/v1/auth/logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->mustChangePassword()) {
            return $next($request);
        }

        if (in_array($request->path(), self::ALLOWED, true)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'انتهت صلاحية كلمة المرور. يجب تغييرها قبل متابعة العمل.',
            // Named so the frontend can route to the change-password screen
            // instead of showing this as an ordinary failure.
            'code' => 'password_expired',
        ], 423);
    }
}
