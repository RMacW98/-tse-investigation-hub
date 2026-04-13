import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR, ROOT } from "./paths.js";
import { readMdFile } from "./markdown.js";
import { detectProductArea } from "./product-areas.js";

export const VALID_STATUSES = [
  "new", "investigating", "waiting-on-customer", "escalated", "resolved",
];

export const STATUS_LABELS = {
  new: "New",
  investigating: "Investigating",
  "waiting-on-customer": "Waiting on Customer",
  escalated: "Escalated",
  resolved: "Resolved",
};

export const STATUS_COLORS = {
  new: "purple",
  investigating: "blue",
  "waiting-on-customer": "amber",
  escalated: "red",
  resolved: "green",
};

export const ISSUE_TYPE_LABELS = {
  "billing-question": "Billing Question",
  "billing-bug": "Billing Bug",
  "technical-question": "Technical Question",
  "technical-bug": "Technical Bug",
  "configuration-troubleshooting": "Config Troubleshooting",
  "feature-request": "Feature Request",
  incident: "Incident",
};

export const ISSUE_TYPE_COLORS = {
  "billing-question": "sky",
  "billing-bug": "rose",
  "technical-question": "indigo",
  "technical-bug": "red",
  "configuration-troubleshooting": "amber",
  "feature-request": "teal",
  incident: "fuchsia",
};

async function readMeta(caseDir) {
  const metaPath = path.join(caseDir, "meta.json");
  const meta = { status: "new", assignee: "", priority: "", issue_type: "" };
  try {
    const data = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    if (VALID_STATUSES.includes(data.status)) meta.status = data.status;
    if (data.assignee) meta.assignee = String(data.assignee).trim();
    if (data.priority) meta.priority = String(data.priority).trim();
    if (data.issue_type) meta.issue_type = String(data.issue_type).trim();
  } catch {
    // meta.json missing or invalid
  }
  return meta;
}

async function getModTimes(dir) {
  const times = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = path.join(entry.parentPath || entry.path, entry.name);
        const stat = await fs.stat(fullPath);
        times.push(stat.mtimeMs);
      }
    }
  } catch {
    // ignore
  }
  return times;
}

export async function getCases() {
  try {
    await fs.access(CASES_DIR);
  } catch {
    return [];
  }

  const entries = await fs.readdir(CASES_DIR, { withFileTypes: true });
  const cases = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const caseDir = path.join(CASES_DIR, entry.name);
    const caseKey = entry.name;
    const notesPath = path.join(caseDir, "notes.md");
    const readmePath = path.join(caseDir, "README.md");

    let title = caseKey;
    for (const checkPath of [readmePath, notesPath]) {
      try {
        const content = await fs.readFile(checkPath, "utf-8");
        const heading = content.split("\n")[0].match(/^#\s+(.+)/);
        if (heading) {
          title = heading[1].trim();
          break;
        }
      } catch {
        // file doesn't exist
      }
    }

    const meta = await readMeta(caseDir);

    const mdFiles = (await fs.readdir(caseDir))
      .filter((f) => f.endsWith(".md"))
      .sort();

    const modTimes = await getModTimes(caseDir);
    const lastModified = modTimes.length > 0
      ? new Date(Math.max(...modTimes)).toISOString()
      : null;

    let areaText = title;
    for (const p of [notesPath, readmePath]) {
      try {
        const content = await fs.readFile(p, "utf-8");
        areaText += " " + content.slice(0, 2000);
      } catch {
        // file doesn't exist
      }
    }

    const hasNotes = mdFiles.includes("notes.md");
    const hasReadme = mdFiles.includes("README.md");
    const hasResponse = mdFiles.includes("response.md");

    cases.push({
      key: caseKey,
      title,
      has_notes: hasNotes,
      has_readme: hasReadme,
      has_response: hasResponse,
      files: mdFiles,
      file_count: mdFiles.length,
      last_modified: lastModified,
      status: meta.status,
      assignee: meta.assignee,
      priority: meta.priority,
      product_area: detectProductArea(areaText),
      issue_type: meta.issue_type,
    });
  }

  cases.sort((a, b) => {
    const ta = a.last_modified ? new Date(a.last_modified).getTime() : 0;
    const tb = b.last_modified ? new Date(b.last_modified).getTime() : 0;
    return tb - ta;
  });

  return cases;
}

export async function getCaseDetail(key) {
  const caseDir = path.join(CASES_DIR, key);
  try {
    const stat = await fs.stat(caseDir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const allFiles = await fs.readdir(caseDir);
  const mdFileNames = allFiles.filter((f) => f.endsWith(".md")).sort();
  const mdFiles = {};

  for (const fname of mdFileNames) {
    const data = await readMdFile(path.join(caseDir, fname));
    if (data) mdFiles[fname] = data;
  }

  const assetsDir = path.join(caseDir, "assets");
  const assets = [];
  try {
    const assetEntries = await fs.readdir(assetsDir, { withFileTypes: true, recursive: true });
    for (const entry of assetEntries) {
      if (!entry.isFile() || entry.name.startsWith(".")) continue;
      const fullPath = path.join(entry.parentPath || entry.path, entry.name);
      const stat = await fs.stat(fullPath);
      const ext = path.extname(entry.name).toLowerCase();
      assets.push({
        name: entry.name,
        path: path.relative(ROOT, fullPath),
        size: stat.size,
        is_image: [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext),
      });
    }
  } catch {
    // no assets dir
  }

  const meta = await readMeta(caseDir);

  return { key, mdFiles, assets, meta };
}

export { readMeta };
