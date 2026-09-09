# Financial Integrity Audit & Fix Plan

**Date:** 2026-07-03
**Scope:** every code path that moves or reports money — income approval, income-to-bank
transfer, expense approval, inter-account transfers, fiscal-year closing, the cash view,
sponsorship budgets and the dashboard/report aggregations.

**Status of the code today:** Phase A is **done** (2026-09-08), plus #5a. What changed:

| # | Issue | Status |
|---|-------|--------|
| 1 | Concurrent approval double-spends | **Fixed** — `lockForUpdate()` + re-check inside the transaction in `IncomeService::approve`, `IncomeService::transferToBank`, `ExpenseService::approve`, `TransferService::approve`. Transfers lock both accounts in sorted id order to avoid deadlocking opposite-direction transfers. |
| 2 | Expense approval: non-atomic write, no funds check | **Fixed** — locks the account, refuses on insufficient funds, uses `decrement()`. |
| 3 | Posting into closed fiscal years | **Fixed** — all four financial form requests now require the fiscal year to be `is_active`. (The *date within the year* half is still open.) |
| 4 | Group split loses cents | **Fixed** — whole-cent division with remainder distribution, so member rows sum to the group amount exactly. (The `sum(beneficiaries) == expense.amount` server rule is still open.) |
| 5a | Closing loses un-deposited cash | **Fixed** — closing is blocked, and `canClose`/`getClosingSummary` report it, while approved Cash/Cheque income has not been transferred to a bank. |
| 9 | Kafil payments vs. sponsorships never reconciled | **Largely addressed** — `incomes.widow_id` designates the family, and `KafalaChamilaService::familyBalances()` derives per-family credited/spent/remaining. See "Per-family kafala coverage" below. |

| 6 | No ledger, balances unverifiable | **Fixed** — `bank_account_transactions` records every balance change (signed amount + `balance_after` + source + who), written by `LedgerService` inside the same transaction as the change. `php artisan finance:reconcile` recomputes each balance from the ledger and each donor total from approved incomes, exits non-zero on drift, and takes `--fix-donor-totals`. |
| 8 | `donors.total_given` never written | **Fixed** — incremented on income approval; `finance:reconcile --fix-donor-totals` recomputes and backfills. |
| 10 | Validation gaps | **Fixed** — an income must have exactly one of donor/kafil; beneficiary amounts must sum to the expense amount (server and form); the duplicate `POST incomes/{id}/transfer` endpoint and its service method are gone, leaving `transfer-to-bank`. |

Still open, in priority order: **#7** (client-side dashboard aggregates capped at 1,000
rows), **#5b** (real cash-box account), **#6.3** (void/unapprove writing reversal entries —
now cheap to add on top of the ledger), and the two partial items noted above (transaction
date within the fiscal year; group-with-all-members-excluded).

**Reconciliation is only as old as the ledger.** Rows written before it existed have no
history, so `finance:reconcile` infers each account's opening balance from its earliest
ledger row. It verifies everything from that point on; it cannot vouch for balances as they
stood before. Worth running after each deploy and on a schedule.

---

## Per-family kafala coverage (added 2026-09-08)

The kafala chamila pools are shared across all kafils, which raised a fair objection: a kafil
paying 1,600/month for families A and B should not silently fund family C, whose kafil has not
paid. This is now visible without breaking the pooling model:

- **Nothing is siloed.** There is no per-family wallet, no second ledger, no new table. The
  seven kafala chamila budgets remain the only record of the money.
- **The balance is derived**, per family and per part: approved income designated to that
  family (`incomes.widow_id`) minus approved expenses attributed to that family — the widow or
  any of her orphans — out of the same budget.
- **Designation is now required** when the kafil sponsors families, and must be one of *their*
  families, so a payment can no longer land in the pools unattributed.
- **Spending beyond a family's share is warned about, never blocked.** The expense form shows
  the pool balance and the family's balance side by side and, when the allocation exceeds what
  the family brought in, says plainly that the difference comes out of the pool other kafils
  funded. Topping a family up from the pool is a legitimate act; it just should not be an
  invisible one.

Gap found and fixed while building this: the seeder created an income category per part but no
**expense** category, so the pools could take money in and never pay anything out.

---

## Budgets separated from categories (added 2026-09-09)

`sub_budgets` was doing two unrelated jobs: it was the fund a transaction's money belonged to,
*and* the bucket every income/expense category was filed under. Because categories were owned by
a sub-budget, the transaction forms could only offer categories belonging to the chosen fund —
so a perfectly ordinary pairing (spend from the health fund, classify it as school fees) was
structurally impossible, and the kafala chamila pools were unspendable until a matching set of
categories was created under each of them.

The two notions are now separate, which is the standard fund-accounting split:

- **Budget** (`budgets`, renamed from `sub_budgets`) — *where the money is*. Every income and
  expense names exactly one. `budgets.is_default` marks the one the forms preselect
  (`الميزانية العامة`); users can add their own. A kafala chamila budget can never be made the
  default, since those are fed by the split rules alone.
- **Category** (`income_categories` / `expense_categories`) — *what the money was for*. No budget
  link at all; a `parent_id` lets categories nest one level for grouping. Any category can be
  paired with any budget.

What this deliberately does **not** change:

- The per-family kafala balance keys entirely on `budget_id`, never on categories, so the
  derived balances and the overspend warning are unaffected.
- The kafil statement still reports contributions by budget and *received* by category — both
  survive because both concepts still exist, just separately.
- The seven kafala chamila budgets stay locked against edit and delete.

The migration renames the table and the `sub_budget_id` columns in place and drops the
category→budget foreign key, so existing rows keep their fund assignment exactly as booked.

---

## How money currently flows

```
Income (Draft) ──approve──▶ Approved ──┬─ BankWire: bank_accounts.balance += amount (at approve)
                                       └─ Cash/Cheque: nothing happens until
                                          "transfer to bank" ▶ balance += amount, transferred_at set

Expense (Draft) ──approve──▶ Approved ── if bank_account_id: balance -= amount
                                         if Cash (no account): nothing is deducted anywhere

Transfer (Draft) ──approve──▶ from.balance -= amount, to.balance += amount (with funds check)

v_current_cash = SUM(bank_accounts.balance)          ← "current cash" is really "total bank balances"

Fiscal-year close: carryover_next = v_current_cash, next year opened with carryover_prev
```

---

## Findings

Ordered by severity. Each has a concrete failure scenario.

### 1. Concurrent approval double-spends (HIGH)

`ExpenseService::approve()`, `IncomeService::approve()`, `IncomeService::transferToBank()`
and `TransferService::approve()` all check the status **without locking the row**. Two
simultaneous requests both see `status = Draft` (or `transferred_at = null`), both pass the
guard, and both apply the balance change.

*Failure scenario:* two browser tabs (or a double-click that fires twice) approve expense
#12 for 5,000 DH at the same moment → the bank balance drops by 10,000 DH while one
expense record exists.

*Fix:* inside the `DB::transaction`, re-fetch the row with `lockForUpdate()` and re-check
the status before mutating anything:

```php
return DB::transaction(function () use ($expense) {
    $expense = Expense::whereKey($expense->id)->lockForUpdate()->firstOrFail();
    if ($expense->status === 'Approved') {
        throw new BusinessRuleException('المصروف معتمد مسبقاً', 400);
    }
    // ... proceed
});
```

Effort: **S** (same pattern in 4 methods). This is the single most important fix.

### 2. Expense approval: non-atomic balance write, no funds check (HIGH)

`ExpenseService::approve()` does a read-modify-write:

```php
$expense->bankAccount->update(['balance' => $expense->bankAccount->balance - $expense->amount]);
```

- Not atomic: interleaved with any other balance change it silently loses one of the two
  updates (incomes and transfers correctly use `increment()`/`decrement()`; expenses do not).
- No sufficient-funds check: a bank account can silently go negative
  (transfers *do* check funds — expenses don't, inconsistently).

*Fix:* lock the account row, check funds, use `decrement()`:

```php
$account = BankAccount::whereKey($expense->bank_account_id)->lockForUpdate()->firstOrFail();
if ($account->balance < $expense->amount) {
    throw new BusinessRuleException('الرصيد في الحساب غير كافي لاعتماد المصروف', 422);
}
$account->decrement('balance', $expense->amount);
```

Decide with the association whether a negative balance should be a hard block or a
confirm-with-warning (the sponsorship over-pledge flow already uses the warning pattern).
Effort: **S**.

### 3. Posting into closed fiscal years is allowed (HIGH)

Nothing prevents creating **and approving** an income/expense/transfer whose
`fiscal_year_id` points to a closed (inactive) year. The carryover chain written at closing
time (`carryover_next_year` → next year's `carryover_prev_year`) is never recomputed, so
back-posting silently falsifies every subsequent year's opening balance. There is also no
check that `income_date` / `expense_date` actually falls inside the chosen fiscal year.

*Failure scenario:* user picks "2024" in the form in 2026, saves and approves a 3,000 DH
expense → 2024's reported totals change but its closing carryover (already copied into
2025) doesn't → books no longer add up.

*Fix:*
- Form request rule: the referenced fiscal year must be active
  (`Rule::exists('fiscal_years', 'id')->where('is_active', true)`), and the transaction
  date must fall within that year.
- Same guard re-checked in the approve services (data may predate the rule).

Effort: **S–M** (touches 3 form requests + 3 services; needs a decision about legitimate
late entries — e.g. allow admins to post into the active year only, which is what the
current UI intends anyway).

### 4. Group expense split loses/creates cents (MEDIUM)

`ExpenseService::syncBeneficiaries()` divides with floats: `amount / count`.
100 DH across 3 members stores 33.33 + 33.33 + 33.33 = 99.99 — the per-beneficiary rows
no longer sum to the expense amount, so any per-beneficiary report drifts from the
financial report.

*Fix:* integer-cent division with remainder distribution:

```php
$cents = (int) round($groupAmount * 100);
$base = intdiv($cents, $count);
$remainder = $cents % $count;   // first $remainder members get one extra cent
```

Also add a server-side rule that `sum(beneficiary amounts) + sum(group amounts) == expense.amount`
— today only the frontend enforces coherence. Effort: **S**.

### 5. The cash box is invisible (MEDIUM — model decision needed)

`v_current_cash` is `SUM(bank_accounts.balance)`, but:

- Approved **Cash incomes** that were never "transferred to bank" exist in no balance at all.
- **Cash expenses** (no bank account) never deduct from anything.
- Fiscal-year closing uses `v_current_cash` as the carryover, so any un-deposited cash at
  year end simply vanishes from the books. `getUntransferredIncomes()` exists to surface
  them, but `canClose` does **not** require the list to be empty.

*Fix options:*
- **(a) Minimal:** block closing while approved, untransferred Cash/Cheque incomes exist
  (add the count to `FiscalYearClosingService::getClosingSummary()` / `canClose`), and
  accept that cash expenses are always paid out of a bank withdrawal. Effort: **S**.
- **(b) Proper:** introduce a "cash on hand" account (either a flagged row in
  `bank_accounts` or a small `cash_box` table). Cash income approve → cash += amount;
  cash expense approve → cash -= amount (with funds check); "transfer to bank" becomes a
  cash→bank movement; `v_current_cash` = bank + cash. Effort: **M**, touches the frontend
  labels too.

Recommendation: do (a) now, schedule (b).

### 6. No ledger, no reconciliation — balances are unverifiable (MEDIUM, structural)

`bank_accounts.balance` is mutated in place by three different flows and there is no
transaction history. If a balance is ever wrong (see #1/#2) there is no way to know when
or why. `approved_by`/`created_by` are always `1` (no auth yet), so even the who is lost.

*Fix (incremental):*
1. `bank_account_transactions` ledger table: `account_id`, polymorphic `source`
   (income/expense/transfer), signed `amount`, `balance_after`, `created_by`, timestamp.
   Written in the same DB transaction as every balance change.
2. `php artisan finance:reconcile` command: recompute each account's expected balance from
   the ledger (and, independently, from the domain tables) and diff against the stored
   balance. Run it after deploying the fixes and monthly thereafter.
3. Later (needs auth + roles): an "unapprove/void" flow that writes reversal entries
   instead of forbidding corrections entirely — today a wrong approval can only be fixed
   by editing the database by hand.

Effort: **M** for 1+2, **M** for 3 (blocked on auth).

### 7. Dashboard aggregates are computed client-side and capped at 1,000 rows (MEDIUM)

`frontend/app/dashboard/page.tsx` and `monthly-charts.tsx` fetch up to
`per_page=1000` rows per month (14 parallel requests) and sum with `parseFloat` in the
browser. Past 1,000 records/month the totals are silently wrong; the CSV export toolbars
have the same 1,000-row cap.

*Fix:* one `GET /api/v1/dashboard/stats?months=6` endpoint doing `GROUP BY` month in SQL
(counts, sums, previous-month deltas) + raise/paginate the export fetches. Effort: **S–M**,
and it makes the dashboard load ~10× fewer requests.

### 8. `donors.total_given` is never maintained (LOW)

The column exists, is fillable, and is displayed by the frontend/PDF cards — but no code
ever writes it. It is always 0.00 (or whatever was imported).

*Fix:* increment it in `IncomeService::approve()` when `donor_id` is set (and in the future
unapprove flow, decrement), plus a one-off backfill command. Alternatively drop the column
and compute on read. Effort: **S**.

### 9. Sponsorship totals vs. actual payments are never reconciled (LOW, feature gap)

`KafilService::createSponsorship()` only **warns** when allocations exceed the monthly
pledge (matches the UI design, contradicts the README's "prevents over-allocation").
Separately, nothing links kafil incomes to their sponsorships, so there is no view of
"pledged 500/month, actually paid 300 in June". This is a reporting feature more than a
bug — worth building once the ledger (#6) exists. Effort: **M**.

### 10. Small validation gaps (LOW)

- An income can reference **both** a donor and a kafil (or neither) — source is ambiguous.
- Beneficiary rows with `amount: 0` are accepted.
- A group where *all* members are excluded is silently skipped (expense ends up with no
  beneficiary rows even though `unrelated_to_benef = false`).
- Two endpoints do the same income-to-bank deposit (`POST incomes/{id}/transfer-to-bank`
  via `IncomeService`, and `POST incomes/{id}/transfer` via `FiscalYearClosingService::transferIncomeToBank()`)
  with slightly different rules — consolidate on the `IncomeService` one and delete the other.

Effort: **S** each.

---

## Proposed fix order

| Phase | Items | Size | Prerequisite |
|-------|-------|------|--------------|
| **A — stop the bleeding** | #1 row locks on approve, #2 atomic decrement + funds check, #3 closed-year guard, #4 cent-safe split + sum validation | ~1 day | none |
| **B — trustworthy numbers** | #5a closing guard for untransferred cash, #7 dashboard stats endpoint, #8 total_given, #10 consolidation + validations | ~1–2 days | none |
| **C — auditability** | #6 ledger table + `finance:reconcile`, #9 pledge-vs-paid report | ~2–3 days | none (better after auth) |
| **D — structural** | #5b real cash-box account, #6.3 void/unapprove flow | ~2–3 days | auth + roles |

Phase A changes are all small, isolated edits in `app/Services/` and the three financial
form requests — they can be tested by hitting the endpoints concurrently (two parallel
`curl` approves) before/after.

**A note on tests:** tests are explicitly out of scope right now, but when they come,
Phase A items are exactly the ones to cover first (double-approve, insufficient funds,
closed-year posting, split rounding). The migrations added in this branch make that
possible: the suite can now run on SQLite in-memory.
