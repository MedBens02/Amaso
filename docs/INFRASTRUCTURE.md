# AMASO — deployment requirements

A specification for whoever provides the server. It says what the system
needs and why, so the sizing can be checked rather than taken on trust.
Nothing here is a how-to: the installation itself is
[`../deploy/README.md`](../deploy/README.md), and the system itself is
described in [`HANDOVER.md`](HANDOVER.md).

---

## 1. What the workload is

A record-keeping system for a Moroccan charitable association
(جمعية المنصور لكفالة اليتيم). It holds the association's beneficiary
register and its books: families, the orphans in them, the sponsors who
fund them, and every dirham in and out.

It is an **internal office system**, not a public service:

| | |
|---|---|
| Concurrent users | Under 10. Realistically 2–5 at once. |
| Usage pattern | Office hours, one city, one time zone. Idle overnight. |
| Traffic | A few thousand requests a day at most. No public traffic. |
| Data volume | ~150 families, ~370 children, a few thousand money entries a year. Grows slowly and predictably. |
| Request shape | Ordinary CRUD and reports. The heaviest operation is generating a PDF or Excel file. |

This is a **small** workload. The sizing below is driven almost entirely by
one build step, not by serving users — see §3.

---

## 2. Shape of the deployment

One virtual machine. Everything runs on it:

```
   browser ─── HTTPS 443 ──▶  nginx  ──┬──▶  static files   (the interface)
                                       └──▶  PHP-FPM → Laravel   (the API)
                                                   │
                                                   ▼
                                               MariaDB
```

No load balancer, no container orchestration, no managed database, no
object store, no CDN, no message queue. For this size those would add cost
and operational surface without buying anything. **Please do not quote for
them.**

The only service outside the machine is outbound email (§6).

---

## 3. Server sizing

| | Minimum | Recommended |
|---|---|---|
| vCPU | 1 | 2 |
| RAM | 2 GB | 4 GB |
| Swap | 2 GB (required if RAM is 2 GB) | 2 GB |
| Disk | 20 GB SSD | 40 GB SSD |
| Architecture | x86-64 or ARM64 — both are fine | either |

**RAM is sized by the deployment step, not by running the system.** Serving
the application needs a few hundred MB. Building the web interface, which
happens on the server during each deployment, was **measured at 1.34 GB
peak resident**. The deploy script refuses to start unless RAM + swap is at
least 2400 MB, and says so rather than letting the build be killed halfway
through. A 1 GB instance with no swap cannot deploy this system.

**Disk** is sized by room to work, not by the data. The database itself is
a few megabytes: the whole demo dataset exports to 212 KB of SQL, and real
data is a few times that. Actual consumers are the operating system, PHP
and JavaScript dependencies, the built interface, thirty nightly backups,
and scanned attachments against family files. 20 GB is comfortable; the
installer requires at least 6 GB free before it begins.

**ARM is genuinely fine.** Nothing in the stack is architecture-specific,
and ARM instances are typically cheaper for the same memory.

---

## 4. Operating system and software

| | |
|---|---|
| OS | **Ubuntu 24.04 LTS** (the install scripts target it) |
| Web server | nginx |
| PHP | 8.2 or newer, with FPM |
| PHP extensions | `fpm`, `mysql`, `mbstring`, `xml`, `curl`, `zip`, `gd`, `bcmath`, `intl` |
| Database | MariaDB 10.6+ (or MySQL 8). Local, on the same machine. |
| Node.js | 20+ — **build-time only**, no Node process runs in production |
| Composer | current |

A plain Ubuntu 24.04 image with SSH access is all that is needed. The
install scripts add everything else. No pre-installed software stack, no
control panel, and no provider-specific agent is required.

---

## 5. Network

### Inbound — must be open

| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | administrator addresses, or any | SSH |
| 80 | TCP | any | HTTP, and the Let's Encrypt challenge |
| 443 | TCP | any | HTTPS — how staff actually use it |

Port 80 must stay open after HTTPS is set up: the certificate renews
through it every 60 days.

> **Two firewalls.** Some provider images (Oracle's and AWS's Ubuntu images
> among them) ship host firewall rules that reject 80 and 443 even once the
> cloud firewall allows them. The install script finds and fixes that, but
> it is the most common cause of "everything installed and nothing loads".

### Outbound — must be reachable

| Destination | Why |
|---|---|
| Ubuntu / Debian package mirrors | installation and security updates |
| `github.com` | fetching the application |
| `getcomposer.org`, `packagist.org`, `repo.packagist.org` | PHP dependencies |
| `deb.nodesource.com`, `registry.npmjs.org` | Node and JavaScript dependencies |
| `acme-v02.api.letsencrypt.org` | TLS certificates |
| SMTP on **587** or **465** to the mail provider | login codes (§6) |

Outbound SMTP matters: some providers block it by default and will not say
so. If it is blocked, **nobody can sign in** — see §6. Please confirm
whether port 587 and 465 outbound are open, and how to have them unblocked
if they are not.

### Addressing

- One **static public IPv4 address**, which must not change when the
  instance is stopped and started. An address that is released on stop will
  silently break the domain.
- A domain name is required for HTTPS. The association holds `amaso.site`.
- IPv6 is welcome but not required.

---

## 6. Email

Signing in is two steps: a password, then a six-digit code sent to the
address on the account. **If the server cannot send email, no one can sign
in.** This is deliberate — a second factor that disappears when mail breaks
was never a second factor — and it makes outbound SMTP a hard dependency
rather than a nice-to-have.

Mail is sent through an ordinary external SMTP account (currently the
association's own mailbox at its domain). No mail server runs on the
machine and none is required. What is required is that the machine can
reach an external SMTP host on port 587 or 465.

Volume is negligible: a handful of messages a day, one per sign-in.

---

## 7. Storage, backup and retention

The database is backed up nightly at 02:30 to compressed SQL on the server,
with the last 30 kept. This is included in the application and needs
nothing from the provider.

**What is wanted from the provider:**

| | |
|---|---|
| Off-machine backup | Object storage, or equivalent, for a copy of the nightly dump. A few GB is ample. Backups on the same disk as the database do not survive losing the machine. |
| Snapshots | A weekly snapshot of the boot volume, so an unbootable machine is a restore rather than a rebuild. |
| Retention | 30 days is sufficient for both. |

The application can push its own backups to S3-compatible object storage.
Credentials that are **write-only to one bucket** are preferred over
general-purpose keys; better still, an instance identity that needs no key
stored on the machine at all.

---

## 8. Data sensitivity and residency

**This system holds personal data about vulnerable people.** Roughly 150
widowed women and 370 orphaned children, by name, with national identity
numbers, dates of birth, home addresses, telephone numbers, health
information and the financial support each family receives.

Consequences for the hosting arrangement:

- **Data residency: Morocco is strongly preferred**, and a region in or
  near Morocco should be offered if one exists. The association is Moroccan,
  the people in the records are Moroccan, and keeping their records in the
  country is the default expectation. Where data will physically reside
  must be stated explicitly.
- **Encryption at rest** on the volume, and encrypted backups.
- **No provider access to the data** beyond what operating the
  infrastructure requires. Please state what access provider staff have and
  under what controls.
- **Deletion on termination** must be confirmed, including from backups and
  snapshots, with a stated timescale.
- Any sub-processors and their locations should be disclosed.

The association is a charity with a small budget; it is not asking for
certified compliance programmes. It is asking to know where the files are
and who can read them.

---

## 9. Availability

Office-hours system. A few hours of downtime is an inconvenience, not an
emergency — no money moves through it in real time and no one depends on it
outside working hours.

- **No high-availability requirement.** A single instance is correct.
- **No formal uptime SLA needed.** Ordinary single-instance availability is
  fine.
- Planned maintenance is welcome at any time outside 08:00–18:00 local.
- What does matter is that the machine and its data can be **recovered**,
  which is §7 rather than redundancy.

---

## 10. Growth

The association serves a fixed city and grows by a handful of families a
year. Ten years of growth at the present rate does not change the sizing in
§3: the database would still be measured in tens of megabytes.

The one thing that grows unbounded is scanned attachments on family files.
If the association begins scanning documents in volume, disk is the only
dimension that needs revisiting, and it can be grown in place.

---

## 11. Summary for a quotation

> One Ubuntu 24.04 LTS virtual machine, 2 vCPU / 4 GB RAM / 40 GB SSD, in or
> as near as possible to Morocco, with a static IPv4 address, inbound 22/80/
> 443, outbound SMTP on 587 and 465, encryption at rest, a weekly boot-volume
> snapshot, and a few GB of object storage for off-machine backups.
> No load balancer, managed database, or container platform.

Minimum workable configuration is 1 vCPU / 2 GB RAM with 2 GB of swap and
20 GB of disk.
