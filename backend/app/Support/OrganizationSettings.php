<?php

namespace App\Support;

use App\Models\Setting;

/**
 * The association's identity, as printed on reports and shown on the
 * settings screen.
 *
 * Each value comes from the settings table when an admin has set one, and
 * falls back to config/organization.php otherwise - so a fresh install has
 * a sensible name on its reports before anyone opens the settings page.
 */
class OrganizationSettings
{
    /** Setting key => config key it falls back to. */
    public const FIELDS = [
        'org.name' => 'organization.name',
        'org.address' => 'organization.address',
        'org.phone' => 'organization.phone',
        'org.email' => 'organization.email',
    ];

    public static function get(string $key): ?string
    {
        $configKey = self::FIELDS[$key] ?? null;

        return Setting::get($key, $configKey ? config($configKey) : null);
    }

    public static function name(): string
    {
        return self::get('org.name') ?? '';
    }

    /** @return array<string, string|null> keyed by the short field name. */
    public static function all(): array
    {
        $values = [];
        foreach (array_keys(self::FIELDS) as $key) {
            $values[str_replace('org.', '', $key)] = self::get($key);
        }

        return $values;
    }
}
