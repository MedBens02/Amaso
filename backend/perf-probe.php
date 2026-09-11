<?php

/**
 * Splits one request's cost into its parts, so a fixed overhead can be told
 * apart from a slow query.
 *
 *     cd backend
 *     php perf-probe.php
 *
 * Why this exists: when every endpoint answers in roughly the same time -
 * a two-row table as slowly as a full-year aggregation - the time is not
 * going into the queries. It is being spent before they run. This prints
 * where.
 */

$t0 = microtime(true);
require __DIR__ . '/vendor/autoload.php';
$tAutoload = microtime(true);

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$tBoot = microtime(true);

// The first DB touch is where the connection is actually established, so a
// hostname that resolves slowly shows up here and nowhere else.
$tc0 = microtime(true);
DB::connection()->getPdo();
$tConnect = microtime(true);

// No table, no index, no rows: the bare round trip to the server.
$tq0 = microtime(true);
DB::select('SELECT 1');
$tPing = microtime(true);

$ts0 = microtime(true);
$accounts = DB::table('bank_accounts')->count();
$tSmall = microtime(true);

$th0 = microtime(true);
DB::table('incomes')->where('status', 'Approved')->sum('amount');
$tHeavy = microtime(true);

$ms = fn ($a, $b) => str_pad(number_format(($b - $a) * 1000, 1) . ' ms', 10, ' ', STR_PAD_LEFT);

$bootTotal = ($tBoot - $t0) * 1000;
$queryTotal = (($tPing - $tq0) + ($tSmall - $ts0) + ($tHeavy - $th0)) * 1000;

echo PHP_EOL;
echo "  Framework" . PHP_EOL;
echo "    autoload (vendor)        " . $ms($t0, $tAutoload) . PHP_EOL;
echo "    Laravel boot             " . $ms($tAutoload, $tBoot) . PHP_EOL;
echo PHP_EOL;
echo "  Database" . PHP_EOL;
echo "    connect                  " . $ms($tc0, $tConnect) . PHP_EOL;
echo "    SELECT 1 (round trip)    " . $ms($tq0, $tPing) . PHP_EOL;
echo "    count bank_accounts ({$accounts})   " . $ms($ts0, $tSmall) . PHP_EOL;
echo "    SUM over incomes         " . $ms($th0, $tHeavy) . PHP_EOL;
echo PHP_EOL;
echo "  ----------------------------------------" . PHP_EOL;
echo "    framework   " . str_pad(number_format($bootTotal, 0) . ' ms', 8, ' ', STR_PAD_LEFT) . PHP_EOL;
echo "    queries     " . str_pad(number_format($queryTotal, 0) . ' ms', 8, ' ', STR_PAD_LEFT) . PHP_EOL;
echo PHP_EOL;

echo "  Environment" . PHP_EOL;
echo "    PHP " . PHP_VERSION . '  (' . PHP_SAPI . ')' . PHP_EOL;
echo "    DB_HOST = " . config('database.connections.mysql.host') . PHP_EOL;
echo "    files loaded to boot: " . count(get_included_files()) . PHP_EOL;
echo PHP_EOL;

// -------------------------------------------------------------------------
// What to do about it
// -------------------------------------------------------------------------
$notes = [];

if ($bootTotal > $queryTotal * 3) {
    $notes[] = "The framework costs far more than the queries. Every request re-reads and\n"
        . "    re-compiles several hundred PHP files, which opcache is meant to prevent.\n"
        . "    Check it is on for the *web* server, not just here:  php -i | findstr opcache.enable";
}

if (!ini_get('opcache.enable')) {
    $notes[] = "opcache is off in this SAPI. In php.ini set:\n"
        . "      opcache.enable=1\n"
        . "      opcache.enable_cli=1\n"
        . "      opcache.memory_consumption=192\n"
        . "      opcache.max_accelerated_files=20000";
}

if (($tConnect - $tc0) * 1000 > 100) {
    $notes[] = "Connecting to the database is slow on its own. If DB_HOST is 'localhost',\n"
        . "    change it to 127.0.0.1 - resolving 'localhost' can try IPv6 first and wait\n"
        . "    for that to fail.";
}

if (stripos(PHP_OS_FAMILY, 'Windows') !== false) {
    $notes[] = "On Windows, real-time virus scanning inspects each of those file reads.\n"
        . "    Excluding the project folder and the PHP folder from Windows Security >\n"
        . "    Virus & threat protection > Exclusions typically halves the boot time.";
}

if ($notes) {
    echo "  Worth checking" . PHP_EOL;
    foreach ($notes as $n) {
        echo "  - " . $n . PHP_EOL . PHP_EOL;
    }
}

echo "  total " . $ms($t0, microtime(true)) . PHP_EOL . PHP_EOL;
