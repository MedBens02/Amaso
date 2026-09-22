<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * A superuser is an admin who can also manage accounts and read the
     * activity log. Those two are held back deliberately: one hands out
     * everybody's access, and the other is the record of what everybody did,
     * which is worth little if the people it watches can also read and be
     * guided by it.
     *
     * Everything else - the money, the families, the fiscal year, the
     * reference data - an admin can do.
     */
    public const ROLE_SUPERUSER = 'superuser';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_ACCOUNTANT = 'accountant';
    public const ROLE_SOCIAL_WORKER = 'social_worker';

    /** Allowed values for `role`, used by validation and the seeder. */
    public const ROLES = [
        self::ROLE_SUPERUSER,
        self::ROLE_ADMIN,
        self::ROLE_ACCOUNTANT,
        self::ROLE_SOCIAL_WORKER,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'is_active',
        'two_factor_enabled',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'password_changed_at' => 'datetime',
        ];
    }

    /**
     * Has admin powers - which a superuser does too.
     *
     * Every existing caller asks this to decide whether somebody may close a
     * fiscal year, edit the kafala percentages, change the organisation's
     * details. A superuser is an admin with two extras, so they must pass
     * every one of those, and answering only for the literal role would have
     * locked the two highest accounts out of the ordinary admin screens.
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPERUSER], true);
    }

    /** May manage accounts and read the activity log. Nobody else may. */
    public function isSuperuser(): bool
    {
        return $this->role === self::ROLE_SUPERUSER;
    }

    /**
     * The shape every endpoint returns a user in. Kept in one place so the
     * login response, /auth/me and the admin account list cannot drift apart
     * (the frontend caches whichever one it saw last under the same key).
     */
    /**
     * Whether this password has to be changed before anything else happens.
     *
     * Null means an administrator reset it, or the account was just made
     * with a password somebody else chose - either way the person has not
     * picked their own yet, so it is treated as due whatever the age rule
     * says. A max age of zero switches the age rule off but not this: a
     * password the owner has never chosen is not one they have kept.
     */
    public function mustChangePassword(): bool
    {
        if ($this->password_changed_at === null) {
            return true;
        }

        $maxAge = (int) Setting::get('password_max_age_days', '30');

        return $maxAge > 0 && $this->password_changed_at->addDays($maxAge)->isPast();
    }

    /** Days left on this password, or null when the rule is switched off. */
    public function passwordExpiresInDays(): ?int
    {
        $maxAge = (int) Setting::get('password_max_age_days', '30');

        if ($maxAge <= 0 || $this->password_changed_at === null) {
            return null;
        }

        return (int) ceil(now()->diffInDays($this->password_changed_at->copy()->addDays($maxAge), false));
    }

    public function toProfileArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'address' => $this->address,
            'is_active' => (bool) $this->is_active,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'two_factor_enabled' => (bool) $this->two_factor_enabled,
            // The frontend routes straight to the change-password screen on
            // this, but it is the middleware that enforces it - a client is
            // not something to rely on for a rule that matters.
            'must_change_password' => $this->mustChangePassword(),
            'password_expires_in_days' => $this->passwordExpiresInDays(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
