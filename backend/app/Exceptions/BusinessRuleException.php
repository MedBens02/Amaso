<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * A domain rule was violated (e.g. approving an already-approved expense).
 * Rendered as JSON {"message": ...} with the given HTTP status - see bootstrap/app.php.
 */
class BusinessRuleException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 422)
    {
        parent::__construct($message);
    }
}
