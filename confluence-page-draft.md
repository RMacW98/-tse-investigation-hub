# TSE Investigation Hub

A Cursor workspace that connects to JIRA, Confluence, GitHub, Glean, and Zendesk via MCP -- so you can investigate customer cases without switching between browser tabs.

---

## Setup (2 minutes)

### 1. Clone and open in Cursor

```
git clone https://github.com/eoghanm2013/tse-investigation-hub.git
```

Open the folder in [Cursor](https://cursor.com).

### 2. Tell Cursor: "Set me up"

That's it. The setup script configures everything:

- **Atlassian** (JIRA + Confluence) -- uses SSO, no token needed
- **Glean** (Slack, internal docs) -- uses SSO, no token needed
- **GitHub** (optional) -- needs a [PAT](https://github.com/settings/tokens?type=beta) with Contents + Metadata read; authorize SSO for DataDog org

### 3. Restart Cursor

Quit completely (Cmd+Q), reopen. Atlassian and Glean will prompt a one-time SSO login on first use.

Test it: *"Search JIRA for open SCRS tickets"*

---

## What you can do

| Goal | What to say |
|------|-------------|
| Investigate a ticket | "Investigate Zendesk ticket ZD-2488538" |
| Search escalations | "Search JIRA for APM memory leak issues" |
| Find internal docs | "Search Confluence for agent troubleshooting" |
| Search code | "Search dd-trace-py for this error message" |
| Search everything | "Search Glean for recent security product updates" |
| Draft a response | "Draft a customer response for this case" |
| Escalate | "Create a JIRA escalation ticket for this" |
| Archive | "Archive this case" |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "I don't have access to JIRA" | Restart Cursor (Cmd+Q), SSO will re-prompt |
| GitHub not working | Token expired -- tell Cursor "reconfigure my workspace" |
| Cursor slow on first open | Wait for indexing to finish |

For anything else: tell Cursor *"Help me troubleshoot my MCP setup"*

---

## Need help?

- Ask Cursor -- it knows how the workspace works
- Slack: #support-team
- Repo: [github.com/eoghanm2013/tse-investigation-hub](https://github.com/eoghanm2013/tse-investigation-hub)
