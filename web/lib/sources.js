const NON_JIRA_PREFIXES = new Set([
  "ZD", "HTTP", "SHA", "MD", "TLS", "SSL", "TCP", "UDP", "RFC",
]);

const SOURCE_TYPES = [
  {
    key: "jira", label: "JIRA",
    urlPatterns: [/https?:\/\/datadoghq\.atlassian\.net\/browse\/([\w-]+)/gi],
    refPatterns: [/\b([A-Z][A-Z0-9]+-\d+)\b/g],
  },
  {
    key: "zendesk", label: "Zendesk",
    urlPatterns: [/https?:\/\/[\w.-]*zendesk\.com[\w/._?&#%-]*/gi],
    refPatterns: [/\bZD-\d+\b/g],
  },
  {
    key: "confluence", label: "Confluence",
    urlPatterns: [/https?:\/\/datadoghq\.atlassian\.net\/wiki\/[\w/+.-]+/gi],
    refPatterns: [],
  },
  {
    key: "datadog_docs", label: "Datadog Docs",
    urlPatterns: [/https?:\/\/docs\.datadoghq\.com\/[\w/._?&#%-]+/gi],
    refPatterns: [],
  },
  {
    key: "github", label: "GitHub",
    urlPatterns: [/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+[\w/._?&#%-]*/gi],
    refPatterns: [],
  },
  {
    key: "slack", label: "Slack",
    urlPatterns: [/https?:\/\/dd\.(?:enterprise\.)?slack\.com\/[\w/.-]+/gi],
    refPatterns: [],
  },
];

function extractTicketNumber(text) {
  const m = text.match(/(?:ZD-|\/tickets\/)(\d+)/);
  return m ? m[1] : null;
}

export function extractSources(rawText) {
  const sources = [];

  for (const { key: srcKey, label: srcLabel, urlPatterns, refPatterns } of SOURCE_TYPES) {
    const refsSeen = new Set();
    const ticketIdsSeen = new Set();
    const refs = [];

    for (const urlPat of urlPatterns) {
      urlPat.lastIndex = 0;
      let match;
      while ((match = urlPat.exec(rawText)) !== null) {
        const url = match[0].replace(/\)+$/, "");
        let display = url;
        if (srcKey === "jira" && match[1]) display = match[1];
        const dedupKey = `${url}|${display}`;
        if (!refsSeen.has(dedupKey)) {
          refsSeen.add(dedupKey);
          refs.push({ url, display });
          const tid = extractTicketNumber(url);
          if (tid) ticketIdsSeen.add(tid);
        }
      }
    }

    for (const refPat of refPatterns) {
      refPat.lastIndex = 0;
      let match;
      while ((match = refPat.exec(rawText)) !== null) {
        const refText = match[0];
        if (srcKey === "jira") {
          const prefix = refText.split("-")[0];
          if (NON_JIRA_PREFIXES.has(prefix)) continue;
        }
        const tid = extractTicketNumber(refText);
        if (tid && ticketIdsSeen.has(tid)) continue;
        const already = refs.some(
          (r) => (r.display || "").includes(refText) || (r.url || "").includes(refText)
        );
        if (already) continue;
        const dedupKey = `${refText}|${refText}`;
        if (!refsSeen.has(dedupKey)) {
          refsSeen.add(dedupKey);
          if (tid) ticketIdsSeen.add(tid);
          const url = srcKey === "jira"
            ? `https://datadoghq.atlassian.net/browse/${refText}`
            : null;
          refs.push({ url, display: refText });
        }
      }
    }

    if (refs.length > 0) {
      sources.push({ key: srcKey, label: srcLabel, refs });
    }
  }

  return sources;
}

export function extractJiraKeys(text) {
  const candidates = [...text.matchAll(/\b([A-Z][A-Z0-9]+)-(\d+)\b/g)];
  const keys = new Set();
  for (const [, prefix, num] of candidates) {
    if (!NON_JIRA_PREFIXES.has(prefix)) keys.add(`${prefix}-${num}`);
  }
  return [...keys].sort();
}

const SA_URL_RE = /support-admin\.[^/]*\.prod\.dog/i;
const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
const LABELED_URL_RE = /-\s+\*\*([^*]+)\*\*:?\s+(https?:\/\/\S+)/g;
const BARE_URL_RE = /https?:\/\/[^\s)\]>"']+/g;

export function extractSupportAdminLinks(rawText) {
  const seen = new Set();
  const links = [];

  for (const m of rawText.matchAll(MD_LINK_RE)) {
    const [, label, url] = m;
    if (SA_URL_RE.test(url) && !seen.has(url)) {
      seen.add(url);
      links.push({ label: label.trim(), url: url.trim() });
    }
  }

  for (const m of rawText.matchAll(LABELED_URL_RE)) {
    const label = m[1].trim().replace(/:$/, "");
    const url = m[2].trim().replace(/[.,;:!?)]+$/, "");
    if (SA_URL_RE.test(url) && !seen.has(url)) {
      seen.add(url);
      links.push({ label, url });
    }
  }

  for (const m of rawText.matchAll(BARE_URL_RE)) {
    const url = m[0].replace(/[.,;:!?)]+$/, "");
    if (SA_URL_RE.test(url) && !seen.has(url)) {
      seen.add(url);
      links.push({ label: "Support Admin", url });
    }
  }

  return links;
}
