import path from "node:path";
import { SOLUTIONS_DIR } from "./paths.js";
import { readMdFile } from "./markdown.js";

export async function getKnownIssues() {
  return readMdFile(path.join(SOLUTIONS_DIR, "known-issues.md"));
}

export async function getSolution(filename) {
  let solPath = path.join(SOLUTIONS_DIR, filename);
  if (!path.extname(solPath)) solPath += ".md";
  return readMdFile(solPath);
}
