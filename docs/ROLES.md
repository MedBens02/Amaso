# Roles and permissions

Five roles, built around the jobs the association actually has rather than
around the tables the application happens to have.

The staff-facing guides, one per role, are in [`guides/`](guides/README.md)
and are written in Arabic because the people who use the system do.
This page is the design: what each role may do, where that is enforced, and
what to check before deploying it.

---

## 1. The five

| Role | `role` value | Who it is | Holds |
|---|---|---|---|
| مستخدم أعلى | `superuser` | The director, or whoever answers for the system | Everything, plus accounts and the activity log |
| مدير النظام | `admin` | The association's manager | Everything operational |
| محاسب | `accountant` | The treasurer | The books |
| أخصائي اجتماعي | `social_worker` | The caseworker | The families |
| مسؤول التعليم | `education_officer` | The schooling officer | Enrollments, marks, transport |

`education_officer` is new. Until now education and transport were open to
anyone with an account, which meant there was no way to give somebody the
school register without also giving them the association's bank accounts.

Nobody holds the new role until an account is given it. Adding it changes
nothing on its own.

---

## 2. The two rules

**Reading is open to anyone with an account.** An accountant has to be able
to open a family to understand an expense charged to her; a social worker
has to see which fund an aid payment came out of. Blinding people to the
records they work beside does not make the association safer, it makes them
walk to someone else's desk.

**Writing is held to the people whose job it is.** Every gate in the system
is on a write. There is no screen anybody is shut out of.

One consequence worth stating plainly: a role is not a secrecy boundary.
Anyone with an account can read every beneficiary record and every figure
in the books. If the association needs some records hidden from some staff,
that is a different feature and this is not it.

---

## 3. The matrix

Read means index, show, reports, cards and exports. Write means create,
edit and delete.

| Area | Read | Write |
|---|---|---|
| Families, orphans, social file | everyone | `admin` `superuser` `social_worker` |
| Beneficiary groups | everyone | `admin` `superuser` `social_worker` |
| Donors, sponsors, sponsorships | everyone | `admin` `superuser` `accountant` |
| Income | everyone | `admin` `superuser` `accountant` |
| **Expenses — writing one down** | everyone | `admin` `superuser` `accountant` `social_worker` `education_officer` |
| **Expenses — approving one** | — | `admin` `superuser` `accountant` |
| Transfers, and approving them | everyone | `admin` `superuser` `accountant` |
| Bank accounts | everyone | `admin` `superuser` `accountant` |
| Recording a kafala chamila payment | everyone | `admin` `superuser` `accountant` |
| **Closing the fiscal year** | everyone | `admin` `superuser` |
| **Kafala chamila split rules** | everyone | `admin` `superuser` |
| Enrollments, marks, schools, academic years | everyone | `admin` `superuser` `education_officer` `social_worker` |
| Transport riders and month sheets | everyone | `admin` `superuser` `education_officer` `social_worker` |
| **Closing a transport month** | — | `admin` `superuser` `accountant` `education_officer` `social_worker` |
| Reference lists — social file | everyone | `admin` `superuser` `social_worker` |
| Reference lists — accounting, funds, partners | everyone | `admin` `superuser` `accountant` |
| Reference lists — education levels | everyone | `admin` `superuser` `education_officer` `social_worker` |
| The association's own settings | everyone | `admin` `superuser` |
| Accounts, and the activity log | `superuser` | `superuser` |

Five rows are deliberately wider or narrower than the area they sit in:

- **Writing an expense down is wider than approving one.** Whoever hands
  money out writes down that it went — the social worker for a family's
  aid, the education officer for a month's transport. Turning that record
  into money the books count stays with the books: a draft moves no balance
  and appears in no report.
- **The social worker is in the education group.** Before there was an
  education officer, registrations were theirs. Taking that away from an
  association that may not have filled the post yet would break a job
  somebody is doing today.
- **Closing a transport month is everyone who runs the sheet, plus the
  accountant.** Closing freezes the split and links the expense that pays
  for it. It does *not* approve that expense — that still needs the books —
  so the person who runs the month cannot decide the association has paid.

  Settling a month is **two calls**: write the expense, then close the month
  on it. So the expense-writing group and the settlement group must overlap
  on everybody who settles. In the first version of this model they did
  not, and it was caught only by testing the flow rather than each call:
  the education officer could close a month but not write its expense, and
  a social worker could write the expense and then be refused the close,
  leaving an expense attached to no month. Both groups were widened to
  match; `app/Support/Roles.php` says to keep them in step.
- **Closing the fiscal year is narrower than the rest of the books.** The
  accountant gets the year ready; the administration closes it. This is not
  new policy: `FiscalYearController::canCloseFiscalYear()` has required an
  admin all along, answering *"مقتصرة على المديرين فقط"*. The route gate
  now says the same, so the door and the room agree.
- **The kafala chamila split rules are narrower too**, and for the same
  reason: `KafalaChamilaController::requireAdmin()` already held them to the
  administration. Recording a payment under those rules stays with the
  accountant; deciding the rules does not.

---

## 4. Where it is enforced

| | |
|---|---|
| [`backend/app/Support/Roles.php`](../backend/app/Support/Roles.php) | The matrix, in one place. Every gate reads from here. |
| [`backend/routes/api.php`](../backend/routes/api.php) | Where each gate is applied. |
| `EnsureUserHasRole` middleware | What returns the 403. |
| [`frontend/lib/roles.ts`](../frontend/lib/roles.ts) | The same lists, for deciding what to show. |
| `components/dashboard/sidebar.tsx` | Hides menu entries a role cannot use. |

**The frontend is presentation only.** A hidden button stops nobody calling
the endpoint. Every rule above is enforced server-side; the frontend just
keeps doors out of sight that would not open:

- the sidebar hides screens a role cannot use at all;
- `useRoleIn(group)` hides write buttons on screens a role can read but not
  change — adding, editing, archiving or restoring a family, and deciding a
  عدة case, for anyone outside the families group;
- each dashboard's quick actions carry the same role lists, so nobody is
  offered a button that answers 403.

Of the **123 write routes** in the API, the only ones open to any
signed-in account are the five that have to be: logging in, the two-factor
step, logging out, editing your own profile, and changing your own password.
Verified against `php artisan route:list`, not by reading.

Two of those routes are also guarded a second time inside their controller
(`canCloseFiscalYear`, `requireAdmin`). Those checks are older than this
model and are left in place: the route gate and the controller now agree,
and defence in depth costs nothing.

### Checked against a running system

One account per role, against the API with the demo database behind it.
`BLOCKED` is a 403 from the role middleware; `allowed` means the request
got past the gate.

```
                              superuser      admin accountant  soc.worker  edu.officer
  read families (GET widows)    allowed    allowed    allowed    allowed    allowed
  read money   (GET incomes)    allowed    allowed    allowed    allowed    allowed
  write family (POST widows)    allowed    allowed    BLOCKED    allowed    BLOCKED
  write income (POST incomes)   allowed    allowed    allowed    BLOCKED    BLOCKED
  write expense                 allowed    allowed    allowed    allowed    allowed
  approve expense               allowed    allowed    allowed    BLOCKED    BLOCKED
  approve transfer              allowed    allowed    allowed    BLOCKED    BLOCKED
  close fiscal year             allowed    allowed    BLOCKED    BLOCKED    BLOCKED
  edit kafala split rules       allowed    allowed    BLOCKED    BLOCKED    BLOCKED
  write enrollment              allowed    allowed    BLOCKED    allowed    allowed
  write transport rider         allowed    allowed    BLOCKED    allowed    allowed
  close transport month         allowed    allowed    allowed    allowed    allowed
  manage accounts               allowed    BLOCKED    BLOCKED    BLOCKED    BLOCKED
  read audit log                allowed    BLOCKED    BLOCKED    BLOCKED    BLOCKED
```

Both read rows are `allowed` across every role on purpose. That is the
first rule, visible.

And the transport flow end to end — write the expense, then close the month
on it, as each role:

```
                     write expense   close month   result
  superuser                    201           200   settles the month
  admin                        201           200   settles the month
  accountant                   201           200   settles the month
  social_worker                201           200   settles the month
  education_officer            201           200   settles the month
```

Against the first version of the groups the last two rows were
`201 / 403 — orphaned expense` and `403 — cannot start`.

---

## 5. The dashboards

Each role opens the application on its own home screen, built from one
request — `GET /dashboard` — that computes only the sections that role is
shown (`app/Services/DashboardService.php`).

| Role | Leads with | Then | Quick actions |
|---|---|---|---|
| `accountant` | Drafts waiting for approval; cash and cheques not yet banked | Year's income, expense, surplus, cash; the approval queue, oldest first; bank balances; the monthly chart | New income, expense, transfer, donor; financial report |
| `social_worker` | عدة cases that are over and waiting for a decision; ones ending within 30 days | Families, orphans, عدة cases, families with no sponsor; the عدة list; the families nobody is paying for; *their own* expenses still waiting; the latest families; a compact schooling row | New family, record an expense, beneficiary groups, عدة cases |
| `education_officer` | Transport months that ended unsettled; this month not opened; schooled children with no registration | Registered this year, unregistered, transport riders, last year's pass rate; transport months; the unregistered children; registrations by status | Registrations and marks, the month sheet, riders, schools; school report |
| `admin` | Everybody's waiting items at once | One row of figures per department; the chart; the approval queue; sponsorship gaps | One entry into each department, plus settings |
| `superuser` | As admin, plus passwords that are due | As admin, plus account health — who has no second factor, by name — and the latest activity | As admin, plus accounts and the activity log |

The sections are about relevance, not secrecy: reading is open to every
account, so nothing on one role's dashboard is hidden from another. The one
exception is the accounts section, which describes other people's logins
and is computed for the superuser only. There is no `?role=` parameter —
the server decides from the signed-in account, so nobody can ask for
another role's dashboard.

Quick actions land on a screen already doing what the button said:
`?new=1` opens the form, `?status=Draft` arrives with the drafts filtered.
The parameter is removed from the address afterwards, so a refresh does not
open the form twice.

## 6. Before you deploy this

Until now the roles were mostly nominal. Four of them existed, but outside
account management, the activity log, approving income and expenses, bank
accounts, the organisation's settings, and two checks buried in controllers
(closing the fiscal year and editing the kafala chamila splits), every
account could do very nearly everything — write a family, write an income,
approve a transfer, run the school register.

So this release can take access away from somebody who has been using it.

**Check every account's role first**, on إدارة الحسابات, or:

```sql
SELECT id, name, email, role, is_active FROM users;
```

Then:

- Anyone who does more than one of these jobs should be `admin`. That is
  what the role is for, and in an association this size it is a normal
  answer, not a failure of the model.
- Anyone whose account says `social_worker` but who keeps the books should
  be `accountant` or `admin` — they will lose income, transfers and the
  fiscal year otherwise.
- Nobody is `education_officer` yet. Give it to whoever runs the school
  register, if that is a different person from the caseworker.

If somebody is wrongly locked out, the fix is to change their role on
إدارة الحسابات. Nothing is lost and no data is touched.

### The cutover this association is using

Make every account that is not a superuser an **admin** before the new
code goes live, then narrow people to their real roles one at a time, once
they have seen their dashboard. An admin can do everything operational, so
nobody loses a screen on the day, and the superusers stay exactly as they
are.

Run it on the server, as the web user, **before** deploying:

```bash
cd /var/www/amaso/backend
sudo -u amaso php artisan tinker --execute='
  App\Models\User::where("role", "!=", "superuser")->get()
    ->each(fn ($u) => $u->update(["role" => "admin"]));
  App\Models\User::orderBy("role")->get(["name","email","role"])
    ->each(fn ($u) => print(str_pad($u->role, 12)." ".$u->email.PHP_EOL));'
```

Each account is saved through its model rather than with one bulk
`UPDATE`, so the audit log records every role change. Before is better than
after: `admin` exists in the version already running, so changing roles
first leaves no window in which anyone is refused.

---

## 7. Adding or changing a role

`users.role` is a `varchar(30)`, so a new role needs no migration.

1. Add the constant and the `ROLES` entry in
   [`backend/app/Models/User.php`](../backend/app/Models/User.php).
   Validation reads `User::ROLES`, so the account form accepts it at once.
2. Put it in the right group(s) in `backend/app/Support/Roles.php`, or add
   a group. Routes need no editing if an existing group covers it.
3. Add the Arabic label to `ROLE_LABELS` in `frontend/lib/roles.ts`. The
   account form builds its dropdown from that map, so one line is enough.
4. Add it to the matching `ROLE_GROUPS` list in the same file, so the
   sidebar shows the right sections.
5. Write the guide. [`guides/README.md`](guides/README.md) is the index.

Steps 2 and 4 are the same decision written twice, once for the server and
once for the menu. They have to agree: if they drift, the menu offers a
screen whose buttons return 403.

---

[← back to the documentation index](README.md)
