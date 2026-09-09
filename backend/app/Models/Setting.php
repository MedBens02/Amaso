<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Admin-editable configuration, one row per key.
 *
 * Reads go through a cache because the PDF header asks for the association's
 * name on every generated page; writes clear it.
 */
class Setting extends Model
{
    protected $primaryKey = 'key';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'settings.all';

    /** Every stored setting as key => value. */
    public static function all_values(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return static::query()->pluck('value', 'key')->all();
        });
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = self::all_values()[$key] ?? null;

        // A row that exists but holds '' is treated as unset, so clearing a
        // field in the UI falls back to the configured default rather than
        // stamping an empty association name on every report.
        return ($value === null || $value === '') ? $default : $value;
    }

    /** @param array<string, string|null> $values */
    public static function putMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget(self::CACHE_KEY);
    }
}
