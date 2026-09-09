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
        // and demoting the only admin would leave nobody able to grant the
        // role back.
        if ($user->isAdmin() && $data['role'] !== User::ROLE_ADMIN) {
            $this->guardSelf($request, $user, 'لا يمكنك تغيير صلاحيتك الخاصة');
            $this->guardLastAdmin($user, 'لا يمكن تغيير صلاحية آخر مدير للنظام');
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
            if ($user->isAdmin()) {
                $this->guardLastAdmin($user, 'لا يمكن إيقاف آخر مدير للنظام');
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
     * Set a new password on someone else's behalf. Their sessions are
     * revoked - a reset is only meaningful if whoever held the old password
     * is actually shut out.
     */
    public function resetPassword(ResetUserPasswordRequest $request, User $user): JsonResponse
    {
        $user->forceFill(['password' => $request->validated()['password']])->save();
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

        if ($user->isAdmin()) {
            $this->guardLastAdmin($user, 'لا يمكن حذف آخر مدير للنظام');
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

    private function guardLastAdmin(User $user, string $message): void
    {
        $otherActiveAdmins = User::where('role', User::ROLE_ADMIN)
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->exists();

        if (!$otherActiveAdmins) {
            throw new BusinessRuleException($message);
        }
    }
}
