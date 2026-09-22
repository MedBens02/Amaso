<?php

namespace App\Support;

use Illuminate\Http\Response;

/**
 * The header that tells the browser what to call a downloaded file.
 *
 * Everything this application produces is titled in Arabic, and until now
 * every download was named in English: `sponsorship-gaps-2026-09-22.pdf`.
 * A folder of those is unreadable to the people who asked for them, and
 * worse for the cards - `widow-card-17.pdf` says nothing about which
 * family, because the only Arabic part of the name, the person's name, was
 * stripped out by a slug that kept A-Z and digits.
 *
 * A non-ASCII filename cannot go in the plain `filename=` parameter: the
 * header is bytes, the encoding is not declared, and browsers guess.
 * RFC 5987 defines `filename*`, which declares UTF-8 and percent-encodes -
 * every current browser prefers it when both are present. So both are sent:
 * the Arabic name in `filename*`, and a plain ASCII name in `filename=` for
 * anything that does not understand it, which is the only thing the old
 * behaviour was ever good for.
 */
class Attachment
{
    /**
     * @param  string  $name       The Arabic name, without an extension.
     * @param  string  $extension  pdf or xlsx.
     * @param  string  $fallback   ASCII name for browsers that ignore filename*.
     */
    public static function headers(
        string $contentType,
        string $name,
        string $extension,
        string $fallback = 'report',
    ): array {
        $date = now()->format('Y-m-d');
        // A filename cannot carry a path separator or the characters
        // Windows refuses, and a newline would let a name forge a header.
        $clean = trim(preg_replace('#[\\\\/:*?"<>|\r\n]+#u', ' ', $name));
        $clean = trim(preg_replace('/\s+/u', ' ', $clean));
        $full = "{$clean} {$date}.{$extension}";

        return [
            'Content-Type' => $contentType,
            'Content-Disposition' => sprintf(
                "attachment; filename=\"%s-%s.%s\"; filename*=UTF-8''%s",
                $fallback,
                $date,
                $extension,
                rawurlencode($full),
            ),
            // The browser fetches this with an Authorization header, so the
            // frontend reads it as a blob - it needs the name from here.
            'Access-Control-Expose-Headers' => 'Content-Disposition',
        ];
    }

    public static function pdf(string $contents, string $name, string $fallback = 'report'): Response
    {
        return response($contents, 200, self::headers('application/pdf', $name, 'pdf', $fallback));
    }

    public static function sheet(string $contents, string $name, string $fallback = 'report'): Response
    {
        return response($contents, 200, self::headers(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            $name,
            'xlsx',
            $fallback,
        ));
    }
}
