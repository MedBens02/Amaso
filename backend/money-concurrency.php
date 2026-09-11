<?php

/**
 * Does the same thing twice at once, and checks the money only moved once.
 *
 *     cd backend
 *     php artisan serve --port=8000          # in one terminal
 *     php artisan serve --port=8001          # in another
 *     php money-concurrency.php
 *
 * Separate from money-audit.php because it needs two servers. `php artisan
 * serve` is single-threaded, so a second request to the same process is
 * queued behind the first and the row locks are never actually tested - two
 * processes on two ports against one database is what makes the requests
 * genuinely simultaneous. A double-clicked approve button, or the same
 * expense confirmed from two tabs, is exactly this.
 *
 * The failure it exists to catch: both requests read the row as Draft, both
 * pass the guard, and the balance moves twice for one row.
 *
 * It writes real rows. Point it at a scratch database, never a real one.
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$A = rtrim(getenv('API') ?: 'http://127.0.0.1:8000', '/') . '/api/v1';
$B = rtrim(getenv('API2') ?: 'http://127.0.0.1:8001', '/') . '/api/v1';

if (DB::table('widows')->count() > 0 && DB::table('widows')->where('national_id', 'like', 'DEMO%')->count() === 0) {
    fwrite(STDERR, "Refusing to run: '" . config('database.connections.mysql.database')
        . "' does not look like demo data. This script writes rows.\n");
    exit(2);
}

function one(string $base, string $method, string $path, ?array $body, ?string $token): array {
    $ch = curl_init($base . $path);
    $h = ['Accept: application/json'];
    if ($token) $h[] = 'Authorization: Bearer ' . $token;
    if ($body !== null) { $h[] = 'Content-Type: application/json'; curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE)); }
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>$h, CURLOPT_TIMEOUT=>30]);
    $r = curl_exec($ch); $s = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['status'=>$s, 'body'=>json_decode($r ?: 'null', true)];
}

/** Fire both requests at the same instant through one multi handle. */
function bothAtOnce(array $calls, string $token): array {
    $multi = curl_multi_init();
    $handles = [];
    foreach ($calls as $i => [$base, $method, $path, $body]) {
        $ch = curl_init($base . $path);
        $h = ['Accept: application/json', 'Authorization: Bearer ' . $token];
        if ($body !== null) { $h[] = 'Content-Type: application/json'; curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE)); }
        curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>$method, CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPHEADER=>$h, CURLOPT_TIMEOUT=>30]);
        curl_multi_add_handle($multi, $ch);
        $handles[$i] = $ch;
    }
    $running = null;
    do { curl_multi_exec($multi, $running); curl_multi_select($multi, 0.05); } while ($running > 0);
    $out = [];
    foreach ($handles as $i => $ch) {
        $out[$i] = ['status' => curl_getinfo($ch, CURLINFO_HTTP_CODE), 'body' => json_decode(curl_multi_getcontent($ch) ?: 'null', true)];
        curl_multi_remove_handle($multi, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi);
    return $out;
}

$login = one($A, 'POST', '/auth/login', ['email'=>'admin@amaso.org','password'=>'password'], null);
$token = $login['body']['data']['token'] ?? $login['body']['token'];

$fy = DB::table('fiscal_years')->where('is_active', true)->first();
$acc = DB::table('bank_accounts')->orderBy('id')->get();
$today = date('Y-m-d');
$total = fn () => (float) DB::table('bank_accounts')->sum('balance');
$ledger = fn () => (int) DB::table('bank_account_transactions')->count();

$pass = 0; $fail = [];
$check = function (string $what, bool $ok, string $detail = '') use (&$pass, &$fail) {
    if ($ok) { $pass++; echo "  PASS  $what" . ($detail ? "  ($detail)" : '') . PHP_EOL; }
    else { $fail[] = $what . ($detail ? " - $detail" : ''); echo "  FAIL  $what" . ($detail ? "  ($detail)" : '') . PHP_EOL; }
};

echo PHP_EOL . "Two simultaneous approvals of the same row" . PHP_EOL . str_repeat('-', 74) . PHP_EOL;

// ---- income
$income = one($A, 'POST', '/incomes', [
    'fiscal_year_id'=>$fy->id, 'budget_id'=>DB::table('budgets')->value('id'),
    'income_category_id'=>DB::table('income_categories')->value('id'),
    'donor_id'=>DB::table('donors')->value('id'),
    'income_date'=>$today, 'amount'=>1000.00, 'payment_method'=>'BankWire',
    'bank_account_id'=>$acc[0]->id, 'remarks'=>'concurrency',
], $token);
$incomeId = $income['body']['data']['id'];

$before = $total(); $ledgerBefore = $ledger();
$r = bothAtOnce([[$A,'POST',"/incomes/{$incomeId}/approve",null], [$B,'POST',"/incomes/{$incomeId}/approve",null]], $token);
printf("  responses: %d and %d\n", $r[0]['status'], $r[1]['status']);
$check('one income approval succeeds and one is refused',
    count(array_filter($r, fn ($x) => $x['status'] === 200)) === 1,
    'delta ' . number_format($total() - $before, 2));
$check('the account is credited exactly once', abs(($total() - $before) - 1000.00) < 0.005,
    number_format($total() - $before, 2));
$check('exactly one ledger row was written', $ledger() === $ledgerBefore + 1, ($ledger() - $ledgerBefore) . ' rows');

// ---- expense
$expense = one($A, 'POST', '/expenses', [
    'fiscal_year_id'=>$fy->id, 'budget_id'=>DB::table('budgets')->value('id'),
    'expense_category_id'=>DB::table('expense_categories')->value('id'),
    'expense_date'=>$today, 'amount'=>400.00, 'payment_method'=>'BankWire',
    'bank_account_id'=>$acc[0]->id, 'unrelated_to_benef'=>true, 'details'=>'concurrency',
], $token);
$expenseId = $expense['body']['data']['id'];

$before = $total(); $ledgerBefore = $ledger();
$r = bothAtOnce([[$A,'POST',"/expenses/{$expenseId}/approve",null], [$B,'POST',"/expenses/{$expenseId}/approve",null]], $token);
printf("  responses: %d and %d\n", $r[0]['status'], $r[1]['status']);
$check('one expense approval succeeds and one is refused',
    count(array_filter($r, fn ($x) => $x['status'] === 200)) === 1);
$check('the account is debited exactly once', abs(($total() - $before) + 400.00) < 0.005,
    number_format($total() - $before, 2));
$check('exactly one ledger row was written', $ledger() === $ledgerBefore + 1, ($ledger() - $ledgerBefore) . ' rows');

// ---- transfer
$transfer = one($A, 'POST', '/transfers', [
    'fiscal_year_id'=>$fy->id, 'transfer_date'=>$today,
    'from_account_id'=>$acc[0]->id, 'to_account_id'=>$acc[1]->id, 'amount'=>300.00,
], $token);
$transferId = $transfer['body']['data']['id'];

$beforeFrom = (float) DB::table('bank_accounts')->where('id',$acc[0]->id)->value('balance');
$ledgerBefore = $ledger();
$r = bothAtOnce([[$A,'POST',"/transfers/{$transferId}/approve",null], [$B,'POST',"/transfers/{$transferId}/approve",null]], $token);
printf("  responses: %d and %d\n", $r[0]['status'], $r[1]['status']);
$afterFrom = (float) DB::table('bank_accounts')->where('id',$acc[0]->id)->value('balance');
$check('one transfer approval succeeds and one is refused',
    count(array_filter($r, fn ($x) => $x['status'] === 200)) === 1);
$check('the source account is debited exactly once', abs(($beforeFrom - $afterFrom) - 300.00) < 0.005,
    number_format($beforeFrom - $afterFrom, 2));
$check('exactly two ledger rows were written', $ledger() === $ledgerBefore + 2, ($ledger() - $ledgerBefore) . ' rows');

// ---- deposit of the same cash income from both sides
$cash = one($A, 'POST', '/incomes', [
    'fiscal_year_id'=>$fy->id, 'budget_id'=>DB::table('budgets')->value('id'),
    'income_category_id'=>DB::table('income_categories')->value('id'),
    'donor_id'=>DB::table('donors')->value('id'),
    'income_date'=>$today, 'amount'=>700.00, 'payment_method'=>'Cash', 'remarks'=>'concurrency',
], $token);
$cashId = $cash['body']['data']['id'];
one($A, 'POST', "/incomes/{$cashId}/approve", null, $token);

$before = $total(); $ledgerBefore = $ledger();
$payload = ['bank_account_id'=>$acc[1]->id, 'transferred_at'=>$today];
$r = bothAtOnce([[$A,'POST',"/incomes/{$cashId}/transfer-to-bank",$payload], [$B,'POST',"/incomes/{$cashId}/transfer-to-bank",$payload]], $token);
printf("  responses: %d and %d\n", $r[0]['status'], $r[1]['status']);
$check('one deposit succeeds and one is refused',
    count(array_filter($r, fn ($x) => $x['status'] === 200)) === 1);
$check('the account is credited exactly once', abs(($total() - $before) - 700.00) < 0.005,
    number_format($total() - $before, 2));
$check('exactly one ledger row was written', $ledger() === $ledgerBefore + 1, ($ledger() - $ledgerBefore) . ' rows');

// ---- the books still balance
echo PHP_EOL;
foreach (DB::table('bank_accounts')->get() as $a) {
    $sum = (float) DB::table('bank_account_transactions')->where('bank_account_id',$a->id)->sum('amount');
    $check("account #{$a->id}: opening + ledger == balance",
        abs(((float) $a->opening_balance + $sum) - (float) $a->balance) < 0.005,
        number_format($a->opening_balance,2) . ' + ' . number_format($sum,2) . ' vs ' . number_format($a->balance,2));
}

echo PHP_EOL . str_repeat('=', 74) . PHP_EOL . "  {$pass} passed, " . count($fail) . " failed" . PHP_EOL;
foreach ($fail as $f) echo "  - $f" . PHP_EOL;
echo PHP_EOL;
exit($fail ? 1 : 0);
