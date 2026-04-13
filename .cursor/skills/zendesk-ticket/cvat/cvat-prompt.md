# CVAT Entry Generation Prompt

You are creating a Customer Value Add Tracking (CVAT) entry for a Premier customer. Your job is to take the TSE's raw description of what they did and produce a structured, business-value-focused entry.

**Account Name:** {{ACCOUNT_NAME}}
**Raw Description:** {{RAW_DESCRIPTION}}

---

## Step 1: Parse Input

Extract two pieces from the user's message:

1. **Account name** — the customer account (matches a folder under `accounts/`)
2. **Raw description** — what the TSE did for the customer

Common input formats:
- `log cvat for <account> - <description>`
- `value add for <account>: <description>`
- `cvat <account> <description>`

If the **account name** is missing, ask: *"Which account is this for? (folder name under `accounts/`)"*

If the **description** is missing, ask: *"What did you do for this customer?"*

---

## Step 2: Find Account

Check that the account folder exists:

```
accounts/{{ACCOUNT_NAME}}/README.md
```

If it does **not** exist:
1. List all folders under `accounts/` (excluding `.template`)
2. Suggest close matches (case-insensitive partial match)
3. Ask the user to confirm or correct the account name
4. Stop until confirmed

---

## Step 3: Read Account Context

Read these files to understand the customer:

| File | What to extract |
|------|----------------|
| `accounts/{{ACCOUNT_NAME}}/README.md` | Account name, tier, product areas in use, key contacts |
| `accounts/{{ACCOUNT_NAME}}/meta.json` | `org_id`, `tier`, `status` |

Use this context to make the value statement specific and relevant to the customer's environment.

---

## Step 4: Classify Event Type

Determine the CVAT event type from the description. Look for keywords:

| Event Type | Keywords / Signals |
|------------|-------------------|
| **Value Add** | Default — any notable interaction not covered by other types |
| **QBR** | "QBR", "quarterly review", "business review", "monthly review" |
| **Cadence Call** | "cadence call", "check-in", "regular call", "sync", "standup" |
| **Disengaged Customer** | "no-show", "cancelled", "declined", "not responding", "ghosting" |

If unclear, default to **Value Add** — it is the most common and broadly applicable type.

---

## Step 5: Rewrite as Value Statement

Transform the raw description into a concise business-value statement. Follow these rules:

### 5a: Map to a Value Category

Choose the **single best-fit** category:

| Category | Use when the activity... |
|----------|--------------------------|
| **Enhanced Operational Efficiency** | Reduced time spent troubleshooting, sped up resolution, streamlined a process, improved their workflow |
| **Improved Stability and Reliability** | Prevented/reduced risk of failure, caught issues proactively, improved monitoring coverage, performed root cause analysis |
| **Increased Strategic Alignment** | Connected support to business goals, participated in planning, provided roadmap guidance, aligned on priorities |
| **Innovation and Growth** | Helped adopt a new product/feature, supported beta testing, expanded usage, enabled new capabilities |
| **Relationship and Trust** | Built rapport, provided proactive communication, delivered personalized attention, recovered trust after an issue |

### 5b: Write the Value Statement

The value statement should:
- Be **1–3 sentences**
- Focus on the **outcome/impact** for the customer, not on what you did
- Use concrete language — avoid vague phrases like "added value" or "helped the customer"
- Connect the activity to a business outcome where possible

**Good example:**
> Proactive identification and resolution of a misconfigured APM trace sampling rule restored full visibility into production latency, preventing potential blind spots during an upcoming traffic event.

**Bad example:**
> Helped the customer fix their APM configuration which was a good value add.

### 5c: Clean Up the Raw Description

For the "What we did" field, lightly edit the TSE's raw description:
- Fix grammar and spelling
- Expand abbreviations that wouldn't be clear in a report
- Keep it factual and specific
- Do NOT rewrite it entirely — preserve the TSE's voice

---

## Step 6: Format the Entry

Create the entry using this exact format:

```markdown
### YYYY-MM-DD - [Event Type]

**Category:** [Value Category]
**Org ID:** [from meta.json, or "N/A" if not set]

**What we did:**
[Cleaned-up raw description]

**Value delivered:**
[Business-value statement from Step 5b]
```

Use today's date for `YYYY-MM-DD`.

---

## Step 7: Append to Account README

Open `accounts/{{ACCOUNT_NAME}}/README.md` and look for the section:

```markdown
## Value Adds (CVAT)
```

**If the section exists:** Insert the new entry immediately after the section header and its description line (newest entries at the top, before any existing entries).

**If the section does NOT exist:** Add it before the `**Last Updated:**` line at the bottom of the file. Create the section with:

```markdown
---

## Value Adds (CVAT)

> Customer Value Add Tracking entries. Newest first. Submit via Slack: `/pse Customer activity submission`

[NEW ENTRY HERE]

---
```

Then update the `**Last Updated:**` date to today.

---

## Step 8: Confirm with User

After appending, show the user:

1. The full entry that was added
2. The file it was written to: `accounts/{{ACCOUNT_NAME}}/README.md`
3. A reminder: *"Remember to submit this via Slack (`/pse Customer activity submission`) with Org ID {{ORG_ID}} and event type '{{EVENT_TYPE}}'."*

---

## What NOT to Do

- **Do not invent details** — only use what the TSE described and what's in the account files
- **Do not exaggerate impact** — keep the value statement honest and grounded
- **Do not include customer names in the value statement** — use "the customer" if referencing them
- **Do not create a new file** — always append to the existing `README.md`
- **Do not skip the value rewrite** — a raw dump of the description is not a CVAT entry
