import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR } from "./paths.js";
import { detectProductArea, PRODUCT_AREA_LABELS, TEE_BOARDS } from "./product-areas.js";

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\n)##?\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##?\\s|$)`, "i");
  const m = text.match(pattern);
  return m ? m[1].trim() : "";
}

async function readFileOr(filePath) {
  try { return await fs.readFile(filePath, "utf-8"); } catch { return ""; }
}

export async function buildEscalationContext(key) {
  const caseDir = path.join(CASES_DIR, key);
  const readmeRaw = await readFileOr(path.join(caseDir, "README.md"));
  const notesRaw = await readFileOr(path.join(caseDir, "notes.md"));
  const combined = readmeRaw + "\n" + notesRaw;

  let meta = { status: "new", assignee: "", priority: "", issue_type: "" };
  try {
    meta = { ...meta, ...JSON.parse(await fs.readFile(path.join(caseDir, "meta.json"), "utf-8")) };
  } catch { /* */ }

  const productArea = detectProductArea(combined);
  const areaLabel = PRODUCT_AREA_LABELS[productArea] || "";

  const titleMatch = (readmeRaw || notesRaw).match(/^#\s+(.+)/m);
  let caseTitle = titleMatch ? titleMatch[1].trim() : key;

  const environment = extractSection(readmeRaw, "Environment") || extractSection(notesRaw, "Environment");
  const issueSummary = extractSection(readmeRaw, "Issue Summary") || extractSection(readmeRaw, "What's Happening");
  const whatTried = extractSection(notesRaw, "What We've Tried") || extractSection(notesRaw, "Actions Taken");
  const ruledOut = extractSection(notesRaw, "What We've Ruled Out") || extractSection(notesRaw, "Root Cause Analysis");
  const evidence = extractSection(notesRaw, "Evidence") || extractSection(notesRaw, "Logs");
  const rootCause = extractSection(notesRaw, "Likely Root Cause") || extractSection(notesRaw, "Root Cause Analysis");

  let summary = `${areaLabel && areaLabel !== "Other" ? areaLabel + " - " : ""}${caseTitle}`;
  if (summary.startsWith("Case: ")) summary = summary.replace("Case: ", "");

  const invLinksSection = extractSection(readmeRaw, "Investigation Links") || extractSection(notesRaw, "Investigation Links");
  const allLabeled = [];
  const seenUrls = new Set();
  const saRe = /support-admin\.[^/]*\.prod\.dog/i;

  if (invLinksSection) {
    for (const m of invLinksSection.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) {
      const [, label, url] = m;
      if (!seenUrls.has(url)) { seenUrls.add(url); allLabeled.push({ label: label.trim(), url: url.trim() }); }
    }
    for (const m of invLinksSection.matchAll(/-\s+\*\*([^*]+)\*\*:?\s+(https?:\/\/\S+)/g)) {
      const label = m[1].trim().replace(/:$/, "");
      const url = m[2].trim().replace(/[.,;:!?)]+$/, "");
      if (!seenUrls.has(url)) { seenUrls.add(url); allLabeled.push({ label, url }); }
    }
  }

  const allUnlabeled = [];
  for (const m of combined.matchAll(/https?:\/\/[^\s)\]>"']+/g)) {
    const url = m[0].replace(/[.,;:!?)]+$/, "");
    if (!seenUrls.has(url)) { seenUrls.add(url); allUnlabeled.push(url); }
  }

  const supportAdminLinks = [];
  const investigationLinks = [];
  const otherLinks = [];

  for (const link of allLabeled) {
    if (saRe.test(link.url)) supportAdminLinks.push(link);
    else investigationLinks.push(link);
  }
  for (const url of allUnlabeled) {
    if (saRe.test(url)) supportAdminLinks.push({ label: "Support Admin", url });
    else otherLinks.push(url);
  }

  const imageExts = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);
  const screenshots = [];
  const files = [];
  const assetsDir = path.join(caseDir, "assets");
  try {
    const entries = await fs.readdir(assetsDir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (!entry.isFile() || entry.name.startsWith(".")) continue;
      const fullPath = path.join(entry.parentPath || entry.path, entry.name);
      const stat = await fs.stat(fullPath);
      const size = stat.size;
      const sizeStr = size > 1048576 ? `${(size / 1048576).toFixed(1)} MB` : size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
      const ext = path.extname(entry.name).toLowerCase();
      const e = { name: entry.name, path: path.relative(caseDir, fullPath), url: `/api/cases/${key}/assets/${entry.name}`, size: sizeStr };
      if (imageExts.has(ext)) screenshots.push(e); else files.push(e);
    }
  } catch { /* no assets */ }

  const descParts = [`Zendesk Ticket: ${key}`];
  if (issueSummary) descParts.push(`\n--- Issue Description ---\n${issueSummary}`);
  if (environment) descParts.push(`\n--- Environment ---\n${environment}`);
  if (whatTried) descParts.push(`\n--- What We've Tried ---\n${whatTried}`);
  if (ruledOut) descParts.push(`\n--- What We've Ruled Out ---\n${ruledOut}`);
  if (rootCause) descParts.push(`\n--- Suspected Root Cause ---\n${rootCause}`);
  if (evidence) descParts.push(`\n--- Relevant Evidence ---\n${evidence.slice(0, 1500)}`);
  if (![issueSummary, whatTried, ruledOut].some(Boolean)) {
    descParts.push("\n--- Investigation Summary ---\n[Describe the issue, what you've tried, and why this needs escalation]");
  }

  let priority = (meta.priority || "").charAt(0).toUpperCase() + (meta.priority || "").slice(1) || "Medium";
  if (!["Critical", "High", "Medium", "Low"].includes(priority)) priority = "Medium";

  return {
    summary: summary.slice(0, 255),
    description: descParts.join("\n"),
    priority,
    product_area: areaLabel,
    tee_board: TEE_BOARDS[productArea] || null,
    labels: productArea !== "other" ? ["tse-escalation", `area-${productArea}`] : ["tse-escalation"],
    support_admin_links: supportAdminLinks,
    investigation_links: investigationLinks,
    other_links: otherLinks,
    screenshots,
    files,
  };
}
