<?php

namespace App\Support;

/**
 * Number formatting for the RTL report templates.
 *
 * A leading "-" or a trailing "%" is bidi-neutral: dropped into an Arabic run
 * it attaches to the surrounding right-to-left text and lands on the wrong end
 * of the number ("1,200.00-" reads as "-1,200.00" reversed). Wrapping the
 * numeric part in LTR isolates pins it, which is why these go through one
 * helper instead of a formatting lambda repeated in every view.
 */
class PdfFormat
{
    private const LRI = "\u{2066}";  // LEFT-TO-RIGHT ISOLATE
    private const PDI = "\u{2069}";  // POP DIRECTIONAL ISOLATE

    /**
     * A leading "-" lands between the number and the currency in an RTL run,
     * which reads as neither positive nor negative. Naming the sign in Arabic
     * is unambiguous wherever it ends up on the line.
     */
    public static function money(float|int|string|null $value, string $currency = 'د.م'): string
    {
        if ($value === null) {
            return '—';
        }

        $amount = (float) $value;
        $formatted = self::ltr(number_format(abs($amount), 2)) . ' ' . $currency;

        return $amount < 0 ? "سالب {$formatted}" : $formatted;
    }

    public static function number(float|int|string|null $value, int $decimals = 2): string
    {
        return $value === null ? '—' : self::ltr(number_format((float) $value, $decimals));
    }

    public static function percent(float|int|null $value, int $decimals = 1): string
    {
        return $value === null ? '—' : self::ltr(number_format((float) $value, $decimals) . '%');
    }

    /** Isolate a run so neighbouring RTL text cannot reorder its signs. */
    public static function ltr(string $text): string
    {
        return self::LRI . $text . self::PDI;
    }
}
