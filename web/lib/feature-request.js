import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR } from "./paths.js";
import { detectProductArea, PRODUCT_AREA_LABELS } from "./product-areas.js";

function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\n)#{1,4}\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,4}\\s|$)`, "i");
  const m = text.match(pattern);
  return m ? m[1].trim() : "";
}

async function readFileOr(filePath) {
  try { return await fs.readFile(filePath, "utf-8"); } catch { return ""; }
}

export async function buildFeatureRequestContext(key) {
  const caseDir = path.join(CASES_DIR, key);
  const readmeRaw = await readFileOr(path.join(caseDir, "README.md"));
  const notesRaw = await readFileOr(path.join(caseDir, "notes.md"));
  const frRaw = await readFileOr(path.join(caseDir, "feature-request.md"));
  const combined = readmeRaw + "\n" + notesRaw;

  let areaLabel = "";
  if (frRaw) {
    const areaM = frRaw.match(/\*\*Product Area:\*\*\s*(.+)/);
    if (areaM) areaLabel = areaM[1].trim();
  }
  if (!areaLabel) {
    const productArea = detectProductArea(combined);
    areaLabel = PRODUCT_AREA_LABELS[productArea] || "";
  }

  let frTitle = "";
  let frPainPoint = "";
  let frUserStory = "";
  let frContext = "";

  if (frRaw) {
    const titleM = frRaw.match(/^#{1,4}\s*Feature Request:\s*(.+)/m);
    if (titleM) frTitle = titleM[1].trim();
    frPainPoint = extractSection(frRaw, "Pain Point");
    frUserStory = extractSection(frRaw, "User Story");
    frContext = extractSection(frRaw, "Supporting Context");
  }

  if (!frPainPoint) {
    frPainPoint = extractSection(readmeRaw, "Issue Summary")
      || extractSection(readmeRaw, "What's Happening")
      || extractSection(notesRaw, "Problem Summary")
      || extractSection(notesRaw, "What We Know");
  }

  if (!frUserStory) {
    const comms = extractSection(notesRaw, "Customer Communications") || extractSection(notesRaw, "Key Details");
    const whatTried = extractSection(notesRaw, "What We've Tried") || extractSection(notesRaw, "Actions Taken") || extractSection(notesRaw, "Initial Assessment");
    const parts = [];
    if (comms) parts.push(comms.slice(0, 800));
    if (whatTried) parts.push(whatTried.slice(0, 800));
    frUserStory = parts.join("\n\n");
  }

  if (!frContext) {
    const evidence = extractSection(notesRaw, "Evidence") || extractSection(notesRaw, "Findings") || extractSection(notesRaw, "Similar Past Tickets");
    const internal = extractSection(notesRaw, "Internal Notes") || extractSection(notesRaw, "Investigation Log") || extractSection(notesRaw, "Slack Thread Context");
    const parts = [];
    if (evidence) parts.push(evidence.slice(0, 600));
    if (internal) parts.push(internal.slice(0, 600));
    frContext = parts.join("\n\n");
  }

  const titleMatch = (readmeRaw || notesRaw).match(/^#\s+(.+)/m);
  const caseTitle = titleMatch ? titleMatch[1].trim() : key;

  if (!frTitle) {
    const prefix = areaLabel && areaLabel !== "Other" ? `${areaLabel} - ` : "";
    frTitle = `${prefix}${caseTitle}`;
    if (frTitle.startsWith("Case: ")) frTitle = frTitle.replace("Case: ", "");
  }

  const links = [];
  const seenUrls = new Set();
  const invLinksSection = extractSection(readmeRaw, "Investigation Links") || extractSection(notesRaw, "Investigation Links");
  if (invLinksSection) {
    for (const m of invLinksSection.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) {
      if (!seenUrls.has(m[2])) { seenUrls.add(m[2]); links.push({ label: m[1].trim(), url: m[2].trim() }); }
    }
  }
  const refSection = extractSection(frRaw, "References") || extractSection(notesRaw, "References");
  if (refSection) {
    for (const m of refSection.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)) {
      if (!seenUrls.has(m[2])) { seenUrls.add(m[2]); links.push({ label: m[1].trim(), url: m[2].trim() }); }
    }
  }

  const otherLinks = [];
  for (const m of combined.matchAll(/https?:\/\/[^\s)\]>"']+/g)) {
    const url = m[0].replace(/[.,;:!?)]+$/, "");
    if (!seenUrls.has(url)) { seenUrls.add(url); otherLinks.push(url); }
  }

  return {
    title: frTitle.slice(0, 255),
    product_area: areaLabel,
    pain_point: frPainPoint,
    user_story: frUserStory,
    context: frContext,
    links,
    other_links: otherLinks,
    zendesk_ticket: key,
    has_feature_request_file: Boolean(frRaw),
  };
}
