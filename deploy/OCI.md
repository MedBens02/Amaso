# AMASO on Oracle Cloud — Casablanca

Putting the system on Oracle's Morocco region, so the association's records
are held in Morocco and reachable from anywhere.

Oracle opened `af-casablanca-1` in 2026. It is the first full public cloud
region in North Africa, which is the reason to use it here: 142 families'
names, national ID numbers and phone numbers stay inside the country rather
than sitting in Frankfurt or Virginia.

Everything below uses the scripts already in this folder. Oracle's part is
building a small private network around one machine; `bootstrap.sh` does
the rest.

---

## What you end up with

```
  visitors ── 80/443 ──▶  Network Load Balancer          public subnet
                          reserved public IP             10.0.0.0/24
                                │  passes each visitor's own address through
                                ▼
                          VM "amaso" — no public IP      private subnet
                            nginx → frontend/out         10.0.1.0/24
                            nginx → PHP-FPM → Laravel
                            MariaDB
                                │ outbound only
               ┌────────────────┴───────────────┐
               ▼                                ▼
          NAT gateway                      Service gateway
     GitHub, apt, Let's Encrypt,          Object Storage — the
     the mail server                      nightly backups (§9)

  you ── SSH ──▶ Bastion: sessions that expire, from your address only ──▶ VM
```

**The machine has no public address.** Nothing on the internet can reach
it except through the load balancer, and the load balancer only forwards
80 and 443. A mistake on the machine — MariaDB listening on every
interface, a debug port left open, SSH with a weak setting — is still not
reachable from outside, because there is no outside address to reach it
on. That is the point of the private subnet: one layer that does not
depend on everything else being right.

**SSH is not open to the internet at all.** Oracle's Bastion service hands
out SSH sessions that last a few hours and only from the address you name.
It costs nothing.

One machine, not a fleet. For 142 families and 361 orphans that is not a
compromise — it is the right size, and every part of it is something one
person can understand and repair. The database is on the same box on
purpose: the whole thing is a few megabytes, and a managed database would
add cost, a network hop and another thing to hold credentials for.

The one thing that must **not** live on that box is the backups, and §9
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
| Run in Casablanca and pay for it | ~$15/month (§10). Records stay in Morocco. The trial credits cover the first month. |
| Use the free tier where your home region is | Free forever, but the families' records leave Morocco. For this data I would not. |
| Start a second account with Casablanca as its home region | Free and in Morocco, but Oracle permits one free tier per person and may flag a duplicate. Their call, not mine — but do not build on it and then find out. |

---

## 1. The network — VCN, two subnets, three gateways

**First, check the account can make a NAT gateway.** The private subnet
reaches the internet through one, and Always Free accounts have been
reported with a NAT gateway limit of **0**. Governance & Administration →
**Limits, Quotas and Usage**, service *Networking* (or *Virtual Cloud
Network*), and look for the NAT gateway count.

- **1 or more** — carry on.
- **0** — upgrade to **Pay As You Go** (Billing → Upgrade). Always Free
  resources stay free after the upgrade; you only pay for what goes beyond
  them. It also puts the account under Oracle's standard data-processing
  terms, which a free account may not be. If you would rather not, use
  [the simpler layout](#if-your-account-cannot-make-a-nat-gateway) at the
  end of §5 instead.

Then: Networking → Virtual Cloud Networks → **Start VCN Wizard** →
**Create VCN with Internet Connectivity**.

| Field | Value |
|---|---|
| VCN name | `amaso-vcn` |
| VCN CIDR block | `10.0.0.0/16` |
| Public subnet CIDR | `10.0.0.0/24` |
| Private subnet CIDR | `10.0.1.0/24` |

Leave IPv6 off. The wizard creates the VCN, both subnets, an **internet
gateway** (the public subnet's way in and out), a **NAT gateway** (the
private subnet's way *out* — nothing can come in through it) and a
**service gateway** (Object Storage, without crossing the internet), with
the route tables already pointing at them.

Check before moving on. Open the **private** subnet's route table — it
must have two rules:

| Destination | Target |
|---|---|
| `0.0.0.0/0` | NAT Gateway |
| All *…* Services in Oracle Services Network | Service Gateway |

If the wizard stopped with a limit error, it is the NAT check above.

---

## 2. The firewall rules

There are three layers, and all three have to agree before a request gets
through.

**Remove SSH from the public subnet.** Open the public subnet's
**Default Security List** and delete the ingress rule for TCP port **22**
from `0.0.0.0/0`. Nothing in the public subnet needs it: the load balancer
does not take SSH and the Bastion does not use it. Leave the ICMP rules
alone — they carry the "packet too big" messages connections depend on.

**Leave the private subnet's list as the wizard made it.** It allows TCP 22
from `10.0.0.0/16` only — the inside of the VCN, which is where the Bastion
connects from.

**Create two network security groups.** VCN → **Network Security Groups**
→ Create. A security group is attached to a single resource rather than a
whole subnet, which keeps each rule next to the thing it protects.

`nsg-front` — for the load balancer:

| Direction | Source | Protocol | Port |
|---|---|---|---|
| Ingress | `0.0.0.0/0` | TCP | `80` |
| Ingress | `0.0.0.0/0` | TCP | `443` |

`nsg-app` — for the machine:

| Direction | Source | Protocol | Port |
|---|---|---|---|
| Ingress | `0.0.0.0/0` | TCP | `80` |
| Ingress | `0.0.0.0/0` | TCP | `443` |
| Ingress | `10.0.0.0/16` | TCP | `22` |

`0.0.0.0/0` on the machine looks wrong and is right. The load balancer in §4
forwards each visitor's packets with *their* address still on them, so the
machine sees requests from all over the internet. It is still not
reachable from the internet, because it has no public address — the only
way those packets arrive is through the load balancer.

**The firewall on the machine.** Oracle's Ubuntu image ships an iptables
rule that rejects everything except SSH, whatever the rules above say.
`provision.sh` finds that rule and opens 80 and 443 above it, then saves the
result so it survives a reboot — nothing to do here, but if you are ever
debugging by hand, that is the rule to look for:

```bash
sudo iptables -L INPUT --line-numbers -n
```

---

## 3. The machine

Console → **Compute → Instances → Create instance**.

**Name** `amaso`

**Placement** Casablanca has a single availability domain, so there is
nothing to choose — and nothing to fall back to if it is short of capacity.

**Image** Change image → **Canonical Ubuntu 24.04**. The scripts are
written for it. On the ARM shape make sure the build is **aarch64**, which
the console selects automatically once the shape is ARM.

**Shape** Change shape:

- *Always Free path*: **Ampere → VM.Standard.A1.Flex**, **2 OCPU** and
  **12 GB** memory. That is the whole of the free ARM allowance (Oracle
  halved it from 4/24 in June 2026), and it is far more than this needs.
- *Paid path*: **Ampere → VM.Standard.A1.Flex** at **1 OCPU / 6 GB**, about
  $15/month. Ample. Choose AMD **VM.Standard.E5.Flex** only if something
  you add later needs x86 — nothing in AMASO does.

Do **not** take `VM.Standard.E2.1.Micro`. It is free, but it has 1 GB of
RAM and the frontend build peaks near 1.4 GB.

**Networking**

- Select existing VCN → `amaso-vcn`
- Subnet → the **private** subnet
- **Do not assign a public IPv4 address** — untick it if it is ticked
- **Use network security groups** → `nsg-app`

**SSH keys** Paste your public key, or let the console generate one and
**save the private key before leaving the page** — it is shown once.

**Boot volume** Raise it to **100 GB**. The free allowance is 200 GB in
total and the default 46.6 GB leaves little room for backups and logs.

**Advanced options → Oracle Cloud Agent** → tick **Bastion**. It is off by
default, and §5's sessions need it.

Create it, and note its **private** IP — `10.0.1.x`.

> **"Out of host capacity"** is common for free ARM shapes and it means what
> it says — Oracle has none free right now. Casablanca has one availability
> domain, so the usual trick of trying another one does not apply here.
> Either retry over the next day or two, or take the paid 1 OCPU shape.

---

## 4. The front door — load balancer, address, domain

Networking → Load Balancers → **Network Load Balancer** → Create. The
*network* load balancer, not the plain one: it forwards packets rather
than reading them, so HTTPS stays on the machine where `bootstrap.sh` puts
the certificate, and it can pass the visitor's address through.

| Field | Value |
|---|---|
| Name | `amaso-front` |
| Visibility | **Public** |
| IP address | **Reserved IP address → Create new**, named `amaso-ip` |
| VCN / subnet | `amaso-vcn` / the **public** subnet |
| Network security group | `nsg-front` |

**Listener** TCP, port **80**.

**Backend set** named `http`:

- **Preserve source IP — on.** This matters more than it looks. Without
  it, every request reaches the machine from the load balancer's own
  address, and the application cannot tell visitors apart: ten failed
  sign-ins from anyone lock everyone out for a minute, and the activity log
  records the same address against every action.
- Backend: the instance `amaso`, port **80**.
- Health check: **TCP**, port **80**.

Create it, then add the second half: **Listeners → Create** — TCP, port
**443**, with a new backend set `https` built the same way on port **443**
(health check TCP 443). That one shows *critical* until the certificate
exists, which is expected.

A **reserved** address is the one to use: an ephemeral one is released if
the load balancer is ever recreated, and the domain would quietly point at
nothing.

**DNS.** At whoever holds the domain, point an `A` record at the reserved
IP — the load balancer's, not the machine's. Check from your own computer
before going further:

```bash
dig +short amaso.site        # must print the reserved IP
```

HTTPS cannot be issued until this resolves.

---

## 5. Getting in — the Bastion

Identity & Security → **Bastion** → Create bastion:

| Field | Value |
|---|---|
| Name | `amaso-bastion` |
| Target VCN / subnet | `amaso-vcn` / the **private** subnet |
| CIDR block allowlist | your own address, e.g. `41.x.x.x/32` |

Your address is what `curl ifconfig.me` prints from your computer. A home
connection's address changes from time to time; when it does, sessions
stop connecting, and you edit the allowlist. Widening it to `0.0.0.0/0`
also works and is less risky than it sounds: a session still needs your
Oracle sign-in to create and your SSH key to use.

**Each time you need a shell:** the bastion → **Create session**:

- Session type **Managed SSH session**
- Username `ubuntu`, instance `amaso`
- Your SSH **public** key
- Maximum time to live — up to 3 hours

When it shows *Active*, its **⋮ → Copy SSH command** gives a ready command
(it hops through the bastion with your key). Put the path to your
**private** key in both places it says `<privateKey>`, and run it.

If *Managed SSH* is greyed out, the Bastion plugin is not running yet —
check the instance's **Oracle Cloud Agent** tab, give it a few minutes.
Meanwhile, **SSH port forwarding session** to the instance's private IP on
port 22 does the same job without the plugin.

### If your account cannot make a NAT gateway

The simpler layout, safe enough on its own:

- The machine goes in the **public** subnet, *with* a public IPv4 address —
  make it **reserved** (instance → VNIC → IPv4 addresses → edit → Reserved).
- Attach `nsg-app` to it, but **remove its port 22 rule** — the public
  subnet's list no longer has one either, so SSH is closed to the internet.
- Skip the load balancer: the `A` record points at the machine's reserved IP.
- The Bastion targets the **public** subnet instead; everything else in §5
  is the same.
- In §6, leave `PUBLIC_IP=` off: the machine's traffic leaves from its own
  address, so the scripts find the right one by themselves.

What you give up is the second layer: the machine has a public address, so
only the rules above stand between it and the internet. They are enough —
but they are the only thing.

---

## 6. Install AMASO

Open a Bastion session (§5) and run the SSH command it gives you. Then:

```bash
sudo apt update && sudo apt install -y git
sudo git clone https://github.com/MedBens02/Amaso.git /opt/amaso-installer
cd /opt/amaso-installer/deploy

sudo bash bootstrap.sh --check
```

`--check` takes fifteen seconds and changes nothing. It looks at the
release, the disk, the memory, whether anything already holds port 80, and
whether the machine can reach GitHub, Packagist, NodeSource and npm. Every
one of those has stopped an install part way through at least once — and
here it also proves the NAT gateway works, since that is the only way out
of the private subnet.

Then the install itself, with the load balancer's reserved IP from §4:

```bash
sudo PUBLIC_IP=<the reserved IP> bash bootstrap.sh --domain amaso.site --email system@amaso.site
```

`PUBLIC_IP` is not optional in this layout. Without it the scripts ask an
outside service what the machine's address is, and from the private
subnet the answer is the **NAT gateway's** — the address the machine's
traffic leaves from, which takes nothing coming in. It would end up in the
summary as the address to point the domain at, and in `APP_URL`.

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

## 7. Mail, before anyone tries to sign in

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
sudo -u amaso nano /var/www/amaso/backend/.env
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
cd /var/www/amaso/backend
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

## 8. Check it

```bash
cd /opt/amaso-installer/deploy && sudo bash status.sh
```

Then in a browser at `https://amaso.site`: sign in (you should be asked
for a code, and it should arrive), open **الأرامل**, open **التعليم ←
التسجيلات**, and open **إدارة الحسابات** to confirm every account shows
**التحقق بخطوتين: مُفعّل**.

---

## 9. Get the backups off the machine

`bootstrap.sh` already schedules a nightly dump to `/var/backups/amaso`.
That protects against a mistake — someone deleting a family by accident —
and not at all against losing the machine, because the backups are on the
disk that would be lost with it.

Object Storage fixes that, and 20 GB of it is free forever. The private
subnet reaches it through the service gateway from §1, so the backups never
cross the public internet on the way. The database is
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

cd /opt/amaso-installer/deploy
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

## 10. What it costs, and the decision at day 30

The trial is **US$300, or 30 days, whichever ends first**. Nothing is
charged automatically when it ends.

At the end of 30 days:

- **Always Free resources keep running**, untouched and free, indefinitely
  — but only if they are in your home region and within the free shapes.
- **Anything beyond that is reclaimed** unless you upgrade to Pay As You Go.

So if your home region is Casablanca and you built on the A1 shape in §3,
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
| Network load balancer, Bastion | no charge |
| VCN, internet / NAT / service gateways | check the cost estimator; Oracle does not list a charge for the gateways themselves |

Compute is billed per second while the instance is running, so a machine
stopped overnight costs nothing for those hours — though for a system staff
sign into during the day, leave it up.

Set a budget alert either way: Billing → **Budgets** → one on the
compartment at, say, $20, with an alert at 80%. It costs nothing and it is
the difference between noticing on day 2 and noticing on the invoice.

---

## If something is wrong

**The site does not load.** Start at the load balancer: `amaso-front` →
backend sets → `http` → health.

- *Critical* — the load balancer cannot reach the machine: `nsg-app` (§2),
  then `sudo iptables -L INPUT -n --line-numbers` on the machine, then
  whether nginx is running at all (`sudo systemctl status nginx`).
- *OK* but the site still does not load — the problem is in front of the
  load balancer: `nsg-front`, or DNS not pointing at the reserved IP yet.

**Everyone is locked out of signing in at once, or the activity log shows
the same address for every action.** *Preserve source IP* is off on a
backend set (§4). Turn it on for both.

**The Bastion session will not connect.** Your address changed and is no
longer on the allowlist; or the Bastion plugin is not running (instance →
Oracle Cloud Agent); or the private subnet's list lost its TCP 22 from
`10.0.0.0/16`.

**`bootstrap.sh --check` cannot reach GitHub or npm.** The private subnet's
route table has no `0.0.0.0/0 → NAT Gateway` rule (§1).

**Certbot fails.** DNS is not pointing at the reserved IP yet, or port 80
is not getting through — Let's Encrypt has to reach the server over HTTP
to issue the certificate. If the `http` backend set shows *critical*, fix
that first (above). Fix it, then re-run it with the domain and the address
for the certificate:

```bash
cd /opt/amaso-installer/deploy
sudo PUBLIC_IP=<the reserved IP> bash enable-https.sh amaso.site system@amaso.site
```

**Nobody can sign in.** The mail settings — §7, and `php artisan
amaso:two-factor --all --off` from the server is the way back in.

**"Out of host capacity" when creating the instance.** Free ARM capacity,
not your account. Retry, or take the paid shape.

**The frontend build is killed part way.** Not enough memory. `provision.sh`
adds swap for this, but if you took the 1 GB micro shape, that is the
cause — move to a shape with real memory.

**Upgrading later.** [`../UPGRADE.md`](../UPGRADE.md) covers taking a
running server to a newer version without reseeding.
