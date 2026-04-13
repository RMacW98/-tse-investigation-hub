import { NextResponse } from "next/server";
import { searchFiles } from "@/lib/search";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();

  if (!query) return NextResponse.json([]);

  const results = await searchFiles(query, 20);
  return NextResponse.json(results);
}
