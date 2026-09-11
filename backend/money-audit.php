<?php

/**
 * Drives the money side of the API from end to end and checks the books.
 *
 *     cd backend
 *     php money-audit.php            # against http://127.0.0.1:8000
 *     API=http://host:port php money-audit.php
 *
 * Every case goes through HTTP rather than the services directly, so the
 * form requests, the controllers, the row locks and the ledger are all in
 * the path - which is where the gaps were, not in the arithmetic.
 *
 * It writes real rows. Point it at a scratch database, never a real one; it
 * refuses to start if the database it finds is not obviously demo data.
 *
 * What it asserts, for each of Cash / Cheque / BankWire:
 *  - a draft moves no money
 *  - approval moves exactly the right amount, in the right direction
 *  - the ledger row and the resulting balance agree
 *  - the same approval twice moves money once
 *  - an approved row cannot be edited or deleted out from under the ledger
 * and then: transfers, the funds check, the fiscal-year closing guards,
 * the carryover, and what the books do afterwards.
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$BASE = rtrim(getenv('API') ?: 'http://127.0.0.1:8000', '/') . '/api/v1';

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
$passed = 0;
$failed = [];
$section = '';

function heading(string $text): void
{
    global $section;
    $section = $text;
    echo PHP_EOL . "\033[1m" . $text . "\033[0m" . PHP_EOL . str_repeat('-', 74) . PHP_EOL;
}

function check(string $what, bool $ok, string $detail = ''): bool
{
    global $passed, $failed, $section;

    if ($ok) {
        $passed++;
        echo "  \033[32mPASS\033[0m  " . $what . ($detail ? "  ($detail)" : '') . PHP_EOL;
    } else {
        $failed[] = "$section > $what" . ($detail ? " - $detail" : '');
        echo "  \033[31mFAIL\033[0m  " . $what . ($detail ? "  ($detail)" : '') . PHP_EOL;
    }

    return $ok;
}

function money($value): string
{
    return number_format((float) $value, 2);
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------
$token = null;

function api(string $method, string $path, array $body = null): array
{
    global $BASE, $token;

    $ch = curl_init($BASE . $path);
    $headers = ['Accept: application/json'];

    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
    }

    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);

    $raw = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($raw ?: 'null', true), 'raw' => $raw];
}

/** The whole point: what the books say right now. */
function balances(): array
{
    return DB::table('bank_accounts')->orderBy('id')->pluck('balance', 'id')
        ->map(fn ($b) => (float) $b)->all();
}

function totalBalance(): float
{
    return (float) DB::table('bank_accounts')->sum('balance');
}

function ledgerCount(): int
{
    return (int) DB::table('bank_account_transactions')->count();
}

// ---------------------------------------------------------------------------
// Guard: never run this against real data
// ---------------------------------------------------------------------------
$demoMarkers = DB::table('widows')->where('national_id', 'like', 'DEMO%')->count();
$widowTotal = DB::table('widows')->count();

if ($widowTotal > 0 && $demoMarkers === 0) {
    fwrite(STDERR, "Refusing to run: '" . config('database.connections.mysql.database')
        . "' does not look like demo data (no DEMO* national IDs). This script writes rows.\n");
    exit(2);
}

echo PHP_EOL . "  database " . config('database.connections.mysql.database')
    . "   api {$BASE}" . PHP_EOL;

// ---------------------------------------------------------------------------
heading('Sign in and read the starting position');
// ---------------------------------------------------------------------------
$login = api('POST', '/auth/login', ['email' => 'admin@amaso.org', 'password' => 'password']);
check('login returns a token', $login['status'] === 200 && !empty($login['body']['data']['token'] ?? $login['body']['token'] ?? null));
$token = $login['body']['data']['token'] ?? $login['body']['token'] ?? null;

if (!$token) {
    fwrite(STDERR, "Cannot continue without a token: " . substr($login['raw'] ?? '', 0, 400) . "\n");
    exit(1);
}

$fiscalYear = DB::table('fiscal_years')->where('is_active', true)->first();
check('there is an active fiscal year', (bool) $fiscalYear, $fiscalYear->year ?? '-');

$accounts = DB::table('bank_accounts')->orderBy('id')->get();
check('there are at least two bank accounts', $accounts->count() >= 2, $accounts->count() . ' accounts');

$accountA = $accounts[0];
$accountB = $accounts[1];

$budget = DB::table('budgets')->first();
$incomeCategory = DB::table('income_categories')->first();
$expenseCategory = DB::table('expense_categories')->first();
$donor = DB::table('donors')->first();

check('reference data present', $budget && $incomeCategory && $expenseCategory && $donor);

$openingTotal = totalBalance();
echo "  opening total across accounts: " . money($openingTotal) . PHP_EOL;

// ---------------------------------------------------------------------------
// Helpers that build the payloads
// ---------------------------------------------------------------------------
$today = date('Y-m-d');

$makeIncome = function (string $method, float $amount, ?int $accountId = null) use (
    $fiscalYear, $budget, $incomeCategory, $donor, $today
) {
    return [
        'fiscal_year_id' => $fiscalYear->id,
        'budget_id' => $budget->id,
        'income_category_id' => $incomeCategory->id,
        'donor_id' => $donor->id,
        'income_date' => $today,
        'amount' => $amount,
        'payment_method' => $method,
        'cheque_number' => $method === 'Cheque' ? 'CHK-' . mt_rand(10000, 99999) : null,
        'bank_account_id' => $accountId,
        'remarks' => 'money-audit',
    ];
};

$makeExpense = function (string $method, float $amount, ?int $accountId = null) use (
    $fiscalYear, $budget, $expenseCategory, $today
) {
    return [
        'fiscal_year_id' => $fiscalYear->id,
        'budget_id' => $budget->id,
        'expense_category_id' => $expenseCategory->id,
        'expense_date' => $today,
        'amount' => $amount,
        'payment_method' => $method,
        'cheque_number' => $method === 'Cheque' ? 'CHK-' . mt_rand(10000, 99999) : null,
        'bank_account_id' => $accountId,
        'unrelated_to_benef' => true,
        'details' => 'money-audit',
    ];
};

// ---------------------------------------------------------------------------
heading('Incomes: every payment method, draft -> approved -> deposited');
// ---------------------------------------------------------------------------
$incomeIds = [];

foreach (['Cash', 'Cheque', 'BankWire'] as $method) {
    $amount = 1234.56;
    $accountId = $method === 'BankWire' ? $accountA->id : null;

    $before = totalBalance();
    $created = api('POST', '/incomes', $makeIncome($method, $amount, $accountId));
    $incomeId = $created['body']['data']['id'] ?? null;
    $incomeIds[$method] = $incomeId;

    check("{$method}: income created as a draft",
        $created['status'] === 201 && ($created['body']['data']['status'] ?? null) === 'Draft',
        'HTTP ' . $created['status']);

    check("{$method}: creating a draft moves no money",
        abs(totalBalance() - $before) < 0.005,
        money($before) . ' -> ' . money(totalBalance()));

    // ---- approve
    $beforeApprove = balances();
    $ledgerBefore = ledgerCount();
    $approved = api('POST', "/incomes/{$incomeId}/approve");
    check("{$method}: approval accepted", $approved['status'] === 200, 'HTTP ' . $approved['status']);

    $afterApprove = balances();
    $delta = array_sum($afterApprove) - array_sum($beforeApprove);

    if ($method === 'BankWire') {
        check("{$method}: approval credits the account by the full amount",
            abs($delta - $amount) < 0.005, 'delta ' . money($delta));
        check("{$method}: approval writes exactly one ledger row",
            ledgerCount() === $ledgerBefore + 1, ledgerCount() - $ledgerBefore . ' rows');
    } else {
        check("{$method}: approval alone moves no bank balance (money is still in hand)",
            abs($delta) < 0.005, 'delta ' . money($delta));
        check("{$method}: approval alone writes no ledger row",
            ledgerCount() === $ledgerBefore, ledgerCount() - $ledgerBefore . ' rows');
    }

    // ---- double approval
    $beforeSecond = totalBalance();
    $again = api('POST', "/incomes/{$incomeId}/approve");
    check("{$method}: approving twice is refused",
        $again['status'] >= 400, 'HTTP ' . $again['status']);
    check("{$method}: the refused second approval moved nothing",
        abs(totalBalance() - $beforeSecond) < 0.005,
        money($beforeSecond) . ' -> ' . money(totalBalance()));

    // ---- deposit to bank (cash and cheque only)
    if ($method !== 'BankWire') {
        $beforeDeposit = totalBalance();
        $ledgerBefore = ledgerCount();
        $deposit = api('POST', "/incomes/{$incomeId}/transfer-to-bank", [
            'bank_account_id' => $accountB->id,
            'transferred_at' => $today,
        ]);
        check("{$method}: deposit into the bank accepted", $deposit['status'] === 200, 'HTTP ' . $deposit['status']);
        check("{$method}: deposit credits the account by the full amount",
            abs((totalBalance() - $beforeDeposit) - $amount) < 0.005,
            'delta ' . money(totalBalance() - $beforeDeposit));
        check("{$method}: deposit writes exactly one ledger row",
            ledgerCount() === $ledgerBefore + 1);

        $beforeSecond = totalBalance();
        $depositAgain = api('POST', "/incomes/{$incomeId}/transfer-to-bank", [
            'bank_account_id' => $accountB->id,
            'transferred_at' => $today,
        ]);
        check("{$method}: depositing the same income twice is refused",
            $depositAgain['status'] >= 400, 'HTTP ' . $depositAgain['status']);
        check("{$method}: the refused second deposit moved nothing",
            abs(totalBalance() - $beforeSecond) < 0.005);
    }
}

// ---------------------------------------------------------------------------
heading('Incomes: an approved row must not be editable or deletable');
// ---------------------------------------------------------------------------
$approvedIncomeId = $incomeIds['BankWire'];
$before = totalBalance();

$edit = api('PUT', "/incomes/{$approvedIncomeId}", ['amount' => 999999]);
check('editing an approved income is refused', $edit['status'] >= 400, 'HTTP ' . $edit['status']);
check('the refused edit did not change the amount',
    abs((float) DB::table('incomes')->where('id', $approvedIncomeId)->value('amount') - 1234.56) < 0.005);

$delete = api('DELETE', "/incomes/{$approvedIncomeId}");
check('deleting an approved income is refused', $delete['status'] >= 400, 'HTTP ' . $delete['status']);
check('the ledger still explains the balance after both refusals',
    abs(totalBalance() - $before) < 0.005);

// ---------------------------------------------------------------------------
heading('Expenses: every payment method');
// ---------------------------------------------------------------------------
$expenseIds = [];

foreach (['Cash', 'Cheque', 'BankWire'] as $method) {
    $amount = 321.99;
    // Cash expenses are the case where the account is chosen at approval
    // time rather than when the expense is recorded.
    $accountOnCreate = $method === 'Cash' ? null : $accountA->id;

    $before = totalBalance();
    $created = api('POST', '/expenses', $makeExpense($method, $amount, $accountOnCreate));
    $expenseId = $created['body']['data']['id'] ?? null;
    $expenseIds[$method] = $expenseId;

    check("{$method}: expense created as a draft",
        $created['status'] === 201 && ($created['body']['data']['status'] ?? null) === 'Draft',
        'HTTP ' . $created['status']);
    check("{$method}: creating a draft moves no money", abs(totalBalance() - $before) < 0.005);

    $beforeApprove = totalBalance();
    $ledgerBefore = ledgerCount();
    $payload = $method === 'Cash' ? ['bank_account_id' => $accountA->id] : null;
    $approved = api('POST', "/expenses/{$expenseId}/approve", $payload);

    check("{$method}: approval accepted", $approved['status'] === 200, 'HTTP ' . $approved['status']);
    check("{$method}: approval debits the account by the full amount",
        abs((totalBalance() - $beforeApprove) + $amount) < 0.005,
        'delta ' . money(totalBalance() - $beforeApprove));
    check("{$method}: approval writes exactly one ledger row",
        ledgerCount() === $ledgerBefore + 1, ledgerCount() - $ledgerBefore . ' rows');

    $beforeSecond = totalBalance();
    $again = api('POST', "/expenses/{$expenseId}/approve", $payload);
    check("{$method}: approving twice is refused", $again['status'] >= 400, 'HTTP ' . $again['status']);
    check("{$method}: the refused second approval moved nothing",
        abs(totalBalance() - $beforeSecond) < 0.005);
}

// ---------------------------------------------------------------------------
heading('Expenses: the gap a cash payment can fall through');
// ---------------------------------------------------------------------------
$before = totalBalance();
$created = api('POST', '/expenses', $makeExpense('Cash', 500.00, null));
$orphanExpenseId = $created['body']['data']['id'] ?? null;
$approved = api('POST', "/expenses/{$orphanExpenseId}/approve");
$after = totalBalance();

check('approving an expense with no account named is refused',
    $approved['status'] >= 400,
    'HTTP ' . $approved['status']);
check('the refused approval moved nothing',
    abs($after - $before) < 0.005, 'delta ' . money($after - $before));
check('the refused approval left it a draft',
    DB::table('expenses')->where('id', $orphanExpenseId)->value('status') === 'Draft');
api('DELETE', "/expenses/{$orphanExpenseId}");

// ---------------------------------------------------------------------------
heading('Expenses: an approved row must not be editable or deletable');
// ---------------------------------------------------------------------------
$approvedExpenseId = $expenseIds['BankWire'];
$before = totalBalance();
$edit = api('PUT', "/expenses/{$approvedExpenseId}", ['amount' => 999999]);
check('editing an approved expense is refused', $edit['status'] >= 400, 'HTTP ' . $edit['status']);
$delete = api('DELETE', "/expenses/{$approvedExpenseId}");
check('deleting an approved expense is refused', $delete['status'] >= 400, 'HTTP ' . $delete['status']);
check('neither refusal moved money', abs(totalBalance() - $before) < 0.005);

// ---------------------------------------------------------------------------
heading('Expenses: spending more than the account holds');
// ---------------------------------------------------------------------------
$accountBalance = (float) DB::table('bank_accounts')->where('id', $accountA->id)->value('balance');
$before = totalBalance();
$created = api('POST', '/expenses', $makeExpense('BankWire', $accountBalance + 10000, $accountA->id));
$overdraftId = $created['body']['data']['id'] ?? null;
$approved = api('POST', "/expenses/{$overdraftId}/approve");

check('an expense larger than the balance is refused', $approved['status'] >= 400, 'HTTP ' . $approved['status']);
check('the refused overdraft moved nothing', abs(totalBalance() - $before) < 0.005);
check('the refused overdraft stayed a draft',
    DB::table('expenses')->where('id', $overdraftId)->value('status') === 'Draft');
api('DELETE', "/expenses/{$overdraftId}");

// ---------------------------------------------------------------------------
heading('Transfers between accounts');
// ---------------------------------------------------------------------------
$amount = 250.00;
$beforeFrom = (float) DB::table('bank_accounts')->where('id', $accountA->id)->value('balance');
$beforeTo = (float) DB::table('bank_accounts')->where('id', $accountB->id)->value('balance');
$beforeTotal = totalBalance();
$ledgerBefore = ledgerCount();

$created = api('POST', '/transfers', [
    'fiscal_year_id' => $fiscalYear->id,
    'transfer_date' => $today,
    'from_account_id' => $accountA->id,
    'to_account_id' => $accountB->id,
    'amount' => $amount,
    'remarks' => 'money-audit',
]);
$transferId = $created['body']['data']['id'] ?? null;
check('transfer created as a draft', $created['status'] === 201, 'HTTP ' . $created['status']);
check('creating a transfer draft moves no money', abs(totalBalance() - $beforeTotal) < 0.005);

$approved = api('POST', "/transfers/{$transferId}/approve");
check('transfer approval accepted', $approved['status'] === 200, 'HTTP ' . $approved['status']);

$afterFrom = (float) DB::table('bank_accounts')->where('id', $accountA->id)->value('balance');
$afterTo = (float) DB::table('bank_accounts')->where('id', $accountB->id)->value('balance');

check('the source account is debited', abs(($beforeFrom - $afterFrom) - $amount) < 0.005, money($beforeFrom - $afterFrom));
check('the destination account is credited', abs(($afterTo - $beforeTo) - $amount) < 0.005, money($afterTo - $beforeTo));
check('a transfer does not change the total held', abs(totalBalance() - $beforeTotal) < 0.005);
check('a transfer writes two ledger rows', ledgerCount() === $ledgerBefore + 2, ledgerCount() - $ledgerBefore . ' rows');

$beforeSecond = totalBalance();
$again = api('POST', "/transfers/{$transferId}/approve");
check('approving a transfer twice is refused', $again['status'] >= 400, 'HTTP ' . $again['status']);
check('the refused second approval moved nothing', abs(totalBalance() - $beforeSecond) < 0.005);

// insufficient funds
$sourceBalance = (float) DB::table('bank_accounts')->where('id', $accountA->id)->value('balance');
$created = api('POST', '/transfers', [
    'fiscal_year_id' => $fiscalYear->id,
    'transfer_date' => $today,
    'from_account_id' => $accountA->id,
    'to_account_id' => $accountB->id,
    'amount' => $sourceBalance + 10000,
]);
$overId = $created['body']['data']['id'] ?? null;
$beforeTotal = totalBalance();
$approved = api('POST', "/transfers/{$overId}/approve");
check('a transfer larger than the source balance is refused', $approved['status'] >= 400, 'HTTP ' . $approved['status']);
check('the refused transfer moved nothing', abs(totalBalance() - $beforeTotal) < 0.005);
api('DELETE', "/transfers/{$overId}");

// self-transfer
$self = api('POST', '/transfers', [
    'fiscal_year_id' => $fiscalYear->id,
    'transfer_date' => $today,
    'from_account_id' => $accountA->id,
    'to_account_id' => $accountA->id,
    'amount' => 10,
]);
check('a transfer to the same account is refused', $self['status'] >= 400, 'HTTP ' . $self['status']);

// ---------------------------------------------------------------------------
heading('The ledger has to explain the balance');
// ---------------------------------------------------------------------------
foreach (DB::table('bank_accounts')->get() as $account) {
    $ledgerSum = (float) DB::table('bank_account_transactions')
        ->where('bank_account_id', $account->id)->sum('amount');
    $opening = (float) ($account->opening_balance ?? 0);

    check("account #{$account->id}: opening + ledger == balance",
        abs(($opening + $ledgerSum) - (float) $account->balance) < 0.005,
        money($opening) . ' + ' . money($ledgerSum) . ' vs ' . money($account->balance));

    // Each row also records what the balance was after it, which is the only
    // way a statement can be read back without replaying the whole history.
    $rows = DB::table('bank_account_transactions')
        ->where('bank_account_id', $account->id)->orderBy('id')->get();
    $running = $opening;
    $drift = null;

    foreach ($rows as $row) {
        $running += (float) $row->amount;
        if (abs($running - (float) $row->balance_after) >= 0.005) {
            $drift = "row #{$row->id}: expected " . money($running) . ', stored ' . money($row->balance_after);
            break;
        }
    }

    check("account #{$account->id}: every ledger row's balance_after is right", $drift === null, $drift ?? '');
}

// ---------------------------------------------------------------------------
heading('Negative and zero amounts');
// ---------------------------------------------------------------------------
$negIncome = api('POST', '/incomes', $makeIncome('Cash', -100));
check('a negative income is refused', $negIncome['status'] >= 400, 'HTTP ' . $negIncome['status']);

$zeroIncome = api('POST', '/incomes', $makeIncome('Cash', 0));
check('a zero income is refused', $zeroIncome['status'] >= 400, 'HTTP ' . $zeroIncome['status']);
if ($zeroIncome['status'] < 400) {
    api('DELETE', '/incomes/' . ($zeroIncome['body']['data']['id'] ?? 0));
}

$negExpense = api('POST', '/expenses', $makeExpense('Cash', -100, $accountA->id));
check('a negative expense is refused', $negExpense['status'] >= 400, 'HTTP ' . $negExpense['status']);

$zeroTransfer = api('POST', '/transfers', [
    'fiscal_year_id' => $fiscalYear->id,
    'transfer_date' => $today,
    'from_account_id' => $accountA->id,
    'to_account_id' => $accountB->id,
    'amount' => 0,
]);
check('a zero transfer is refused', $zeroTransfer['status'] >= 400, 'HTTP ' . $zeroTransfer['status']);
if ($zeroTransfer['status'] < 400) {
    api('DELETE', '/transfers/' . ($zeroTransfer['body']['data']['id'] ?? 0));
}

// ---------------------------------------------------------------------------
heading('Fiscal year closing');
// ---------------------------------------------------------------------------
// Leave one of each unapproved, so each guard is actually exercised.
$draftIncome = api('POST', '/incomes', $makeIncome('Cash', 77.00));
$draftIncomeId = $draftIncome['body']['data']['id'] ?? null;

$summary = api('GET', "/fiscal-years/{$fiscalYear->id}/closing-summary");
$body = $summary['body']['data'] ?? $summary['body'] ?? [];
check('closing summary reports the unapproved income',
    ($body['unapprovedIncomes'] ?? 0) >= 1, 'unapproved: ' . ($body['unapprovedIncomes'] ?? '?'));
check('closing is blocked while something is unapproved', ($body['canClose'] ?? true) === false);

$close = api('POST', "/fiscal-years/{$fiscalYear->id}/close");
$closeBody = $close['body'] ?? [];
check('closing is refused while something is unapproved',
    $close['status'] >= 400 || ($closeBody['success'] ?? true) === false,
    'HTTP ' . $close['status']);
check('the refused close left the year open',
    (bool) DB::table('fiscal_years')->where('id', $fiscalYear->id)->value('is_active'));

// Approve it, but leave the cash undeposited: the carryover is the sum of
// bank balances, so undeposited cash would simply vanish at closing.
api('POST', "/incomes/{$draftIncomeId}/approve");
$summary = api('GET', "/fiscal-years/{$fiscalYear->id}/closing-summary");
$body = $summary['body']['data'] ?? $summary['body'] ?? [];
check('closing summary reports the undeposited cash',
    ($body['untransferredCash'] ?? 0) >= 1, 'untransferred: ' . ($body['untransferredCash'] ?? '?'));
check('closing is blocked while approved cash sits outside the bank',
    ($body['canClose'] ?? true) === false);

$close = api('POST', "/fiscal-years/{$fiscalYear->id}/close");
$closeBody = $close['body'] ?? [];
check('closing is refused while approved cash sits outside the bank',
    $close['status'] >= 400 || ($closeBody['success'] ?? true) === false, 'HTTP ' . $close['status']);

// Clear every blocker and close for real.
foreach (DB::table('incomes')->where('fiscal_year_id', $fiscalYear->id)->where('status', '!=', 'Approved')->pluck('id') as $id) {
    api('POST', "/incomes/{$id}/approve");
}
$unfunded = 0;
foreach (DB::table('expenses')->where('fiscal_year_id', $fiscalYear->id)->where('status', '!=', 'Approved')->get() as $row) {
    // Whatever account the expense already names, else whichever account can
    // currently cover it - the point here is to clear the board, not to test
    // the funds rule again.
    $account = $row->bank_account_id
        ?: DB::table('bank_accounts')->orderByDesc('balance')->value('id');

    $result = api('POST', "/expenses/{$row->id}/approve", ['bank_account_id' => $account]);

    if ($result['status'] >= 400) {
        $unfunded++;
        api('DELETE', "/expenses/{$row->id}");
    }
}
if ($unfunded) {
    echo "  (dropped {$unfunded} draft expense(s) no account could cover)" . PHP_EOL;
}
foreach (DB::table('transfers')->where('fiscal_year_id', $fiscalYear->id)->where('status', '!=', 'Approved')->pluck('id') as $id) {
    api('POST', "/transfers/{$id}/approve");
}
foreach (DB::table('incomes')->where('fiscal_year_id', $fiscalYear->id)
    ->where('status', 'Approved')->whereIn('payment_method', ['Cash', 'Cheque'])
    ->whereNull('transferred_at')->pluck('id') as $id) {
    api('POST', "/incomes/{$id}/transfer-to-bank", ['bank_account_id' => $accountB->id, 'transferred_at' => $today]);
}

$expectedCarryover = totalBalance();
$summary = api('GET', "/fiscal-years/{$fiscalYear->id}/closing-summary");
$body = $summary['body']['data'] ?? $summary['body'] ?? [];
check('with everything settled, closing is allowed', ($body['canClose'] ?? false) === true,
    implode(' / ', $body['validationMessages'] ?? []));

$close = api('POST', "/fiscal-years/{$fiscalYear->id}/close");
$closeBody = $close['body']['data'] ?? $close['body'] ?? [];
check('the year closes', $close['status'] === 200 && ($closeBody['success'] ?? false) === true, 'HTTP ' . $close['status']);

$closedYear = DB::table('fiscal_years')->where('id', $fiscalYear->id)->first();
$nextYear = DB::table('fiscal_years')->where('year', $fiscalYear->year + 1)->first();

check('the closed year is no longer active', !$closedYear->is_active);
check('the next year exists and is active', $nextYear && $nextYear->is_active);
check('the carryover equals the money actually held',
    abs((float) $closedYear->carryover_next_year - $expectedCarryover) < 0.005,
    money($closedYear->carryover_next_year) . ' vs ' . money($expectedCarryover));
check('the next year opens with the same carryover',
    $nextYear && abs((float) $nextYear->carryover_prev_year - $expectedCarryover) < 0.005,
    money($nextYear->carryover_prev_year ?? 0));
check('closing moved no money', abs(totalBalance() - $expectedCarryover) < 0.005);

// ---------------------------------------------------------------------------
heading('After closing: the closed year must stay closed');
// ---------------------------------------------------------------------------
$intoClosed = api('POST', '/incomes', $makeIncome('Cash', 100));
check('posting an income into the closed year is refused', $intoClosed['status'] >= 400, 'HTTP ' . $intoClosed['status']);

$intoClosedExpense = api('POST', '/expenses', $makeExpense('Cash', 100, $accountA->id));
check('posting an expense into the closed year is refused', $intoClosedExpense['status'] >= 400, 'HTTP ' . $intoClosedExpense['status']);

$intoClosedTransfer = api('POST', '/transfers', [
    'fiscal_year_id' => $fiscalYear->id,
    'transfer_date' => $today,
    'from_account_id' => $accountA->id,
    'to_account_id' => $accountB->id,
    'amount' => 10,
]);
check('posting a transfer into the closed year is refused', $intoClosedTransfer['status'] >= 400, 'HTTP ' . $intoClosedTransfer['status']);

// Posting into the *new* year must still work.
$intoNew = api('POST', '/incomes', array_merge($makeIncome('BankWire', 42.00, $accountA->id), [
    'fiscal_year_id' => $nextYear->id,
]));
check('posting into the newly opened year works', $intoNew['status'] === 201, 'HTTP ' . $intoNew['status']);
$newIncomeId = $intoNew['body']['data']['id'] ?? null;

if ($newIncomeId) {
    $before = totalBalance();
    $approved = api('POST', "/incomes/{$newIncomeId}/approve");
    check('approving in the newly opened year credits the account',
        $approved['status'] === 200 && abs((totalBalance() - $before) - 42.00) < 0.005,
        'delta ' . money(totalBalance() - $before));
}

// A draft can outlive a close - the year is flipped by the closing flow and
// by nothing else, but a draft filed against a *future* year, or a year
// deactivated any other way, is left holding money nobody can post. Inserted
// directly because the API (correctly) refuses to create one.
$staleDraftId = DB::table('expenses')->insertGetId([
    'fiscal_year_id' => $fiscalYear->id,
    'budget_id' => $budget->id,
    'expense_category_id' => $expenseCategory->id,
    'expense_date' => $today,
    'amount' => 60.00,
    'payment_method' => 'BankWire',
    'bank_account_id' => $accountA->id,
    'status' => 'Draft',
    'unrelated_to_benef' => true,
    'created_by' => 1,
    'created_at' => now(),
    'updated_at' => now(),
]);

$before = totalBalance();
$staleApprove = api('POST', "/expenses/{$staleDraftId}/approve");
check('approving a draft that belongs to the closed year is refused',
    $staleApprove['status'] >= 400, 'HTTP ' . $staleApprove['status']);
check('the refused late approval moved nothing', abs(totalBalance() - $before) < 0.005);
DB::table('expenses')->where('id', $staleDraftId)->delete();

$staleIncomeId = DB::table('incomes')->insertGetId([
    'fiscal_year_id' => $fiscalYear->id,
    'budget_id' => $budget->id,
    'income_category_id' => $incomeCategory->id,
    'donor_id' => $donor->id,
    'income_date' => $today,
    'amount' => 60.00,
    'payment_method' => 'BankWire',
    'bank_account_id' => $accountA->id,
    'status' => 'Draft',
    'created_by' => 1,
    'created_at' => now(),
    'updated_at' => now(),
]);

$before = totalBalance();
$staleApprove = api('POST', "/incomes/{$staleIncomeId}/approve");
check('approving an income draft in the closed year is refused',
    $staleApprove['status'] >= 400, 'HTTP ' . $staleApprove['status']);
check('the refused late income approval moved nothing', abs(totalBalance() - $before) < 0.005);
DB::table('incomes')->where('id', $staleIncomeId)->delete();

$closeAgain = api('POST', "/fiscal-years/{$fiscalYear->id}/close");
$closeAgainBody = $closeAgain['body'] ?? [];
check('closing an already-closed year is refused',
    $closeAgain['status'] >= 400 || ($closeAgainBody['success'] ?? true) === false,
    'HTTP ' . $closeAgain['status']);

// ---------------------------------------------------------------------------
heading('Reported totals must match the rows behind them');
// ---------------------------------------------------------------------------
$report = api('GET', '/reports/annual?year=' . date('Y'));
if ($report['status'] === 200) {
    $reported = $report['body']['data'] ?? [];
    // Compare against the window the report says it covered, not an assumed
    // calendar year - otherwise a disagreement about the period reads as a
    // disagreement about the money.
    $from = $reported['period']['from'] ?? date('Y') . '-01-01';
    $to = $reported['period']['to'] ?? date('Y') . '-12-31';

    $incomeTotal = (float) DB::table('incomes')
        ->where('status', 'Approved')->whereBetween('income_date', [$from, $to])->sum('amount');
    $expenseTotal = (float) DB::table('expenses')
        ->where('status', 'Approved')->whereBetween('expense_date', [$from, $to])->sum('amount');

    $reportedIncome = (float) ($reported['financial']['totals']['income'] ?? -1);
    $reportedExpense = (float) ($reported['financial']['totals']['expense'] ?? -1);

    check('the annual report income total matches the approved rows',
        abs($reportedIncome - $incomeTotal) < 0.005,
        money($reportedIncome) . ' vs ' . money($incomeTotal));
    check('the annual report expense total matches the approved rows',
        abs($reportedExpense - $expenseTotal) < 0.005,
        money($reportedExpense) . ' vs ' . money($expenseTotal));

    $monthlyIncome = array_sum(array_column($reported['monthly'] ?? [], 'income'));
    check('the monthly series adds up to the annual income total',
        abs($monthlyIncome - $reportedIncome) < 0.005,
        money($monthlyIncome) . ' vs ' . money($reportedIncome));
} else {
    check('the annual report responds', false, 'HTTP ' . $report['status']);
}

// The dashboard and the fiscal-year screen both show "money held"; they have
// to be reading the same number.
$totalHeld = totalBalance();
$carryover = (float) DB::table('fiscal_years')->where('year', $fiscalYear->year)->value('carryover_next_year');
check('the closed year carryover still matches what the accounts hold',
    abs($totalHeld - $carryover - 42.00) < 0.005,
    money($totalHeld) . ' held, ' . money($carryover) . ' carried + 42.00 posted since');

// ---------------------------------------------------------------------------
echo PHP_EOL . str_repeat('=', 74) . PHP_EOL;
echo "  {$passed} passed, " . count($failed) . " failed" . PHP_EOL;

if ($failed) {
    echo PHP_EOL . "  Failures" . PHP_EOL;
    foreach ($failed as $f) {
        echo "  - {$f}" . PHP_EOL;
    }
}

echo PHP_EOL;
exit($failed ? 1 : 0);
