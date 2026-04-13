import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR, ARCHIVE_DIR, SOLUTIONS_DIR, DOCS_DIR, TEMPLATES_DIR, ROOT } from "./paths.js";

async function walkMd(dir) {
  const results = [];
  try {
    await fs.access(dir);
  } catch {
    return results;
  }

  async function walk(d) {
    const entries = await fs.readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.name.endsWith(".md")) {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

export async function searchFiles(query, maxResults = 50) {
  const results = [];
  const queryLower = query.toLowerCase();
  const searchDirs = [CASES_DIR, ARCHIVE_DIR, SOLUTIONS_DIR, DOCS_DIR, TEMPLATES_DIR];

  for (const searchDir of searchDirs) {
    const mdFiles = await walkMd(searchDir);

    for (const mdFile of mdFiles) {
      let content;
      try {
        content = await fs.readFile(mdFile, "utf-8");
      } catch {
        continue;
      }

      if (!content.toLowerCase().includes(queryLower)) continue;

      const lines = content.split("\n");
      const snippets = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          const start = Math.max(0, i - 1);
          const end = Math.min(lines.length, i + 2);
          snippets.push(lines.slice(start, end).join("\n").trim());
          if (snippets.length >= 2) break;
        }
      }

      const titleMatch = content.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1].trim() : path.basename(mdFile, ".md");
      const rel = path.relative(ROOT, mdFile);
      const section = rel.split(path.sep)[0];
      const stat = await fs.stat(mdFile);

      results.push({
        title,
        path: rel,
        section,
        snippets,
        modified: stat.mtime.toISOString(),
      });

      if (results.length >= maxResults) return results;
    }
  }

  results.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  return results;
}
