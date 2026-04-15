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
   Cursor runs `scripts/setup.py`. Atlassian and Glean use SSO (no tokens). You can optionally add a GitHub PAT, and a **Slack MCP OAuth client ID** for direct Slack tools (`https://mcp.slack.com/mcp`). Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and fill placeholders, or run the script (see `python3 scripts/setup.py --help`).

3. **Restart Cursor** (Cmd+Q, then reopen)
   Atlassian and Glean prompt a one-time SSO login on first use. If Slack MCP is configured, **authenticate Slack MCP** when Cursor opens the browser OAuth flow the first time you use a Slack MCP tool.

That's it.

### Optional: GitHub token

If you want code search, generate a PAT at [github.com/settings/tokens](https://github.com/settings/tokens?type=beta) with Contents + Metadata read. Authorize SSO for the DataDog org.

### Optional: Slack MCP

Add your Slack app **Client ID** under `mcpServers.slack.auth.CLIENT_ID` (see `.cursor/mcp.json.example`). After restart, complete the Slack OAuth prompt once when you first use Slack MCP in Cursor.

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

## Local Web UI (Next.js)

The dashboard lives under `web/` and is a Next.js app (React 19, Tailwind CSS v4).

**Run from the repository root** (recommended):

```bash
./web/run.sh
```

On first run this runs `npm install` in `web/` if `node_modules` is missing, then starts the dev server at **http://localhost:5099**.

**Run manually:**

```bash
cd web
npm install
npm run dev
```

**Production build** (optional, same port):

```bash
cd web
npm install
npm run build
npm start
```

Open **http://localhost:5099** in your browser. You can browse cases, accounts, projects, known issues, docs, templates, archive, and search. The UI is optional; Cursor can use the workspace without it.

## Reconfiguring

Need to add GitHub, Slack MCP, or update config? Tell Cursor *"reconfigure my workspace"* or run (the script rewrites `mcp.json`; pass `--skip-github` / `--skip-slack` or the tokens you want):

```bash
python3 scripts/setup.py --reconfigure --slack-client-id "YOUR_SLACK_CLIENT_ID"
```

## Safety

- All `cases/` and `archive/` folders are gitignored (customer data never committed)
- Credentials stay local (gitignored)
- Cursor confirms before sending public comments to customers

