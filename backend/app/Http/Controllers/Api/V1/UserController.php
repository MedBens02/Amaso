<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ResetUserPasswordRequest;
use App\Http\Requests\V1\StoreUserRequest;
use App\Http\Requests\V1\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Account management, admin only (see the `role:admin` middleware on the
 * routes). Every action here can lock someone out, so each one is guarded
 * against the two ways that goes wrong: an admin locking out themselves,
 * and the association losing its last admin.
 */
class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->when($request->search, function ($query, $search) {
                return $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, fn ($query, $role) => $query->where('role', $role))
            ->when($request->filled('is_active'), function ($query) use ($request) {
                return $query->where('is_active', $request->boolean('is_active'));
            })
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $users->map(fn (User $user) => $user->toProfileArray())->all(),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        // fresh(): is_active comes from the column default when the request
        // omits it, and that default is not reflected on the in-memory model
        // - without this a new account reports itself as suspended.
        return response()->json([
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => $user->fresh()->toProfileArray(),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json(['data' => $user->toProfileArray()]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        // Demoting yourself would take away the screen you are standing on,
        // and demoting the only superuser would leave nobody able to grant
        // the role back - an admin cannot, which is the point of the role.
        // Demoting an ordinary admin needs no such guard: they could not
        // hand out access either way.
        if ($user->isSuperuser() && $data['role'] !== User::ROLE_SUPERUSER) {
            $this->guardSelf($request, $user, 'لا يمكنك تغيير صلاحيتك الخاصة');
            $this->guardLastSuperuser($user, 'لا يمكن تغيير صلاحية آخر مستخدم أعلى في النظام');
        }

        $user->fill($data)->save();

        return response()->json([
            'message' => 'تم تحديث الحساب بنجاح',
            'data' => $user->fresh()->toProfileArray(),
        ]);
    }

    /**
     * Deactivating revokes every token the user holds, so an open session
     * elsewhere stops working immediately rather than at its next login.
     */
    public function setActive(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate(['is_active' => ['required', 'boolean']]);
        $isActive = $validated['is_active'];

        if (!$isActive) {
            $this->guardSelf($request, $user, 'لا يمكنك إيقاف حسابك الخاص');
            if ($user->isSuperuser()) {
                $this->guardLastSuperuser($user, 'لا يمكن إيقاف آخر مستخدم أعلى في النظام');
            }
        }

        $user->forceFill(['is_active' => $isActive])->save();

        if (!$isActive) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => $isActive ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب',
            'data' => $user->fresh()->toProfileArray(),
        ]);
    }

    /**
     * Switch the emailed login code off, or back on, for one account.
     *
     * The way back in when the post stops. A login refuses rather than waving
     * somebody through when the code cannot be sent - a second factor that
     * vanishes with your mail server was never one - so there has to be a
     * door, and this is it: a deliberate act by an administrator, on one
     * named account, recorded in the activity log like everything else.
     *
     * If nobody can get in at all, `php artisan amaso:two-factor` does the
     * same thing from the server.
     */
    public function setTwoFactor(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'two_factor_enabled' => ['required', 'boolean'],
        ], [
            'two_factor_enabled.required' => 'الحالة مطلوبة',
        ]);

        $user->forceFill(['two_factor_enabled' => $validated['two_factor_enabled']])->save();

        return response()->json([
            'message' => $validated['two_factor_enabled']
                ? "تم تفعيل التحقق بخطوتين لحساب \"{$user->name}\""
                : "تم تعطيل التحقق بخطوتين لحساب \"{$user->name}\" — سيدخل بكلمة المرور وحدها",
            'data' => $user->toProfileArray(),
        ]);
    }

    /**
     * Set a new password on someone else's behalf. Their sessions are
     * revoked - a reset is only meaningful if whoever held the old password
     * is actually shut out.
     */
    public function resetPassword(ResetUserPasswordRequest $request, User $user): JsonResponse
    {
        // Cleared rather than stamped: the owner has not chosen this one, so
        // they are asked for their own the next time they sign in.
        $user->forceFill([
            'password' => $request->validated()['password'],
            'password_changed_at' => null,
        ])->save();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح',
        ]);
    }

    /**
     * Deleting is offered for accounts created by mistake. For anyone who
     * has actually used the system, deactivating is the right move - it
     * keeps their name on the records they created.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->guardSelf($request, $user, 'لا يمكنك حذف حسابك الخاص');

        if ($user->isSuperuser()) {
            $this->guardLastSuperuser($user, 'لا يمكن حذف آخر مستخدم أعلى في النظام');
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'تم حذف الحساب بنجاح']);
    }

    private function guardSelf(Request $request, User $user, string $message): void
    {
        if ($request->user()->id === $user->id) {
            throw new BusinessRuleException($message);
        }
    }

    /**
     * There must always be one active superuser left.
     *
     * They are the only accounts that can reach this screen at all, so
     * losing the last one locks account management shut for good - with no
     * way back through the application, only through the database.
     */
    private function guardLastSuperuser(User $user, string $message): void
    {
        $otherActiveSuperusers = User::where('role', User::ROLE_SUPERUSER)
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->exists();

        if (!$otherActiveSuperusers) {
            throw new BusinessRuleException($message);
        }
    }
}
