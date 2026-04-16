---
name: zendesk-ticket-escalation
description: Prepare a structured escalation from a Zendesk ticket for a JIRA TEE card. Reads ticket content, identifies the single core customer issue, collects TSE investigation notes, and outputs a Title, Summary, Investigation, and Question. Use when the user mentions escalate ticket, prepare escalation, escalation for ticket, create escalation, TEE escalation, or wants to escalate a Zendesk ticket.
---

# Ticket Escalation Prep

Reads a Zendesk ticket, distils the customer's core problem into a single-issue escalation, and outputs a structured document ready to paste into a JIRA TEE card.

## When This Skill is Activated

Trigger patterns:
- "escalate ticket #XYZ"
- "prepare escalation for ZD-XYZ"
- "create escalation for #XYZ"
- "TEE escalation for ticket XYZ"

## Workflow

### Step 0: AI Compliance Check (MANDATORY)

```bash
.cursor/skills/_shared/zd-api.sh ticket {TICKET_ID}
```

If the output contains `ai_optout:true` — **STOP**. Tell the user:
> "Ticket #{TICKET_ID}: AI processing is blocked — this customer has opted out of GenAI (oai_opted_out). Handle manually without AI."

Do NOT proceed.

### Step 1: Read the ticket

#### Primary: Chrome JS

```bash
.cursor/skills/_shared/zd-api.sh read {TICKET_ID} 0
```

#### Fallback: Glean MCP

If Chrome is unavailable:
- Tool: `user-glean_default` — `search`
- query: `ticket {TICKET_ID} app:zendesk`

Or read the document directly:
- Tool: `user-glean_default` — `read_document` (if available)
- url: `https://datadog.zendesk.com/agent/tickets/{TICKET_ID}`

### Step 2: Check for existing case notes

```bash
ls cases/ZD-{TICKET_ID}/notes.md 2>/dev/null
```

If the case directory exists, read `notes.md` — it contains prior investigation work that feeds directly into the Investigation section.

### Step 3: Analyse the ticket

From the ticket content, identify:

1. **The customer's core issue** — look for the "Customer Issue:" header or the first description of what's broken. If there are multiple issues in the thread, pick only the **latest** or **primary** unresolved issue.

2. **TSE investigation points** — collect all agent/TSE responses that contain:
   - Suggested explanations or hypotheses
   - Information-gathering questions asked of the customer
   - Internal notes (comments marked as internal)
   - Findings from flare analysis, log review, or config checks
   - Only include investigation related to the **single issue** identified above

3. **The underlying question for TEE** — what does the TSE actually need answered? Derive this from the gap between the Summary (what's happening) and the Investigation (what's been tried/ruled out).

### Step 4: Determine the TEE board

Map the product area from the ticket tags (`spec_*` or `pt_product_type:*`) to the correct board:

| Tag / Area | TEE Board | Project Key |
|------------|-----------|-------------|
| agent | Support - Agent Escalations | AGENT |
| apm / tracing | Support - APM | SRTEE |
| containers | Support - Containers | CONS |
| cloud / ccm | Support - Cloud | CLOUDS |
| dbm | Support - DBM | DBM |
| logs | Support - Logs | LOGSS |
| metrics | Support - Metrics | METS |
| monitors | Support - Monitors | MNTS |
| network / ndm | Support - Network | NETS |
| otel | Support - OTel | OTELS |
| profiling | Support - Profiling | SCP |
| rum | Support - RUM | RUMS |
| security | Support - Security | SCRS |
| serverless | Support - Serverless | SLES |
| service_management | Support - SOCE | SOCE |
| synthetics | Support - Synthetics | SYN |
| web_platform | Support - Web Platform | WEBPS |

If the area is ambiguous, suggest the most likely board and flag it for the TSE to confirm.

### Step 5: Output the escalation

Write the output to `cases/ZD-{TICKET_ID}/escalation.md`. If no case directory exists, create it first:

```bash
mkdir -p cases/ZD-{TICKET_ID}
```

#### Output format

```markdown
# Escalation: ZD-{TICKET_ID}

**TEE Board:** {PROJECT_KEY} — {Board Name}
**Zendesk:** https://datadog.zendesk.com/agent/tickets/{TICKET_ID}

---

## Title

{Clear, concise JIRA title — no customer names, use "Cx" or the org name only}

## Summary

{The single core issue the customer is experiencing. Written in third person ("Cx reports…" / "Org Name observes…"). Include: what's happening, what's expected, and the impact. Keep to 3-5 sentences max.}

## Investigation

{What the TSE has done so far. Structured as:
- Findings or hypotheses explored
- Information gathered or requested
- What has been ruled out
- Relevant logs, configs, or flare findings (brief — link to the ticket for full details)

Only covers investigation related to the single issue in the Summary.}

## Question

{The specific question(s) for the TEE. Brief — not a paragraph.
If multiple questions, use bullet points.
Derived from: what gap remains between the Summary and Investigation?}
```

#### Naming rules

- **Title**: No customer first/last names. Use the org name or "Cx". Keep it under ~80 characters. Format: `[Product Area] - Brief issue description`
- **Summary**: Single issue only. If the ticket has multiple threads, isolate the latest/primary unresolved one.
- **Investigation**: Only investigation relevant to that single issue. Do not dump the entire ticket history.
- **Question**: The question the TSE needs the TEE to answer. Should be answerable — not "please look into this".

### Step 6: Present to the TSE

After writing `escalation.md`, display the full content to the TSE and ask:

> "Here's the escalation draft for ZD-{TICKET_ID}. Review the Title, Summary, Investigation, and Question — let me know if anything needs adjusting before you submit it to {BOARD_NAME}."

Do NOT create the JIRA ticket automatically. The TSE reviews and submits.

## Output

| File | Purpose |
|------|---------|
| `cases/ZD-{TICKET_ID}/escalation.md` | Structured escalation ready for JIRA |

## Examples

### Good Title
`[APM] - Python tracer memory leak after upgrade to ddtrace 2.6.0`

### Bad Title
`John Smith's APM issue with memory`

### Good Summary
> Cx (Acme Corp) reports continuous memory growth (~50MB/hour per pod) in their Django 4.2 application after upgrading from ddtrace 2.5.0 to 2.6.0. Pods are OOM killed every 8-12 hours. Memory stabilises when the tracer is disabled. 15 pods affected across their EKS cluster.

### Bad Summary
> Customer has a memory leak. They upgraded their tracer and now things are broken. They also mentioned some log collection issues separately and asked about a new dashboard feature.

### Good Question
> - Is there a known memory regression in ddtrace 2.6.0 related to Django instrumentation?
> - The customer's heap profile shows growth in `ddtrace._worker` — is this expected under high trace volume (~50 req/s)?

### Bad Question
> Can you please look into this ticket and see what's going on? The customer is having memory issues and we're not sure what to do.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — skill definition |
