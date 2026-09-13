<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Writes the audit trail.
 *
 * Everything here is deliberately centralised rather than spread across the
 * services that do the writing: coverage that depends on each write site
 * remembering to log is coverage with holes in it, and the holes are always
 * in the code nobody has touched recently. AuditObserver calls in here for
 * every domain model instead.
 */
class AuditLogger
{
    /**
     * Turned off while seeding. A demo seed writes thousands of rows that
     * nobody performed, and burying the real history under them would make
     * the screen useless on a demo install.
     */
    private static bool $enabled = true;

    /** Never recorded, on any model: noise, or secrets. */
    private const GLOBAL_IGNORED = [
        'created_at',
        'updated_at',
        'remember_token',
    ];

    /**
     * Recorded as having changed, but never with their values. Someone
     * reading the log needs to know a password was reset and by whom; the
     * hash itself has no business being copied into a second table.
     */
    private const REDACTED = [
        'password',
        'remember_token',
        'api_token',
    ];

    /**
     * Fields whose movement is a side effect of something else already
     * being logged. A bank balance moves because an income was approved -
     * the approval is the event, and bank_account_transactions already
     * carries the money trail row by row.
     */
    private const IGNORED_PER_MODEL = [
        'BankAccount' => ['balance'],
    ];

    /** Long text is trimmed: the log records that a note changed, not a copy of it. */
    private const MAX_VALUE_LENGTH = 500;

    public static function disable(): void
    {
        self::$enabled = false;
    }

    public static function enable(): void
    {
        self::$enabled = true;
    }

    public static function enabled(): bool
    {
        return self::$enabled;
    }

    /**
     * Record one change.
     *
     * Failures are logged and swallowed. The alternative - letting a broken
     * audit insert roll back the income it was describing - would mean a
     * schema problem here could stop the association taking money, which is
     * a worse failure than a gap in the trail. The gap is loud in the
     * application log rather than silent.
     */
    public static function record(
        string $action,
        Model $model,
        ?array $changes = null,
        ?string $label = null,
    ): void {
        if (!self::$enabled) {
            return;
        }

        try {
            $user = auth()->user();

            // Signing in is the one thing recorded before the guard knows
            // who is asking - the token has only just been issued. The
            // person is not anonymous, though: they are the account being
            // stamped, so the row is attributed to them rather than filed
            // under "the system".
            if ($action === 'logged_in' && $user === null && $model instanceof \App\Models\User) {
                $user = $model;
            }

            AuditLog::create([
                'user_id' => $user?->id,
                'user_name' => $user?->name,
                'action' => $action,
                'entity_type' => class_basename($model),
                'entity_id' => $model->getKey(),
                'entity_label' => mb_substr($label ?? self::labelFor($model), 0, 200),
                // A sign-in is the whole event; the timestamp it moved is
                // already the row's own created_at.
                'changes' => ($action === 'logged_in' ? null : $changes) ?: null,
                'ip_address' => request()?->ip(),
            ]);
        } catch (Throwable $e) {
            Log::error('Audit log write failed', [
                'action' => $action,
                'entity' => class_basename($model) . '#' . $model->getKey(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Compare two snapshots of a record's list-shaped sections and record
     * one row for whatever moved.
     *
     * Some sections of the family file - phone numbers, social income and
     * expense lines, maouna, skills, illnesses, aid types - are stored as
     * their own rows but edited as one field of one form, and the form
     * replaces each section wholesale on save. That is done with mass
     * deletes and pivot syncs, neither of which fires a model event, so the
     * observer never sees them. Diffing the section contents around the
     * save is what keeps "somebody changed this family's phone number" from
     * being the one edit in the app that leaves no trace.
     *
     * @param  array<string, array<int, string>>  $before
     * @param  array<string, array<int, string>>  $after
     */
    public static function recordSections(Model $root, array $before, array $after): void
    {
        $changes = [];

        foreach ($after as $section => $lines) {
            $was = $before[$section] ?? [];
            sort($was);
            sort($lines);

            if ($was === $lines) {
                continue;
            }

            $changes[$section] = [
                'from' => self::present($was === [] ? null : implode('، ', $was)),
                'to' => self::present($lines === [] ? null : implode('، ', $lines)),
            ];
        }

        if ($changes !== []) {
            self::record('updated', $root, $changes);
        }
    }

    /**
     * What actually changed, as { field: { from, to } }.
     *
     * Returns an empty array when nothing worth recording moved, which is
     * the observer's signal to write nothing at all - saving a model
     * without changing it should not leave a footprint.
     */
    public static function diff(Model $model): array
    {
        $ignored = array_merge(
            self::GLOBAL_IGNORED,
            self::IGNORED_PER_MODEL[class_basename($model)] ?? [],
        );

        $changes = [];

        foreach ($model->getChanges() as $field => $new) {
            if (in_array($field, $ignored, true)) {
                continue;
            }

            if (in_array($field, self::REDACTED, true)) {
                $changes[$field] = ['redacted' => true];
                continue;
            }

            $old = $model->getOriginal($field);

            // Eloquent reports a change when the cast value differs even if
            // the stored one does not (a "5" becoming 5, say). Comparing the
            // rendered values keeps those out of the log.
            $from = self::present($old);
            $to = self::present($new);

            if ($from === $to) {
                continue;
            }

            $changes[$field] = ['from' => $from, 'to' => $to];
        }

        return $changes;
    }

    /** The attributes a record was created with, minus the empty ones. */
    public static function initialValues(Model $model): array
    {
        $ignored = array_merge(
            self::GLOBAL_IGNORED,
            self::IGNORED_PER_MODEL[class_basename($model)] ?? [],
            [$model->getKeyName()],
        );

        $values = [];

        foreach ($model->getAttributes() as $field => $value) {
            if (in_array($field, $ignored, true) || $value === null || $value === '') {
                continue;
            }

            $values[$field] = in_array($field, self::REDACTED, true)
                ? ['redacted' => true]
                : ['from' => null, 'to' => self::present($value)];
        }

        return $values;
    }

    /** The state a record was in when it was deleted. */
    public static function finalValues(Model $model): array
    {
        $values = [];

        foreach (self::initialValues($model) as $field => $entry) {
            $values[$field] = isset($entry['redacted'])
                ? $entry
                : ['from' => $entry['to'], 'to' => null];
        }

        return $values;
    }

    /**
     * The action to file a change under.
     *
     * "updated: status Draft to Approved" is a true description of an
     * approval and a useless one to scan a page of. Where a change means
     * something in the association's own terms, it is filed under that
     * instead.
     */
    public static function actionFor(Model $model, array $changes): string
    {
        $entity = class_basename($model);
        $status = $changes['status']['to'] ?? null;

        if (in_array($entity, ['Income', 'Expense', 'Transfer'], true)) {
            if ($status === 'Approved') {
                return 'approved';
            }
            if ($status === 'Rejected') {
                return 'rejected';
            }
            // Cash and cheques reach the bank later than the income does.
            if (isset($changes['transferred_at']) && ($changes['transferred_at']['from'] ?? null) === null) {
                return 'transferred';
            }
        }

        if ($entity === 'FiscalYear' && isset($changes['status'])) {
            return $status === 'Closed' ? 'closed' : 'reopened';
        }

        if ($entity === 'User') {
            // Signing in stamps last_login_at. On its own that is not an
            // edit to anybody's account, and filing it as one puts a row
            // reading "user record modified" in the log every time somebody
            // opens the app. It is worth recording - who signed in and when
            // is exactly the sort of question this screen exists for - just
            // not under that name.
            if (array_keys($changes) === ['last_login_at']) {
                return 'logged_in';
            }
            if (isset($changes['password'])) {
                return 'password_changed';
            }
            if (isset($changes['is_active'])) {
                return $changes['is_active']['to'] ? 'activated' : 'deactivated';
            }
        }

        return 'updated';
    }

    /**
     * What to call the record on screen.
     *
     * Resolved centrally rather than as a method on each of forty models:
     * the naming conventions already in the schema (label, name, a pair of
     * name columns) cover almost all of them, and the handful that read
     * badly as a bare name are special-cased here where they can be seen
     * together.
     */
    public static function labelFor(Model $model): string
    {
        $entity = class_basename($model);
        $id = $model->getKey();

        $money = fn ($amount) => number_format((float) $amount, 2) . ' د.م';

        return match ($entity) {
            'Income' => 'إيراد #' . $id . ' — ' . $money($model->amount),
            'Expense' => 'مصروف #' . $id . ' — ' . $money($model->amount),
            'Transfer' => 'تحويل #' . $id . ' — ' . $money($model->amount),
            'KafilSponsorship' => 'كفالة #' . $id . ' — ' . $money($model->amount),
            'FiscalYear' => 'السنة المالية ' . $model->year,
            'Setting' => (string) $model->getKey(),
            'OrphanEnrollment' => 'تسجيل دراسي #' . $id,
            default => self::nameOf($model) ?? ($entity . ' #' . $id),
        };
    }

    /** The first naming attribute the model actually has. */
    private static function nameOf(Model $model): ?string
    {
        foreach (['full_name', 'label', 'name_ar', 'name', 'title', 'year', 'key'] as $attribute) {
            $value = $model->getAttribute($attribute);
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        $first = $model->getAttribute('first_name');
        $last = $model->getAttribute('last_name');

        if (is_string($first) && $first !== '') {
            return trim($first . ' ' . (is_string($last) ? $last : ''));
        }

        return null;
    }

    /** A value as it should read in the log: short, flat, and a string or null. */
    private static function present(mixed $value): string|int|float|bool|null
    {
        if ($value === null || is_bool($value) || is_int($value) || is_float($value)) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i');
        }

        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_UNICODE);
        }

        $value = (string) $value;

        return mb_strlen($value) > self::MAX_VALUE_LENGTH
            ? mb_substr($value, 0, self::MAX_VALUE_LENGTH) . '…'
            : $value;
    }
}
