import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { CASES_DIR } from "@/lib/paths";
import { buildEscalationContext } from "@/lib/escalation";

export async function GET(request, { params }) {
  const { key } = await params;
  const caseDir = path.join(CASES_DIR, key);

  try {
    await fs.access(caseDir);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ctx = await buildEscalationContext(key);
  return NextResponse.json(ctx);
}
