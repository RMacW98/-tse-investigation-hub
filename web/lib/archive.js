import fs from "node:fs/promises";
import path from "node:path";
import { ARCHIVE_DIR, ROOT } from "./paths.js";
import { readMdFile } from "./markdown.js";
import { detectProductArea } from "./product-areas.js";

function monthSortKey(name) {
  const parts = name.split("-");
  try {
    return parseInt(parts[1]) * 100 + parseInt(parts[0]);
  } catch {
    return 0;
  }
}

export async function getArchiveMonths() {
  try {
    await fs.access(ARCHIVE_DIR);
  } catch {
    return [];
  }

  const entries = await fs.readdir(ARCHIVE_DIR, { withFileTypes: true });
  const months = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const monthDir = path.join(ARCHIVE_DIR, entry.name);
    const files = (await fs.readdir(monthDir))
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();

    const tickets = [];
    for (const fname of files) {
      const filePath = path.join(monthDir, fname);
      let title = path.basename(fname, ".md");
      let contentPreview = "";

      try {
        contentPreview = (await fs.readFile(filePath, "utf-8")).slice(0, 2000);
        for (const line of contentPreview.split("\n").slice(0, 5)) {
          const heading = line.match(/^#\s+(.+)/);
          if (heading) {
            title = heading[1].trim();
            break;
          }
        }
      } catch {
        // skip
      }

      tickets.push({
        key: path.basename(fname, ".md"),
        path: path.relative(ROOT, filePath),
        title,
        product_area: detectProductArea(contentPreview),
      });
    }

    months.push({ name: entry.name, count: tickets.length, tickets });
  }

  months.sort((a, b) => monthSortKey(b.name) - monthSortKey(a.name));
  return months;
}

export async function getArchiveTicket(month, ticketKey) {
  const ticketPath = path.join(ARCHIVE_DIR, month, `${ticketKey}.md`);
  const data = await readMdFile(ticketPath);
  if (!data) return null;

  let contentPreview = "";
  try {
    contentPreview = (await fs.readFile(ticketPath, "utf-8")).slice(0, 2000);
  } catch {
    // skip
  }

  return {
    ...data,
    product_area: detectProductArea(contentPreview),
  };
}
