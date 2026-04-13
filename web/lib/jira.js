const DOMAIN = process.env.ATLASSIAN_DOMAIN || "datadoghq.atlassian.net";
const EMAIL = process.env.ATLASSIAN_EMAIL || "";
const TOKEN = process.env.ATLASSIAN_API_TOKEN || "";

function authHeader() {
  const creds = Buffer.from(`${EMAIL}:${TOKEN}`).toString("base64");
  return { Authorization: `Basic ${creds}`, Accept: "application/json" };
}

export async function getIssue(issueKey) {
  const url = `https://${DOMAIN}/rest/api/3/issue/${issueKey}`;
  try {
    const res = await fetch(url, { headers: authHeader(), signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function extractText(adfContent) {
  if (!adfContent) return "";
  function extract(node) {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extract).join("");
    if (node && typeof node === "object") {
      if (node.type === "text") return node.text || "";
      if (node.content) return node.content.map(extract).join("");
    }
    return "";
  }
  return extract(adfContent);
}

export function extractJiraActivity(issue, maxComments = 2) {
  const fields = issue.fields || {};
  const status = fields.status?.name || "Unknown";
  const updated = (fields.updated || "").slice(0, 16).replace("T", " ");
  const summary = fields.summary || "";
  const assigneeField = fields.customfield_11300 || [];
  const assignees = assigneeField.filter(Boolean).map((a) => a.displayName || "");

  const commentsRaw = fields.comment?.comments || [];
  const recentComments = commentsRaw.slice(-maxComments).map((c) => {
    const author = c.author?.displayName || "Unknown";
    const date = (c.created || "").slice(0, 10);
    let body = extractText(c.body || {});
    if (body.length > 300) body = body.slice(0, 300) + "...";
    return { author, date, body };
  });

  return {
    key: issue.key || "",
    status,
    summary,
    updated,
    assignees,
    last_comments: recentComments,
    url: `https://datadoghq.atlassian.net/browse/${issue.key || ""}`,
  };
}

export async function fetchEscalations(jiraKeys) {
  const results = [];
  for (const key of jiraKeys) {
    const issue = await getIssue(key);
    if (issue) results.push(extractJiraActivity(issue));
  }
  return results;
}
