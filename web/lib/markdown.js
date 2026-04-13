import fs from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./paths.js";

export async function readMdFile(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  const raw = await fs.readFile(filePath, "utf-8");
  const titleMatch = raw.match(/^#\s+(.+)/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(filePath, ".md");
  const stat = await fs.stat(filePath);

  return {
    title,
    raw,
    path: path.relative(ROOT, filePath),
    modified: stat.mtime.toISOString(),
  };
}
