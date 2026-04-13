---
name: zendesk-ticket-cvat
description: Log a Customer Value Add Tracking (CVAT) entry for a Premier customer. Takes a raw description of what you did, rewrites it as a business-value statement, and appends it to the customer's account file. Use when the user mentions log cvat, value add for, cvat, track value, or wants to record a customer activity.
---

# CVAT — Customer Value Add Tracking

Transforms a raw description of an activity performed for a Premier customer into a structured, business-value-focused CVAT entry and appends it to the customer's account file at `accounts/<account-name>/README.md`.

## How to Use

Say: **"log cvat for acme - helped them set up RUM for their mobile app launch"**

The agent will:
1. Find the account folder under `accounts/`
2. Read account context (tier, product areas, org ID)
3. Classify the CVAT event type
4. Rewrite the description as a business-value statement
5. Append a timestamped entry to the account's `README.md`

## When This Skill is Activated

If a message matches any of these patterns:
- "log cvat for <account>"
- "value add for <account>"
- "cvat <account>"
- "track value for <account>"

Then:
1. Extract the account name and raw activity description from the message
2. Follow the steps in `cvat-prompt.md` in this folder
3. Append the entry to `accounts/<account-name>/README.md`

## CVAT Event Types

| Type | When to use |
|------|-------------|
| **Value Add** | Any notable interaction that added value (default) |
| **QBR** | Quarterly/monthly business review |
| **Cadence Call** | Regular check-in call |
| **Disengaged Customer** | Customer not adhering to processes (missed meetings, declined calls) |

## Business Value Categories

Entries are mapped to one of these value categories (from [Business Value for Premier Support Customers](https://datadoghq.atlassian.net/wiki/spaces/PS/pages/5036115788)):

| Category | Examples |
|----------|----------|
| **Enhanced Operational Efficiency** | Faster resolution, reduced downtime, streamlined processes |
| **Improved Stability and Reliability** | Proactive monitoring, root cause analysis, reduced failure risk |
| **Increased Strategic Alignment** | Aligned with business objectives, roadmap sessions |
| **Innovation and Growth** | Beta features, new product adoption, feature implementation |
| **Relationship and Trust** | Trust building, personalized attention, proactive communication |

## No AI Compliance Check Required

Unlike ticket-based skills, CVAT entries are authored by the TSE about their own actions — no customer ticket data from Zendesk is processed through the LLM. No `oai_opted_out` check is needed.

## Output

A timestamped entry is appended to the `## Value Adds (CVAT)` section in `accounts/<account-name>/README.md`:

```markdown
### YYYY-MM-DD - Value Add

**Category:** Enhanced Operational Efficiency
**Org ID:** 12345

**What we did:**
Helped the customer set up RUM for their mobile app launch, including custom action naming and session replay configuration.

**Value delivered:**
Proactive support during a critical product launch enabled faster observability adoption, reducing time-to-visibility for mobile performance issues.
```

The entry text is formatted for easy copy-paste into the Slack `/pse Customer activity submission` workflow.

## Integration with Other Skills

- **`zendesk-ticket-investigator`** — After resolving a notable ticket, log the value-add with this skill
- **QBR preparation** — CVAT entries in the account README provide ready-made data points for QBR slides

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — skill definition |
| `cvat-prompt.md` | Step-by-step prompt for generating CVAT entries |
