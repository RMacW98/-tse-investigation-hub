# Feature Request Extraction Prompt

You are preparing a product feature request from an investigated Zendesk ticket. Your job is to distil the customer's pain point and the user story from the TSE's investigation notes — nothing more.

**Ticket ID:** {{TICKET_ID}}

---

## Step 0: AI Compliance Check

Run the compliance check **before doing anything else**:

```bash
.cursor/skills/_shared/zd-api.sh ticket {{TICKET_ID}}
```

- If the output contains `ai_optout:true` → **STOP**. Tell the user: *"Ticket #{{TICKET_ID}}: AI processing is blocked — this customer has opted out of GenAI (oai_opted_out). Handle manually without AI."* Exit immediately.
- If the script fails (exit 1 / no output) → note *"Compliance check skipped (Zendesk API unavailable). Verify manually."* and proceed.

---

## Step 1: Read Case Files

Read these files from `cases/ZD-{{TICKET_ID}}/`:

| File | What to look for |
|------|-----------------|
| `README.md` | Ticket metadata, environment, issue summary, investigation links |
| `notes.md` | Investigation timeline, customer communications, what the TSE tried and found |
| `meta.json` | Status, priority, issue_type, product area |

If the case folder does not exist, tell the user: *"No case files found for ZD-{{TICKET_ID}}. Run `investigate ticket #{{TICKET_ID}}` first."* and stop.

---

## Step 2: Extract the Customer's Core Ask

Scan the case files for what the customer is requesting. Focus on:

- **Customer Communications** sections — direct quotes of what the customer wants
- **Issue Summary / What's Happening** — the described limitation or gap
- **What We Know** — facts established during the investigation

Look for language like: "I wish…", "it would be great if…", "is it possible to…", "we need…", "can Datadog…", "there's no way to…"

Identify: **What capability or behaviour does the customer want that does not currently exist?**

---

## Step 3: Identify the Pain Point

From the investigation notes, determine **why** this matters to the customer:

- What limitation are they hitting?
- What workaround (if any) are they forced to use?
- What is the business or operational impact?

Write this as 1–3 sentences. Pull only from what is documented — do not infer or assume impact.

---

## Step 4: Build the User Story

Use the TSE's investigation responses to construct a concise user story. Draw from:

- **TSE's suggested explanations** — what the TSE told the customer about current product behaviour
- **Information gathering notes** — what the TSE learned while investigating
- **Internal notes** — any TSE observations about product gaps or limitations
- **Actions Taken / What We've Tried** — steps that confirmed the feature doesn't exist

Write the user story as a short narrative (2–5 sentences) describing:
- Who the user is (role/context, e.g. "platform engineers", "SRE teams")
- What they need to do
- Why current product behaviour prevents or hinders this

Do **not** use the formal "As a… I want… so that…" template unless it reads naturally. A clear paragraph is preferred.

---

## Step 5: Generate the Title

Create a clear, concise title:

- Prefix with the product area (e.g. "APM", "Logs", "Monitors")
- Describe the desired capability, not the problem
- Keep under 80 characters when possible

Good: `APM - Support custom tag filtering in trace search`
Bad: `Customer can't filter traces by custom tags`

---

## Step 6: Strip PII

Before writing the output, remove all:
- Customer names, company names, org names
- Email addresses
- Org IDs, account IDs
- Any personally identifiable information

Replace with generic references: "the customer", "users", "the organisation".

---

## Step 7: Write Output

Write the feature request to `cases/ZD-{{TICKET_ID}}/feature-request.md`:

```markdown
## Feature Request: [Title]

**Zendesk Ticket:** ZD-{{TICKET_ID}}
**Product Area:** [detected from meta.json or case content]

### Pain Point

[1–3 sentences: the core limitation the customer is experiencing, sourced from case notes]

### User Story

[2–5 sentences: concise narrative built from the TSE's investigation notes describing what the user needs and why]

### Supporting Context

- [Key investigation points from TSE notes that support the request]
- [Relevant internal notes or observations]
- [Current workarounds the customer is using, if any]

### References

- [Zendesk ticket link]
- [Any relevant JIRA tickets, Confluence pages, or documentation links from case files]
```

---

## What NOT to Do

- **Do not propose solutions** — this is a feature request, not a design doc
- **Do not predict engineering effort** — leave that to the product team
- **Do not add information not present in the case files** — if something isn't documented, don't invent it
- **Do not include customer names or PII** — always anonymise
- **Do not include TSE names** — reference "the support investigation" or "the investigation" instead

---

## After Writing

Tell the user:
1. The feature request has been written to `cases/ZD-{{TICKET_ID}}/feature-request.md`
2. They can view and edit it in the TSE Hub at `http://localhost:5099/case/ZD-{{TICKET_ID}}`
3. Use the "Prepare Feature Request" button on the case page to copy fields into JIRA
