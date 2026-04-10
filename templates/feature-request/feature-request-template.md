# Feature Request Template

Use this template when creating a JIRA feature request ticket sourced from a customer support case.

---

## Before Submitting

Ensure you have:

- [ ] Investigated the ticket and documented findings in `cases/ZD-{id}/notes.md`
- [ ] Confirmed the feature does not already exist (checked docs, Confluence, JIRA)
- [ ] Verified this is a feature request, not a bug or misconfiguration
- [ ] Removed all customer names, org names, and PII from the request
- [ ] Described the pain point from the investigation — not predicted a solution

---

## JIRA Ticket Format

**Title:**
[Product Area] - [Desired capability described concisely]

Example: "APM - Support custom tag filtering in trace search"

---

**Zendesk Ticket:** ZD-XXXXX

**Product Area:** [Product area from investigation]

---

**Pain Point:**

[1–3 sentences describing the core limitation the customer is experiencing. This should be the crux of the request — what the customer cannot currently do, and why it matters to them. Pull directly from investigation notes.]

---

**User Story:**

[2–5 sentences describing the user's need in narrative form. Built from the TSE's investigation responses — suggested explanations, information gathered, and internal notes. Describes who the user is, what they need, and why current behaviour prevents or hinders this.]

---

**Supporting Context:**

- [Key investigation points that support the request]
- [Relevant internal notes or TSE observations about product gaps]
- [Current workarounds the customer is using, if any]
- [How many customers or what tier of customer is affected, if known]

---

**References:**

- [Zendesk ticket link]
- [Related JIRA tickets (existing feature requests for the same or similar capability)]
- [Confluence pages consulted]
- [Public documentation links]

---

## What NOT to Include

- **No solution proposals** — describe the problem, not how to fix it. The product team decides the approach.
- **No engineering estimates** — leave sizing and prioritisation to the product team.
- **No customer PII** — use "the customer", "users", "the organisation". Never include names, emails, or org IDs.
- **No TSE names** — reference "the support investigation" instead.
- **No assumptions** — only include facts documented in the case investigation.

---

## Example: Good Feature Request

**Title:** Logs - Support regex-based exclusion filters in log pipelines

**Zendesk Ticket:** ZD-98765

**Product Area:** Logs

**Pain Point:**

Users managing high-volume log pipelines need to exclude specific log patterns using regex, but the current exclusion filter only supports exact string matching. This forces them to create multiple individual filters for each variation of a pattern they want to exclude, which becomes unmanageable at scale.

**User Story:**

Platform engineers running centralised logging for a microservices architecture are ingesting over 2 million logs per hour. A significant portion of these are health-check and heartbeat logs that vary slightly per service (different timestamps, request IDs, and service names in the log line). The investigation confirmed that the current exclusion filter requires exact matches, so the team has created over 40 individual exclusion rules — one per service variant. They report that adding new services requires manually adding new exclusion rules each time, and the filter list has become difficult to maintain. During the investigation, it was confirmed that no wildcard or pattern-based filtering exists in the current pipeline exclusion configuration.

**Supporting Context:**

- Investigation confirmed no regex or wildcard support exists in pipeline exclusion filters
- Customer currently maintains 40+ individual exclusion rules as a workaround
- Each new microservice deployment requires a manual exclusion rule addition
- The customer estimates 30% of their ingested log volume is health-check noise

**References:**

- [ZD-98765](https://datadog.zendesk.com/agent/tickets/98765)
- [LOGSS-4567](https://datadoghq.atlassian.net/browse/LOGSS-4567) — Similar request from another customer
- [Log Pipeline Configuration](https://docs.datadoghq.com/logs/log_configuration/pipelines/)
