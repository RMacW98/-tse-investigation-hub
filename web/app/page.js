import Link from "next/link";
import { getCases } from "@/lib/cases";
import { getArchiveMonths } from "@/lib/archive";
import { getAccounts, getAccountTasks, ACCOUNT_STATUS_COLORS, ACCOUNT_STATUS_LABELS } from "@/lib/accounts";
import { getProjects, PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, PROJECT_TYPE_COLORS } from "@/lib/projects";
import StatCard from "@/components/ui/StatCard";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { STATUS_LABELS, STATUS_COLORS, ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS } from "@/lib/cases";
import { PRODUCT_AREA_LABELS } from "@/lib/product-areas";

export default async function DashboardPage() {
  const [cases, archiveMonths, accounts, projects, accountTasks] = await Promise.all([
    getCases(),
    getArchiveMonths(),
    getAccounts(),
    getProjects(),
    getAccountTasks(),
  ]);

  const totalArchived = archiveMonths.reduce((s, m) => s + m.count, 0);
  const recentCases = cases.slice(0, 10);
  const totalOpenTasks = accountTasks.reduce((s, a) => s + a.tasks.length, 0);

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
        <StatCard label="Accounts" value={accounts.length} variant="teal" />
        <StatCard label="Projects" value={projects.length} variant="indigo" />
        <StatCard label="Archived Tickets" value={totalArchived} variant="green" />
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

        {/* Right column: Accounts, Projects */}
        <div className="space-y-6">
          <Card
            title="Accounts"
            action={
              <Link href="/accounts" className="text-xs text-dd-purple hover:underline">
                View all
              </Link>
            }
          >
            {accounts.length === 0 ? (
              <div className="px-4 py-6 text-center text-dd-text-secondary text-sm">
                No accounts yet.
              </div>
            ) : (
              <div className="divide-y divide-dd-border">
                {accounts.map((a) => (
                  <Link
                    key={a.key}
                    href={`/accounts/${a.key}`}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-dd-purple-50 transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${ACCOUNT_STATUS_COLORS[a.meta.status] || "gray"}`} />
                    <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple font-medium">
                      {a.display_name}
                    </span>
                    {a.meta.tier && (
                      <span className="text-xs text-dd-text-secondary">{a.meta.tier}</span>
                    )}
                    {a.open_tasks > 0 && (
                      <Badge color="amber">{a.open_tasks}</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Projects"
            action={
              <Link href="/projects" className="text-xs text-dd-purple hover:underline">
                View all
              </Link>
            }
          >
            {projects.length === 0 ? (
              <div className="px-4 py-6 text-center text-dd-text-secondary text-sm">
                No projects yet.
              </div>
            ) : (
              <div className="divide-y divide-dd-border">
                {projects.map((p) => (
                  <Link
                    key={p.key}
                    href={`/projects/${p.key}`}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-dd-purple-50 transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${PROJECT_STATUS_COLORS[p.meta.status] || "gray"}`} />
                    <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple font-medium">
                      {p.title}
                    </span>
                    <Badge color={PROJECT_STATUS_COLORS[p.meta.status]}>
                      {PROJECT_STATUS_LABELS[p.meta.status]}
                    </Badge>
                    {p.meta.type && PROJECT_TYPE_LABELS[p.meta.type] && (
                      <Badge color={PROJECT_TYPE_COLORS[p.meta.type]}>
                        {PROJECT_TYPE_LABELS[p.meta.type]}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* Account Tasks */}
      <Card
        title={`Account Tasks${totalOpenTasks > 0 ? ` (${totalOpenTasks})` : ""}`}
      >
        {accountTasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-dd-text-secondary text-sm">
            No open tasks across accounts.
          </div>
        ) : (
          <div className="divide-y divide-dd-border">
            {accountTasks.map((account) => (
              <div key={account.accountKey}>
                <Link
                  href={`/accounts/${account.accountKey}`}
                  className="flex items-center gap-3 px-5 py-3 bg-dd-surface-secondary hover:bg-dd-purple-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-dd-text group-hover:text-dd-purple">
                    {account.accountName}
                  </span>
                  <Badge color="amber">{account.tasks.length}</Badge>
                </Link>
                <div>
                  {account.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-5 py-2 pl-10 text-sm text-dd-text"
                    >
                      <span className="text-dd-text-secondary mt-0.5 flex-shrink-0">&#9744;</span>
                      <span>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
