<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to the given roles: `->middleware('role:admin')`.
 *
 * Hiding a menu entry in the frontend is presentation, not authorization -
 * anyone can still call the endpoint directly - so admin-only actions are
 * gated here as well.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'ليست لديك صلاحية للقيام بهذا الإجراء',
            ], 403);
        }

        return $next($request);
    }
}
