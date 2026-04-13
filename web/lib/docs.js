import fs from "node:fs/promises";
import path from "node:path";
import { DOCS_DIR, ROOT } from "./paths.js";
import { readMdFile } from "./markdown.js";

export async function getDocsTree(baseDir = DOCS_DIR) {
  try {
    await fs.access(baseDir);
  } catch {
    return [];
  }

  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const tree = [];

  for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    if (entry.isDirectory()) {
      const children = await getDocsTree(path.join(baseDir, entry.name));
      if (children.length > 0) {
        tree.push({ type: "dir", name: entry.name, children });
      }
    } else if (entry.name.endsWith(".md")) {
      tree.push({
        type: "file",
        name: path.basename(entry.name, ".md"),
        path: path.relative(ROOT, path.join(baseDir, entry.name)),
      });
    }
  }

  return tree;
}

export async function getDoc(filepath) {
  let docPath = path.join(DOCS_DIR, filepath);
  if (!path.extname(docPath)) docPath += ".md";
  return readMdFile(docPath);
}

export async function getDocCount() {
  try {
    await fs.access(DOCS_DIR);
  } catch {
    return 0;
  }

  let count = 0;
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith(".md")) {
        count++;
      }
    }
  }
  await walk(DOCS_DIR);
  return count;
}
