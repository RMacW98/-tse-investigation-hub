---
name: zendesk-ticket-feature-request
description: Prepare a product feature request from a Zendesk ticket investigation. Reads case notes, extracts the customer pain point, and builds a user story — without predicting solutions. Use when the user mentions feature request, product request, prepare feature request, or wants to submit a feature request for a ticket.
---

# Feature Request Preparer

Reads the investigation notes for a Zendesk ticket and produces a structured feature request suitable for the product team. Focuses on the **customer pain point** and **user story** derived from the TSE's investigation — does not predict or propose solutions.

## How to Use

Just say: **"feature request for #1234567"** or **"prepare feature request for ZD-1234567"**

The agent will:
1. Read the existing case files (`notes.md`, `README.md`, `meta.json`)
2. Extract the customer's core pain point
3. Build a user story from the TSE's investigation responses
4. Write `cases/ZD-{id}/feature-request.md`

## When This Skill is Activated

Triggers on:
- "feature request for #XYZ"
- "prepare feature request for ZD-XYZ"
- "product request for #XYZ"
- "submit feature request for ZD-XYZ"

Then:
1. Extract the ticket ID
2. **Run the AI Compliance Check below FIRST**
3. Follow the steps in `feature-request-prompt.md`
4. Write output to `cases/ZD-{TICKET_ID}/feature-request.md`

## Prerequisites

This skill reads **existing case files** — it does NOT re-fetch from Zendesk. Run the investigator skill first if no case folder exists:
```
investigate ticket #1234567
```

## AI Compliance Check (MANDATORY — FIRST STEP)

**Before processing ANY ticket data**, check for the `oai_opted_out` tag:

```bash
.cursor/skills/_shared/zd-api.sh ticket {TICKET_ID}
```

If the output contains `ai_optout:true`:
1. **STOP IMMEDIATELY** — do NOT process ticket data through the LLM
2. Do NOT generate any feature request or report
3. Tell the user: **"Ticket #{TICKET_ID}: AI processing is blocked — this customer has opted out of GenAI (oai_opted_out). Handle manually without AI."**
4. Exit the skill

This is a legal/compliance requirement. No exceptions.

## If zd-api.sh fails (exit 1 or no output)

`zd-api.sh` uses Chrome + osascript. If Chrome has no Zendesk tab open, or the script fails, it returns **exit code 1** and no output. **Do not fail the skill.**

- **Compliance:** You cannot confirm `oai_opted_out`. In the output state: *"Compliance check skipped (Zendesk API unavailable — ensure Chrome has a Zendesk tab open). Verify manually before using AI output."* Then proceed.
- Continue with existing case files.

## Key Constraints

- **Only analyse what is noted** — do not infer, predict, or propose solutions
- **No user names** — strip all customer names, org names, email addresses; use "the customer" or "users"
- **Pain point first** — find the crux of what the customer is asking for
- **User story from TSE notes** — use the agent's responses (suggested explanations, information gathering, internal notes) to describe the user story concisely

## Output

Feature request is saved to `cases/ZD-{TICKET_ID}/feature-request.md`.

The TSE Hub web dashboard at `http://localhost:5099` can display this file and offers a "Prepare Feature Request" modal on the case detail page for copy-paste into JIRA.

## Integration with Other Skills

- **`zendesk-ticket-investigator`** — must run first to create case files
- **`zendesk-ticket-classifier`** — if `meta.json` has `issue_type: feature-request`, this skill is a natural next step

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | This file — skill definition |
| `feature-request-prompt.md` | Step-by-step feature request extraction prompt |
