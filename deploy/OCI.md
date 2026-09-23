# AMASO on Oracle Cloud — Casablanca

Putting the system on Oracle's Morocco region, so the association's records
are held in Morocco and reachable from anywhere.

Oracle opened `af-casablanca-1` in 2026. It is the first full public cloud
region in North Africa, which is the reason to use it here: 142 families'
names, national ID numbers and phone numbers stay inside the country rather
than sitting in Frankfurt or Virginia.

Everything below uses the scripts already in this folder. Oracle's part is
creating a machine and opening two ports; `bootstrap.sh` does the rest.

---

## What you end up with

```
   browser ──── 443 ────▶  ┌─────────────────────────────────┐
                           │  one VM in af-casablanca-1      │
                           │                                 │
                           │   nginx  → frontend/out         │  static files
                           │   nginx  → PHP-FPM → Laravel    │  the API
                           │   MariaDB                       │  the records
                           └───────────────┬─────────────────┘
                                           │ nightly 02:30
                                           ▼
                           ┌─────────────────────────────────┐
                           │  Object Storage bucket          │  the backups,
                           │  (free, 20 GB)                  │  off the machine
                           └─────────────────────────────────┘
```

One machine, not a fleet. For 142 families and 361 orphans that is not a
compromise — it is the right size, and every part of it is something one
person can understand and repair. The database is on the same box on
purpose: the whole thing is a few megabytes, and a managed database would
add cost, a network hop and another thing to hold credentials for.

The one thing that must **not** live on that box is the backups, and §7
puts them somewhere else.

---

## 0. Check your home region first — this decides everything

When you created the Oracle account you picked a **home region**. It cannot
be changed afterwards, and Oracle's permanently free resources exist *only
there*. Everything about the plan below turns on whether you picked Morocco.

Sign in to the console. The region name is in the top bar, and
**Governance & Administration → Tenancy details** shows the home region
explicitly.

**If your home region is Morocco West (Casablanca)** — ideal. You can run
this permanently free, in Morocco. Go to §1 and take the Always Free path.

**If it is anywhere else** — you have three honest options:

| | |
|---|---|
| Run in Casablanca and pay for it | ~$15/month (§8). Records stay in Morocco. The trial credits cover the first month. |
| Use the free tier where your home region is | Free forever, but the families' records leave Morocco. For this data I would not. |
| Start a second account with Casablanca as its home region | Free and in Morocco, but Oracle permits one free tier per person and may flag a duplicate. Their call, not mine — but do not build on it and then find out. |

---

## 1. Create the machine

Console → **Compute → Instances → Create instance**.

**Name** `amaso`

**Placement** Casablanca has a single availability domain, so there is
nothing to choose — and nothing to fall back to if it is short of capacity.
Worth knowing before you hit Create.

**Image** Change image → **Canonical Ubuntu 24.04**. The scripts are
written for it. On the Always Free path make sure you pick the **aarch64**
build, which the console selects automatically once the shape is ARM.

**Shape** Change shape:

- *Always Free path*: **Ampere → VM.Standard.A1.Flex**, set **2 OCPU** and
  **12 GB** memory. That is the whole of the free ARM allowance (Oracle
  halved it from 4/24 in June 2026), and it is far more than this needs.
- *Paid path*: **Ampere → VM.Standard.A1.Flex** at **1 OCPU / 6 GB**, about
  $15/month. Ample. Choose AMD **VM.Standard.E5.Flex** only if something
  you add later needs x86 — nothing in AMASO does.

Do **not** take `VM.Standard.E2.1.Micro`. It is free, but it has 1 GB of
RAM and the frontend build peaks near 1.4 GB; it will grind through swap
for half an hour on every deploy.

**Boot volume** Raise it to **100 GB**. The free allowance is 200 GB in
total and the default 46.6 GB leaves little room for backups and logs.

**SSH keys** Paste your public key, or let the console generate one and
**save the private key before leaving the page** — it is shown once.

**Networking** Let it create a new VCN and subnet, and make sure
**Assign a public IPv4 address** is ticked.

Create it, and note the public IP.

> **"Out of host capacity"** is common for free ARM shapes and it means what
> it says — Oracle has none free right now. Casablanca has one availability
> domain, so the usual trick of trying another one does not apply here.
> Either retry over the next day or two, or take the paid 1 OCPU shape,
> which is not subject to the free-tier scramble.

---

## 2. Open ports 80 and 443

There are **two** firewalls between the internet and nginx, and both are
closed. Missing the second one is the single most common way an Oracle
deployment ends with everything installed and nothing loading.

**The cloud firewall.** Networking → Virtual Cloud Networks → your VCN →
the public subnet → its **Security List** → **Add Ingress Rules**:

| Source CIDR | Protocol | Destination port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

Leave the existing SSH rule alone.

**The firewall on the machine.** Oracle's Ubuntu image ships an iptables
rule that rejects everything except SSH, regardless of what the security
list says. `provision.sh` finds that rule and opens 80 and 443 above it,
then saves the result so it survives a reboot — so you do not have to do
anything here, but if you are ever debugging this by hand, that is the
rule you are looking for:

```bash
sudo iptables -L INPUT --line-numbers -n
```

If you can see packets arriving with `sudo tcpdump -i any port 80` but
nothing answers, it is the machine's firewall. If nothing arrives at all,
it is the security list.

---

## 3. Keep the IP, and point the domain at it

**Reserve the address.** Networking → **Reserved public IPs**, or from the
instance's VNIC: edit the public IP and change it from *Ephemeral* to
*Reserved*. An ephemeral IP is released if the instance is ever stopped
and recreated, and the domain would quietly point at nothing.

**DNS.** At whoever holds the domain, create an `A` record pointing at that
IP — `nizam.amaso.ma`, or the bare domain if the association has no other
site on it. Then wait for it to take effect, and check from your own
machine before going further:

```bash
dig +short nizam.amaso.ma        # must print the Oracle IP
```

HTTPS cannot be issued until this resolves, so it is worth doing before
the install rather than after.

---

## 4. Install AMASO

```bash
ssh ubuntu@<the-ip>

sudo apt update && sudo apt install -y git
sudo git clone https://github.com/MedBens02/Amaso.git /opt/amaso-installer
cd /opt/amaso-installer/deploy

sudo bash bootstrap.sh --check
```

`--check` takes fifteen seconds and changes nothing. It looks at the
release, the disk, the memory, whether anything already holds port 80, and
whether the machine can reach GitHub, Packagist, NodeSource and npm. Every
one of those has stopped an install part way through at least once.

Then the install itself:

```bash
sudo bash bootstrap.sh --domain nizam.amaso.ma --email admin@amaso.ma
```

Ten to twenty minutes, mostly `apt` and the frontend build. It installs the
server packages, MariaDB, PHP, nginx and the application, builds the
frontend, runs the migrations, seeds the reference data and the two
starting accounts, schedules a nightly backup and requests an HTTPS
certificate.

**It prints the starting account passwords once. Write them down then** —
they are generated per install and are not recoverable.

Everything it does is safe to re-run. If it stops — a mirror times out, DNS
has not finished propagating — fix the cause and run the same line again.

---

## 5. Mail, before anyone tries to sign in

Signing in sends a six-digit code to the address on the account, so **if
the server cannot send mail, nobody can log in.**

The install leaves `MAIL_MAILER=log`, which writes email to a file instead
of sending it. The system notices this and leaves the code requirement
**off** rather than locking everyone out silently — but that means the
second step is not protecting anything yet.

Set it up now. The association's own mailbox is the right sender — staff
see a code from `system@amaso.site`, which matches the domain the system
runs on, and there are no app passwords to manage.

```bash
sudo -u amaso nano /opt/amaso/backend/.env
```

```ini
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=system@amaso.site
MAIL_PASSWORD=<the mailbox password>
MAIL_FROM_ADDRESS=system@amaso.site
MAIL_FROM_NAME="جمعية المنصور لكفالة اليتيم"
```

`MAIL_FROM_ADDRESS` must be the same mailbox as `MAIL_USERNAME`. A mail
server rejects a message claiming to come from an address the sender did
not authenticate as, and that mistake produces a working test followed by
silent failures.

Port 465 with `MAIL_SCHEME=smtps` is TLS from the first byte. Port 587 with
`MAIL_SCHEME=null` works too and upgrades with STARTTLS — 465 is simpler
because there is no upgrade step to fail. Both are open outbound on OCI.

Check `APP_URL` is the real address while you are in the file. The server
announces that hostname to the mail server when it connects, and one still
saying `localhost` is a reason for a receiving server to be suspicious:

```ini
APP_URL=https://amaso.site
```

### The three DNS records that decide inbox or spam

A six-digit login code in the spam folder is the same as no login code.
Pointing `amaso.site` at the VM changed the `A` record; the mail records
are separate and must still be intact. Check from your own machine:

```bash
dig +short MX  amaso.site      # must list Hostinger's mail servers
dig +short TXT amaso.site      # must include a v=spf1 record
dig +short TXT _dmarc.amaso.site
```

- **MX** — if this is empty, the mailbox is unreachable and nothing arrives.
  Restore it from Hostinger's DNS panel.
- **SPF** — says Hostinger is allowed to send as `amaso.site`. Hostinger
  adds it automatically; if `dig` shows nothing, add their record.
- **DKIM and DMARC** — enable DKIM in the Hostinger email panel, then add a
  DMARC record. `v=DMARC1; p=none; rua=mailto:system@amaso.site` is the
  right thing to start with: it asks for reports without rejecting anything
  while you confirm the rest is set up.

Then prove it, and switch the requirement on:

```bash
cd /opt/amaso/backend
php artisan config:clear
php artisan amaso:mail-test you@example.com     # a real email must arrive
php artisan amaso:two-factor --all --on
```

**Test a real sign-in before closing the SSH session.** If the code does
not arrive you still have a shell, and `php artisan amaso:two-factor --all
--off` puts it back.

Outbound SMTP is open by default on OCI — Oracle does not block it the way
some providers do.

---

## 6. Check it

```bash
cd /opt/amaso/deploy && sudo bash status.sh
```

Then in a browser at `https://nizam.amaso.ma`: sign in (you should be asked
for a code, and it should arrive), open **الأرامل**, open **التعليم ←
التسجيلات**, and open **إدارة الحسابات** to confirm every account shows
**التحقق بخطوتين: مُفعّل**.

---

## 7. Get the backups off the machine

`bootstrap.sh` already schedules a nightly dump to `/var/backups/amaso`.
That protects against a mistake — someone deleting a family by accident —
and not at all against losing the machine, because the backups are on the
disk that would be lost with it.

Object Storage fixes that, and 20 GB of it is free forever. The database is
a few megabytes, so thirty nightly copies do not come close.

**Create the bucket.** Storage → Buckets → **Create Bucket**, named
`amaso-backups`. Leave it **Private** — this is the association's entire
beneficiary register.

**Let the server write to it without holding a key.** The obvious approach
is to create an API key and put it on the machine, and it is the wrong one:
the machine holding the records would also hold a credential to the place
the backups live. Instance principals avoid that — the VM's own identity is
authorised, and there is no key to steal.

Identity → **Dynamic Groups** → Create, named `amaso-servers`, with the
rule (the OCID is your compartment's, from Identity → Compartments):

```
ALL {instance.compartment.id = 'ocid1.compartment.oc1..aaaa....'}
```

Identity → **Policies** → Create, in the same compartment:

```
Allow dynamic-group amaso-servers to manage objects in compartment <name> where target.bucket.name = 'amaso-backups'
```

`manage objects` rather than `manage buckets`: the server may add backups
to that one bucket and can do nothing else in the account.

**Install the CLI and switch it on:**

```bash
sudo apt install -y python3-oci-cli     # or: bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

cd /opt/amaso/deploy
sudo OCI_BUCKET=amaso-backups bash backup.sh --to-cloud     # prove it once
sudo OCI_BUCKET=amaso-backups bash backup.sh --install-cron # then every night
```

The second line bakes the bucket into the crontab, because cron runs with
almost no environment and a bucket set only in your shell would never reach
the nightly run.

Confirm it arrived — in the console under the bucket, or:

```bash
oci --auth instance_principal os object list --bucket-name amaso-backups \
    --namespace "$(oci --auth instance_principal os ns get --raw-output --query data)"
```

**Also add a boot volume backup policy** — Storage → Block Volumes → the
boot volume → **Oracle-defined backup policies** → *Bronze*. That snapshots
the whole disk weekly, so a machine that will not boot is a restore rather
than a rebuild. It counts against the 200 GB free allowance.

---

## 8. What it costs, and the decision at day 30

The trial is **US$300, or 30 days, whichever ends first**. Nothing is
charged automatically when it ends.

At the end of 30 days:

- **Always Free resources keep running**, untouched and free, indefinitely
  — but only if they are in your home region and within the free shapes.
- **Anything beyond that is reclaimed** unless you upgrade to Pay As You Go.

So if your home region is Casablanca and you built on the A1 shape in §1,
day 30 is a non-event: nothing changes and nothing is billed.

If you are paying, at list prices:

| | per month |
|---|---|
| A1 ARM, 1 OCPU + 6 GB — ample for this | **≈ $15** |
| A1 ARM, 2 OCPU + 12 GB — same as the free shape | ≈ $29 |
| E5 AMD, 1 OCPU (2 vCPU) + 8 GB | ≈ $29 |
| 100 GB boot volume | ≈ $2.55 |
| Object Storage, a few hundred MB of backups | pennies |
| Outbound traffic | free to 10 TB/month, which this will never approach |

Compute is billed per second while the instance is running, so a machine
stopped overnight costs nothing for those hours — though for a system staff
sign into during the day, leave it up.

Set a budget alert either way: Billing → **Budgets** → one on the
compartment at, say, $20, with an alert at 80%. It costs nothing and it is
the difference between noticing on day 2 and noticing on the invoice.

---

## If something is wrong

**The site does not load, but SSH works.** The two firewalls in §2. Check
the security list first, then `sudo iptables -L INPUT -n --line-numbers` on
the machine.

**Certbot fails.** DNS is not pointing at the machine yet, or port 80 is
still closed — Let's Encrypt has to reach the server over HTTP to issue the
certificate. Fix it, then re-run it with the domain and the address
for the certificate:

```bash
cd /opt/amaso/deploy
sudo bash enable-https.sh nizam.amaso.ma admin@amaso.ma
```

**Nobody can sign in.** The mail settings — §5, and `php artisan
amaso:two-factor --all --off` from the server is the way back in.

**"Out of host capacity" when creating the instance.** Free ARM capacity,
not your account. Retry, or take the paid shape.

**The frontend build is killed part way.** Not enough memory. `provision.sh`
adds swap for this, but if you took the 1 GB micro shape, that is the
cause — move to a shape with real memory.

**Upgrading later.** [`../UPGRADE.md`](../UPGRADE.md) covers taking a
running server to a newer version without reseeding.
