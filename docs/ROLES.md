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
| **Expenses — writing one down** | everyone | `admin` `superuser` `accountant` `social_worker` |
| **Expenses — approving one** | — | `admin` `superuser` `accountant` |
| Transfers, and approving them | everyone | `admin` `superuser` `accountant` |
| Bank accounts | everyone | `admin` `superuser` `accountant` |
| Recording a kafala chamila payment | everyone | `admin` `superuser` `accountant` |
| **Closing the fiscal year** | everyone | `admin` `superuser` |
| **Kafala chamila split rules** | everyone | `admin` `superuser` |
| Enrollments, marks, schools, academic years | everyone | `admin` `superuser` `education_officer` `social_worker` |
| Transport riders and month sheets | everyone | `admin` `superuser` `education_officer` `social_worker` |
| **Closing a transport month** | — | `admin` `superuser` `accountant` `education_officer` |
| Reference lists — social file | everyone | `admin` `superuser` `social_worker` |
| Reference lists — accounting, funds, partners | everyone | `admin` `superuser` `accountant` |
| Reference lists — education levels | everyone | `admin` `superuser` `education_officer` `social_worker` |
| The association's own settings | everyone | `admin` `superuser` |
| Accounts, and the activity log | `superuser` | `superuser` |

Five rows are deliberately wider or narrower than the area they sit in:

- **Writing an expense down is wider than approving one.** The social
  worker who handed out the aid is the person who knows it went out.
  Turning that record into money the books count stays with the books.
- **The social worker is in the education group.** Before there was an
  education officer, registrations were theirs. Taking that away from an
  association that may not have filled the post yet would break a job
  somebody is doing today.
- **Closing a transport month includes the accountant.** Closing freezes
  the split and links the expense that pays for it. It does *not* approve
  that expense — that still needs the books — so the person who runs the
  month cannot decide the association has paid for it.
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
the endpoint. Every rule above is enforced server-side; the sidebar just
keeps doors out of the menu that would not open.

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
  write expense                 allowed    allowed    allowed    allowed    BLOCKED
  approve expense               allowed    allowed    allowed    BLOCKED    BLOCKED
  approve transfer              allowed    allowed    allowed    BLOCKED    BLOCKED
  close fiscal year             allowed    allowed    BLOCKED    BLOCKED    BLOCKED
  edit kafala split rules       allowed    allowed    BLOCKED    BLOCKED    BLOCKED
  write enrollment              allowed    allowed    BLOCKED    allowed    allowed
  write transport rider         allowed    allowed    BLOCKED    allowed    allowed
  close transport month         allowed    allowed    allowed    BLOCKED    allowed
  manage accounts               allowed    BLOCKED    BLOCKED    BLOCKED    BLOCKED
  read audit log                allowed    BLOCKED    BLOCKED    BLOCKED    BLOCKED
```

Both read rows are `allowed` across every role on purpose. That is the
first rule, visible.

---

## 5. Before you deploy this

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

---

## 6. Adding or changing a role

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
