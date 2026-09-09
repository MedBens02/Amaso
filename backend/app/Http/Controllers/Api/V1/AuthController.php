<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ChangePasswordRequest;
use App\Http\Requests\V1\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        $token = $user->createToken($request->userAgent() ?? 'amaso-frontend');

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح',
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

        $user->forceFill(['password' => $request->validated()['password']])->save();

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
