import fs from "node:fs/promises";
import path from "node:path";
import { ACCOUNTS_DIR } from "./paths.js";
import { readMdFile } from "./markdown.js";

export const ACCOUNT_VALID_STATUSES = ["active", "inactive", "onboarding"];

export const ACCOUNT_STATUS_LABELS = {
  active: "Active",
  inactive: "Inactive",
  onboarding: "Onboarding",
};

export const ACCOUNT_STATUS_COLORS = {
  active: "green",
  inactive: "gray",
  onboarding: "blue",
};

async function readAccountMeta(accountDir) {
  const metaPath = path.join(accountDir, "meta.json");
  const meta = {
    account_name: "", org_id: "", tier: "", csm: "",
    next_qbr: "", status: "active", google_sheet_id: "",
  };
  try {
    const data = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    for (const key of Object.keys(meta)) {
      if (data[key]) meta[key] = String(data[key]).trim();
    }
    if (!ACCOUNT_VALID_STATUSES.includes(meta.status)) meta.status = "active";
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

export async function getAccounts() {
  try {
    await fs.access(ACCOUNTS_DIR);
  } catch {
    return [];
  }

  const entries = await fs.readdir(ACCOUNTS_DIR, { withFileTypes: true });
  const accounts = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const accountDir = path.join(ACCOUNTS_DIR, entry.name);
    const meta = await readAccountMeta(accountDir);

    let displayName = meta.account_name || entry.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const readmePath = path.join(accountDir, "README.md");
    try {
      const content = await fs.readFile(readmePath, "utf-8");
      const heading = content.split("\n")[0].match(/^#\s+(?:Account:\s*)?(.+)/);
      if (heading) displayName = heading[1].trim();
    } catch {
      // no readme
    }

    let qbrCount = 0;
    const qbrDir = path.join(accountDir, "qbrs");
    try {
      const qbrFiles = await fs.readdir(qbrDir);
      qbrCount = qbrFiles.filter((f) => f.endsWith(".md") && !f.startsWith(".")).length;
    } catch {
      // no qbrs dir
    }

    let openTasks = 0;
    const tasksPath = path.join(accountDir, "tasks.md");
    try {
      const content = await fs.readFile(tasksPath, "utf-8");
      openTasks = (content.match(/^- \[ \]/gm) || []).length;
    } catch {
      // no tasks
    }

    const modTimes = await getModTimes(accountDir);
    const lastModified = modTimes.length > 0 ? new Date(Math.max(...modTimes)).toISOString() : null;

    accounts.push({
      key: entry.name,
      display_name: displayName,
      meta,
      qbr_count: qbrCount,
      open_tasks: openTasks,
      last_modified: lastModified,
    });
  }

  accounts.sort((a, b) => a.display_name.toLowerCase().localeCompare(b.display_name.toLowerCase()));
  return accounts;
}

export async function getAccountDetail(key) {
  const accountDir = path.join(ACCOUNTS_DIR, key);
  try {
    const stat = await fs.stat(accountDir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const allFiles = await fs.readdir(accountDir);
  const mdFileNames = allFiles.filter((f) => f.endsWith(".md")).sort();
  const mdFiles = {};

  for (const fname of mdFileNames) {
    const data = await readMdFile(path.join(accountDir, fname));
    if (data) mdFiles[fname] = data;
  }

  const meta = await readAccountMeta(accountDir);

  const qbrs = [];
  const qbrDir = path.join(accountDir, "qbrs");
  try {
    const qbrFiles = (await fs.readdir(qbrDir)).filter((f) => f.endsWith(".md") && !f.startsWith(".")).sort().reverse();
    for (const fname of qbrFiles) {
      const data = await readMdFile(path.join(qbrDir, fname));
      if (data) qbrs.push({ filename: fname, name: fname.replace(".md", ""), data });
    }
  } catch {
    // no qbrs dir
  }

  return { key, mdFiles, meta, qbrs };
}

export { readAccountMeta };
