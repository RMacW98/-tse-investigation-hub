# TSE Investigation Hub

Centralized Cursor workspace for Datadog Technical Support Engineers. Investigate customer tickets, search internal docs, escalate to engineering -- all from one place.

## Setup (2 minutes)

**Prerequisites:** [Cursor](https://cursor.com), Git, [Node.js](https://nodejs.org) (v18+, for the web UI)

1. **Clone and open**
   ```bash
   git clone https://github.com/RMacW98/-tse-investigation-hub.git
   ```
   Open the folder in Cursor.

2. **Tell Cursor: "Set me up"**
   Cursor runs the setup script. Atlassian and Glean use SSO (no tokens needed). You'll optionally be asked for a GitHub PAT.

3. **Restart Cursor** (Cmd+Q, then reopen)
   Atlassian and Glean will prompt a one-time SSO login on first use.

That's it.

### Optional: GitHub token

If you want code search, generate a PAT at [github.com/settings/tokens](https://github.com/settings/tokens?type=beta) with Contents + Metadata read. Authorize SSO for the DataDog org.

## What you can do

Ask Cursor things like:

- *"Investigate Zendesk ticket 12345"* -- fetches the ticket, searches for similar cases, creates investigation notes
- *"Search JIRA for open escalation tickets"* -- queries escalation tickets
- *"Search Confluence for APM troubleshooting"* -- finds internal docs
- *"Search Glean for recent security product updates"* -- searches Slack, Confluence, everything
- *"Draft a customer response for ZD-12345"* -- uses communication templates
- *"Log CVAT for acme-corp: built custom dashboard for their migration"* -- logs a value-add entry to the account
- *"Show me my open tickets"* -- displays your current Zendesk ticket pool

## Structure

```
cases/           Active investigations (ZD-XXXXX folders, gitignored)
accounts/        Persistent customer account tracking (QBRs, CVAT, contacts)
projects/        Discrete work items (presentations, tooling, docs)
archive/         Resolved cases by month (gitignored)
docs/            Product troubleshooting docs
solutions/       Known issues and workarounds
templates/       Customer communication and escalation templates
scripts/         Utility scripts (setup, Zendesk client, JIRA client)
reference/       JIRA project codes, internal references
```

## Accounts

Track persistent customer relationships, contacts, QBR schedules, and value-add activities.

**Create an account:**
```bash
cp -r accounts/.template accounts/acme-corp
```

Then fill in the details in `accounts/acme-corp/README.md` and `meta.json` -- org ID, tier, CSM, key contacts, product areas in use.

Each account folder contains:
- `README.md` -- account overview, contacts, product areas, related cases, and CVAT log
- `notes.md` -- running notes (append new entries at the top)
- `tasks.md` -- small action items and requests
- `meta.json` -- machine-readable metadata (org ID, tier, CSM, QBR dates)
- `qbrs/` -- monthly QBR notes (e.g. `qbrs/2026-04.md`)

**Log a CVAT entry:** After doing something valuable for a Premier customer, tell Cursor:

- *"Log CVAT for acme-corp: helped them set up custom APM dashboards for their new microservices rollout"*

Cursor rewrites your description as a business-value statement and appends it to the account's README under the Value Adds section.

## Projects

Track discrete work items like presentations, documentation, or tooling with a clear start and end.

**Create a project:**
```bash
cp -r projects/.template projects/my-presentation
```

Then fill in `projects/my-presentation/README.md` and `meta.json` -- type, status, due date, audience, deliverables.

Each project folder contains:
- `README.md` -- project overview, timeline, deliverables, and resources
- `notes.md` -- working notes and progress log
- `meta.json` -- machine-readable metadata (type, status, due date, audience)

Project types: `presentation`, `documentation`, `tooling`, `other`

