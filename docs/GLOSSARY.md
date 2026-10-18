# Glossary

The application is written in Arabic, for Moroccan users, about a domain
that has no clean English equivalent. The code is in English; the screens,
the seeded reference data and the business vocabulary are not. This is the
bridge between them.

Everything below was read out of the code, not translated from the outside.
Where a term has an exact home in the codebase, it is named.

---

## 1. The people

| Arabic | Transliteration | In the code | What it is |
|---|---|---|---|
| أرملة | *armala* | `Widow`, `widows` | A widow. In this system she is the **head of a beneficiary family**, not merely a person — almost every record hangs off her. |
| يتيم / أيتام | *yatim / aytam* | `Orphan`, `orphans` | A fatherless child. In Moroccan usage — and in this application — a child who has lost their father is يتيم even while the mother is alive. Do not read it as "parentless". |
| كفيل | *kafil* | `Kafil`, `kafils` | A sponsor: a person who commits to fund a family, usually monthly. |
| متبرع | *mutabarri'* | `Donor`, `donors` | A donor. Every kafil has a donor record behind them; not every donor is a kafil. |
| شريك | *sharik* | `Partner`, `partners` | A partner organisation that funds or runs part of the work. |
| مستفيد | *mustafid* | `Beneficiary` | Beneficiary — the umbrella term over widows and orphans, used where an expense can be charged to either. |

### Roles (`User::ROLES`)

| Arabic | Key | Scope |
|---|---|---|
| مستخدم أعلى | `superuser` | Everything, including account management and the audit log. |
| مدير النظام | `admin` | Everything operational; no user administration. |
| محاسب | `accountant` | The money side. |
| أخصائي اجتماعي | `social_worker` | Families, children, education, social file. |

---

## 2. عدة and "new orphanhood"

| Arabic | Transliteration | In the code |
|---|---|---|
| عدة | *idda* | `widows.is_idda_case`, `widows.idda_end_date`, `Widow::IDDA_*` |
| حالة يتيم جديد | *hala yatim jadid* | the UI name for the same thing |

**عدة** is the Islamic waiting period a widow observes after her husband's
death — four months and ten days. The association supports a family through
it before deciding whether to take them on permanently.

This matters to the code more than it looks:

- A woman in عدة is **supported but not yet one of the families.** Counting
  her inflates every figure the association reports. `Widow` carries an
  explicit scope for "our families" and it excludes her; see the comment on
  `Widow::IDDA_NONE`.
- The three states are `active` (still in عدة), `ended` (the period ran out,
  nobody has decided yet) and `none` (an ordinary family — whether or not
  she ever was a عدة case).
- The screens call these **حالات يتيم جديد** — "new orphanhood cases" —
  because that is how the association speaks of them. Same thing.
- `admission_date` can never precede `husband_death_date`: the case is
  *dated from* the death. Enforced in `StoreWidowRequest` and
  `UpdateWidowRequest`.

---

## 3. Sponsorship

| Arabic | Transliteration | In the code | What it is |
|---|---|---|---|
| كفالة | *kafala* | `KafilSponsorship`, `kafil_sponsorship` | One sponsor funding one family, at a monthly amount. |
| كفالة شاملة | *kafala chamila* | `KafalaChamilaSplit`, `KafalaChamilaService` | **Comprehensive sponsorship** — see below. |
| تعهد شهري | *ta'ahhud shahri* | `kafils.monthly_pledge` | What a kafil has pledged per month, against which their actual giving is measured (`remaining_pledge_amount`, `sponsorship_utilization`). |
| مؤونة | *maouna* | `WidowMaouna`, `widow_maouna` | Provision — recurring material support for a family, typically from a partner organisation. Also one of the kafala chamila parts. |

### Kafala chamila, in detail

A **كفالة شاملة** payment is not one donation. It is a single sum the
association splits across fixed purposes, each landing in its own locked
sub-budget so reporting can answer "how much of sponsorship money went to
health". One payment, several income rows, tied together by
`incomes.kafala_batch_id`.

The seeded parts and their default percentages (`KafalaChamilaSeeder`):

| Key | Arabic | % |
|---|---|---|
| `management` | تسيير | 10 |
| `maouna` | مؤونة | 50 |
| `education` | تعليم | 20 |
| `health` | صحة | 4 |
| `activities` | تربية وترفيه | 5 |
| `projects` | مشاريع | 6 |
| `formation` | تكوين | 5 |

Each gets a budget named `كفالة شاملة - <label>`. The percentages are
defaults the association can change; the seeder only fills in what is
missing and never resets an administrator's edits.

---

## 4. Money

| Arabic | In the code | Note |
|---|---|---|
| إيرادات | `Income`, `incomes` | Income. |
| مصروفات | `Expense`, `expenses` | Expenses. |
| ميزانية | `Budget`, `budgets` | A **fund**, not a forecast. Money is held and reported per fund. |
| الميزانية العامة | `AccountingSeeder::GENERAL_BUDGET_ID` (7) | The default fund. Anything not tied to a specific one is booked here, so nothing is ever budget-less. |
| سنة مالية | `FiscalYear` | Fiscal year. One is active; closing it is a service operation, not an update. |
| تحويل | `Transfer` | A transfer between bank accounts. |
| المشاريع الممولة | budgeted projects | Funded projects with their own allocations. |
| زكاة / صدقات | seeded income categories | Zakat and voluntary alms — distinct categories because they are distinct obligations and cannot be spent interchangeably. |

### Seeded funds (`AccountingSeeder`)

| id | Arabic | English |
|---|---|---|
| 1 | الرعاية الصحية | Healthcare |
| 2 | التعليم والتدريب | Education and training |
| 3 | النقل والمواصلات | Transport |
| 4 | الإدارة العامة | General administration |
| 5 | المساعدات الاجتماعية | Social assistance |
| 6 | البرامج والفعاليات | Programmes and events |
| 7 | الميزانية العامة | **General fund (default)** |
| 8 | كفالة شاملة | Comprehensive sponsorship |

Budget and category ids are **pinned** in the seeder because existing rows
reference them, and because id `999` — `Deleted Category (Default)` — is a
sentinel that records of deleted categories fall back to. Do not renumber
them.

---

## 5. Education

| Arabic | In the code | What it is |
|---|---|---|
| تسجيل | `OrphanEnrollment` | An enrollment: one child, one academic year, one level. |
| السنة الدراسية | `AcademicYear` | Academic year (distinct from the fiscal year). |
| المستوى التعليمي | `OrphansEducationLevel` | Education level. |
| المؤسسة التعليمية | `School` | School (`type = school`) or university (`type = university`). |
| الأسدس الأول / الأسدس الثاني | `EducationLevelGradeComponent::DEFAULT_SCHEME` | First and second semester, 50 % each. The Moroccan term is أسدس, not فصل. |
| النقطة | `EnrollmentGrade` | A grade. Each level defines its own weighted components; the year's result is the weighted sum. |

Enrollment status: `enrolled` (مسجل), `passed` (ناجح), `failed` (راسب),
`left` (غادر).

Higher-education phases (`OrphanEnrollment::HIGHER_EDUCATION_PHASES`), with
their nominal durations:

| Key | Arabic | Years |
|---|---|---|
| `preparatory` | أقسام تحضيرية | 2 |
| `technician` | تقني متخصص | 2 |
| `licence` | إجازة | 3 |
| `master` | ماستر | 2 |
| `doctorate` | دكتوراه | 3 |
| `other` | تكوين آخر | 2 |

---

## 6. School transport

Transport is its own small subsystem with its own month-end cycle, and its
vocabulary is easy to mix up because *bus* and *allowance* appear as both a
rider's mode and a month's settlement part.

| Arabic | In the code | What it is |
|---|---|---|
| النقل المدرسي | `TransportMonth`, `TransportSupport` | School transport. |
| حافلة المنصور | `TransportSupport::MODE_BUS` | The association's own bus. The child rides; the association pays the running cost. |
| منحة تنقل | `TransportSupport::MODE_ALLOWANCE` | A cash travel allowance instead, at `allowance_rate` — **per attendance, not per month** (قيمة المنحة عن كل حضور). |
| كلفة الحافلة | `TransportMonth::PART_BUS` | The bus **cost side** of a month: fuel + driver + other, as one pot. |
| منح التنقل | `TransportMonth::PART_ALLOWANCE` | The allowance **payout side** of the same month. |
| حضور | `transport_month_lines.attendances` | Attendances — how many times the child actually travelled that month. The unit both sides are computed from. |

The two sides are computed differently, and this is the part most often
got wrong:

- **Bus**: the month's pot (`bus_pot`) is divided **pro rata across the
  bus riders by attendance count**. A rider with zero attendances gets
  zero — they did not use the bus.
- **Allowance**: `rate × attendances`, line by line. Nothing is pooled.

`TransportSettlementService::recalculate()` orders lines by `id`
deliberately: the leftover centimes from flooring go to whichever shares
lost most, and the preview on screen has to land on the same answer as the
settlement.

A rider's support status (`TransportSupport::STATUSES`):

| Key | Arabic |
|---|---|
| `active` | جاري |
| `suspended` | موقوف مؤقتاً |
| `ended` | منتهٍ |

A month's settlement status (`TransportMonth::STATUSES`) — the two parts
settle independently, which is why there is a middle state:

| Key | Arabic | Meaning |
|---|---|---|
| `draft` | مسودة | Neither part posted. |
| `partial` | مُرحَّل جزئياً | One part posted, the other not. |
| `closed` | مُرحَّل | Both posted to the ledger. |

Months are named in **Moroccan Arabic**, which differs from Levantine/Gulf
usage for several of them — `TransportMonth` carries the list: يناير،
فبراير، مارس، أبريل، ماي، يونيو، يوليوز، غشت، شتنبر، أكتوبر، نونبر، دجنبر.
Note ماي / يوليوز / غشت / شتنبر / نونبر / دجنبر in particular.

---

## 7. The social file

The *dossier social* — what the association knows about a family's
circumstances. Held across `WidowSocial`, `WidowSocialIncome`,
`WidowSocialExpense`, and the reference tables.

| Arabic | In the code |
|---|---|
| الوضعية الاجتماعية | `WidowSocial` |
| مداخيل الأسرة | `WidowSocialIncome` |
| مصاريف الأسرة | `WidowSocialExpense` |
| نوع السكن | `HousingType` |
| الحي | `Neighborhood` |
| القطاع | `Sector` |
| المهارات | `Skill` — e.g. خياطة، طبخ، تنظيف، تدريس، أشغال يدوية، حياكة، تطريز، حلاقة نسائية، ماكياج، حاسوب |
| الأمراض | `Illness` |
| نوع المساعدة | `AidType` — e.g. مساعدة شهرية، مساعدة طبية، مساعدة تعليمية، مساعدة طارئة |

`social_situation` on a widow is one of `single`, `widow`, `divorced`,
`remarried` — stored in English, displayed in Arabic.

---

## 8. Screens

The sidebar, in order, so an Arabic screenshot can be matched to a route.

| Arabic | Route |
|---|---|
| الرئيسية | `/dashboard` |
| **المستفيدون** | |
| الأرامل | `/dashboard/widows` |
| الأيتام | `/dashboard/orphans` |
| مجموعات المستفيدين | `/dashboard/beneficiary-groups` |
| **المالية** | |
| المتبرعون | `/dashboard/donors` |
| الإيرادات | `/dashboard/incomes` |
| المصروفات | `/dashboard/expenses` |
| المشاريع الممولة | `/dashboard/budgeted-projects` |
| التحويلات | `/dashboard/transfers` |
| السنوات المالية | `/dashboard/fiscal-years` |
| **التعليم** | |
| التسجيلات | `/dashboard/education` |
| النقل المدرسي | `/dashboard/education/transport` |
| مستفيدو النقل | `/dashboard/education/transport/riders` |
| المؤسسات التعليمية | `/dashboard/education/schools` |
| السنوات الدراسية | `/dashboard/education/years` |
| المستويات التعليمية | `/dashboard/education/levels` |
| **البيانات المرجعية** | |
| المراجع العامة | `/dashboard/references` |
| المراجع المحاسبية | `/dashboard/accounting-references` |
| **النظام** | |
| التقارير | `/dashboard/reports` |
| الإعدادات | `/dashboard/settings` |
| إدارة الحسابات | `/dashboard/users` *(superuser)* |
| سجل النشاط | `/dashboard/audit-log` *(superuser)* |

---

## 9. Writing Arabic in this codebase

- The UI is **RTL throughout** (`dir="rtl"`). Anything that assumes
  left-to-right — icon sides, chevrons, table alignment, drawer direction —
  has to be checked in the browser, not reasoned about.
- **Numbers and dates render LTR inside RTL text.** Where a number must not
  be re-ordered by the bidi algorithm, the markup says so explicitly; the
  2FA code block is `dir="ltr"` for exactly this reason.
- Arabic in a **MIME email subject is encoded**, so it will not match a
  plain `grep` of a mail log. Search the body.
- Arabic in a **`grep -P` character class** will raise *"character code
  point value in \x{} is too large"*. Use a plain pattern, `grep -F`, or
  read the file from Python.
- The association's own name is **جمعية المنصور لكفالة اليتيم** — it is the
  mail `From` name, and it is not `${APP_NAME}`.

---

[← back to the handover](HANDOVER.md)
