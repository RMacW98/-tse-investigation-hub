import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR } from "@/lib/paths";

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".txt": "text/plain",
  ".log": "text/plain",
  ".md": "text/markdown",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",
};

export async function GET(request, { params }) {
  const { key, filename } = await params;
  const filePath = path.join(CASES_DIR, key, "assets", filename);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
