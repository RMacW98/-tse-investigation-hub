import fs from "node:fs/promises";
import path from "node:path";
import { PROJECTS_DIR } from "./paths.js";
import { readMdFile } from "./markdown.js";

export const PROJECT_VALID_STATUSES = ["planned", "in-progress", "completed", "cancelled"];

export const PROJECT_STATUS_LABELS = {
  planned: "Planned",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_COLORS = {
  planned: "blue",
  "in-progress": "purple",
  completed: "green",
  cancelled: "gray",
};

export const PROJECT_TYPE_LABELS = {
  presentation: "Presentation",
  documentation: "Documentation",
  tooling: "Tooling",
  other: "Other",
};

export const PROJECT_TYPE_COLORS = {
  presentation: "indigo",
  documentation: "teal",
  tooling: "amber",
  other: "gray",
};

async function readProjectMeta(projectDir) {
  const metaPath = path.join(projectDir, "meta.json");
  const meta = { type: "other", status: "planned", due_date: "", audience: "" };
  try {
    const data = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    for (const key of Object.keys(meta)) {
      if (data[key]) meta[key] = String(data[key]).trim();
    }
    if (!PROJECT_VALID_STATUSES.includes(meta.status)) meta.status = "planned";
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

export async function getProjects() {
  try {
    await fs.access(PROJECTS_DIR);
  } catch {
    return [];
  }

  const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const projectDir = path.join(PROJECTS_DIR, entry.name);
    const meta = await readProjectMeta(projectDir);

    let title = entry.name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const readmePath = path.join(projectDir, "README.md");
    try {
      const content = await fs.readFile(readmePath, "utf-8");
      const heading = content.split("\n")[0].match(/^#\s+(?:Project:\s*)?(.+)/);
      if (heading) title = heading[1].trim();
    } catch {
      // no readme
    }

    const modTimes = await getModTimes(projectDir);
    const lastModified = modTimes.length > 0 ? new Date(Math.max(...modTimes)).toISOString() : null;

    projects.push({
      key: entry.name,
      title,
      meta,
      last_modified: lastModified,
    });
  }

  projects.sort((a, b) => {
    const ta = a.last_modified ? new Date(a.last_modified).getTime() : 0;
    const tb = b.last_modified ? new Date(b.last_modified).getTime() : 0;
    return tb - ta;
  });

  return projects;
}

export async function getProjectDetail(key) {
  const projectDir = path.join(PROJECTS_DIR, key);
  try {
    const stat = await fs.stat(projectDir);
    if (!stat.isDirectory()) return null;
  } catch {
    return null;
  }

  const allFiles = await fs.readdir(projectDir);
  const mdFileNames = allFiles.filter((f) => f.endsWith(".md")).sort();
  const mdFiles = {};

  for (const fname of mdFileNames) {
    const data = await readMdFile(path.join(projectDir, fname));
    if (data) mdFiles[fname] = data;
  }

  const meta = await readProjectMeta(projectDir);

  return { key, mdFiles, meta };
}

export { readProjectMeta };
