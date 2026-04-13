import fs from "node:fs/promises";
import path from "node:path";
import { TEMPLATES_DIR, ROOT } from "./paths.js";
import { readMdFile } from "./markdown.js";

export async function getTemplateCategories() {
  try {
    await fs.access(TEMPLATES_DIR);
  } catch {
    return [];
  }

  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const categories = [];

  for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const subDir = path.join(TEMPLATES_DIR, entry.name);
    const files = (await fs.readdir(subDir))
      .filter((f) => f.endsWith(".md"))
      .sort();

    const fileList = files.map((f) => ({
      name: path.basename(f, ".md").replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      filename: f,
      path: path.relative(ROOT, path.join(subDir, f)),
    }));

    if (fileList.length > 0) {
      categories.push({
        name: entry.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        dir_name: entry.name,
        files: fileList,
      });
    }
  }

  return categories;
}

export async function getTemplate(category, filename) {
  let tmplPath = path.join(TEMPLATES_DIR, category, filename);
  if (!path.extname(tmplPath)) tmplPath += ".md";
  return readMdFile(tmplPath);
}
