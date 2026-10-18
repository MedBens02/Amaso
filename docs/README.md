# Documentation

Three documents, written for three different readers.

| | For | What it answers |
|---|---|---|
| [`INFRASTRUCTURE.md`](INFRASTRUCTURE.md) | **A hosting provider.** Shareable as-is. | What server does this need, and why that size? Ports, OS, mail, backups, data residency. No how-to, no credentials. |
| [`HANDOVER.md`](HANDOVER.md) | **The next developer.** | What is this, how is it built, what will bite me? Includes an honest account of what is *not* done. |
| [`GLOSSARY.md`](GLOSSARY.md) | **Anyone reading the screens or the data.** | What عدة, كفالة شاملة, مؤونة and أسدس mean, and which table each lives in. |

Start with `HANDOVER.md` if you are picking the project up.

## Everything else

Operational guides live next to the thing they operate, not here:

| | |
|---|---|
| [`../SETUP_GUIDE.md`](../SETUP_GUIDE.md) | Running it locally for development. |
| [`../deploy/README.md`](../deploy/README.md) | Installing on a Linux server. |
| [`../deploy/OCI.md`](../deploy/OCI.md) | Oracle Cloud, Casablanca region specifically. |
| [`../UPGRADE.md`](../UPGRADE.md) | Updating a running server; resetting data while keeping accounts. |
| [`../setup/README.md`](../setup/README.md) | Windows single-machine install *(français)*. |
| [`../REPORTS.md`](../REPORTS.md) | How the reporting and PDF layer is built. |

## Working notes, kept for the reasoning

These are not current specifications. They are retained because they
explain *why* decisions were made, which nothing else records.

| | |
|---|---|
| [`../FINANCIAL-INTEGRITY.md`](../FINANCIAL-INTEGRITY.md) | The money model. Historical in places, still the best explanation of the invariants. |
| [`../reports-implementation-checklist.md`](../reports-implementation-checklist.md) | A finished to-do list from an earlier phase. History only. |
