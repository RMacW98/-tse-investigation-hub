import Link from "next/link";
import { getCases } from "@/lib/cases";
import { getArchiveMonths } from "@/lib/archive";
import { getKnownIssues } from "@/lib/solutions";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { STATUS_LABELS, STATUS_COLORS, ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS } from "@/lib/cases";
import { PRODUCT_AREA_LABELS } from "@/lib/product-areas";

export default async function DashboardPage() {
  const [cases, archiveMonths, knownIssues] = await Promise.all([
    getCases(),
    getArchiveMonths(),
    getKnownIssues(),
  ]);

  const totalArchived = archiveMonths.reduce((s, m) => s + m.count, 0);
  const kiCount = knownIssues
    ? (knownIssues.raw.match(/^###\s+/gm) || []).length
    : 0;

  const recentCases = cases.slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-dd-text">Dashboard</h1>
        <span className="text-xs text-dd-text-secondary">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Cases" value={cases.length} variant="purple" />
        <StatCard label="Archived Tickets" value={totalArchived} variant="green" />
        <StatCard label="Known Issues" value={kiCount} variant="amber" />
        <StatCard label="Archive Months" value={archiveMonths.length} variant="blue" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="col-span-2">
          <Card
            title="Recent Cases"
            action={
              <Link href="/cases" className="text-xs text-dd-purple hover:underline">
                View all
              </Link>
            }
          >
            {recentCases.length === 0 ? (
              <div className="px-5 py-8 text-center text-dd-text-secondary text-sm">
                No active cases. Start an investigation to see cases here.
              </div>
            ) : (
              <div className="divide-y divide-dd-border">
                {recentCases.map((c) => (
                  <Link
                    key={c.key}
                    href={`/cases/${c.key}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-dd-purple-50 transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${STATUS_COLORS[c.status] || "gray"}`} />
                    <span className="font-mono text-xs text-dd-text-secondary w-24 flex-shrink-0">{c.key}</span>
                    <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple">{c.title}</span>
                    <Badge color={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
                    {c.issue_type && ISSUE_TYPE_LABELS[c.issue_type] && (
                      <Badge color={ISSUE_TYPE_COLORS[c.issue_type]}>{ISSUE_TYPE_LABELS[c.issue_type]}</Badge>
                    )}
                    {c.product_area && c.product_area !== "other" && (
                      <Badge color="gray">{PRODUCT_AREA_LABELS[c.product_area]}</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: Quick Links + Archive Preview */}
        <div className="space-y-6">
          <Card title="Quick Links">
            <div className="p-4 space-y-2">
              {[
                { href: "/cases", label: "All Cases", desc: "Browse active investigations" },
                { href: "/known-issues", label: "Known Issues", desc: "Active bugs & workarounds" },
                { href: "/templates", label: "Templates", desc: "Response & escalation templates" },
                { href: "/docs", label: "Documentation", desc: "Troubleshooting guides" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-lg hover:bg-dd-purple-50 transition-colors group"
                >
                  <div className="text-sm font-medium text-dd-text group-hover:text-dd-purple">{link.label}</div>
                  <div className="text-xs text-dd-text-secondary">{link.desc}</div>
                </Link>
              ))}
            </div>
          </Card>

          <Card
            title="Archive"
            action={
              <Link href="/archive" className="text-xs text-dd-purple hover:underline">
                View all
              </Link>
            }
          >
            <div className="p-4 space-y-2">
              {archiveMonths.slice(0, 3).map((m) => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <span className="text-dd-text">{m.name}</span>
                  <Badge color="gray">{m.count} tickets</Badge>
                </div>
              ))}
              {archiveMonths.length === 0 && (
                <div className="text-sm text-dd-text-secondary">No archived tickets yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
