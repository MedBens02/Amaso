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
        $value = Setting::get($key, $configKey ? config($configKey) : null);

        return $value === null ? null : self::stripBidiControls($value);
    }

    /**
     * Drop invisible bidi-control characters (RLM, LRM, the explicit
     * embedding/override/isolate marks, a stray BOM) from a value before it
     * is ever put in front of a PDF or spreadsheet template.
     *
     * These carry no visible glyph, so a value with one sitting in it looks
     * completely normal on the settings screen - but the mark itself has a
     * strong directional value, and one stray copy-pasted mark next to a
     * trailing number was enough to fold the rest of a Latin-script address
     * back over the phone and email that came after it on the printed
     * report. Stripped both here (so anything already saved self-heals the
     * moment this runs) and in UpdateOrganizationSettingsRequest (so a fresh
     * save never puts one back).
     */
    public static function stripBidiControls(string $value): string
    {
        return preg_replace(
            '/[\x{200B}-\x{200F}\x{061C}\x{202A}-\x{202E}\x{2066}-\x{2069}\x{FEFF}]/u',
            '',
            $value,
        ) ?? $value;
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
