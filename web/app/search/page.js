import Link from "next/link";
import { searchFiles } from "@/lib/search";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const SECTION_COLORS = {
  cases: "purple",
  archive: "green",
  solutions: "amber",
  docs: "blue",
  templates: "teal",
};

const QUICK_SEARCHES = ["APM", "Infrastructure", "Logs", "Monitors", "Containers", "Security", "Agent"];

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const query = (sp.q || "").trim();
  const results = query ? await searchFiles(query) : [];

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Search" }]} />
      <div className="p-6 space-y-6">
        <Card>
          <div className="p-6">
            <form action="/search" method="GET" className="relative mb-4">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search across all cases, docs, templates..."
                autoFocus
                className="w-full bg-dd-surface-alt border border-dd-border rounded-xl px-4 py-3 pl-11 text-sm text-dd-text placeholder-dd-text-secondary focus:border-dd-purple focus:outline-none focus:ring-1 focus:ring-dd-purple"
              />
              <svg className="w-5 h-5 text-dd-text-secondary absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </form>

            {!query && (
              <div className="flex flex-wrap gap-2">
                {QUICK_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-dd-border text-dd-text-secondary hover:bg-dd-purple-50 hover:text-dd-purple hover:border-dd-purple-200 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>

        {query && (
          <div className="text-sm text-dd-text-secondary mb-2">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((r, i) => {
              const href = buildResultHref(r);
              return (
                <Link key={i} href={href} className="block">
                  <Card className="hover:border-dd-purple-200 transition-colors">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge color={SECTION_COLORS[r.section] || "gray"}>{r.section}</Badge>
                        <span className="text-sm font-medium text-dd-text">{r.title}</span>
                      </div>
                      <div className="text-xs text-dd-text-secondary font-mono mb-2">{r.path}</div>
                      {r.snippets.map((s, j) => (
                        <div key={j} className="text-xs text-dd-text-secondary mt-1 whitespace-pre-wrap line-clamp-3 bg-dd-surface-alt rounded p-2">
                          {s}
                        </div>
                      ))}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {query && results.length === 0 && (
          <div className="text-center text-dd-text-secondary py-12 text-sm">
            No results found for &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}

function buildResultHref(result) {
  const p = result.path;
  if (p.startsWith("cases/")) {
    const parts = p.split("/");
    return `/cases/${parts[1]}`;
  }
  if (p.startsWith("archive/")) {
    const parts = p.split("/");
    const month = parts[1];
    const key = parts[2]?.replace(".md", "");
    return `/archive/${month}/${key}`;
  }
  if (p.startsWith("docs/")) {
    return `/docs/${p.replace("docs/", "").replace(".md", "")}`;
  }
  if (p.startsWith("templates/")) {
    const parts = p.split("/");
    return `/templates/${parts[1]}/${parts[2]}`;
  }
  if (p.startsWith("solutions/")) {
    return `/solutions/${p.replace("solutions/", "")}`;
  }
  return "/";
}
