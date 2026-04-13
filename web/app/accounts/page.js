import { getAccounts, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from "@/lib/accounts";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Toolbar from "@/components/ui/Toolbar";
import Link from "next/link";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Accounts" }]} />
      <div className="p-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dd-text">
                {accounts.length} Account{accounts.length !== 1 ? "s" : ""}
              </h2>
            </div>

            {accounts.length === 0 ? (
              <p className="text-sm text-dd-text-secondary py-8 text-center">
                No accounts yet. Create account folders in <code className="text-dd-purple">accounts/</code> by copying the template.
              </p>
            ) : (
              <div className="divide-y divide-dd-border">
                {accounts.map((a) => (
                  <Link
                    key={a.key}
                    href={`/accounts/${a.key}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-dd-purple-50 transition-colors group"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${ACCOUNT_STATUS_COLORS[a.meta.status] || "gray"}`} />
                    <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple font-medium">
                      {a.display_name}
                    </span>
                    {a.meta.tier && (
                      <span className="text-xs text-dd-text-secondary">{a.meta.tier}</span>
                    )}
                    {a.open_tasks > 0 && (
                      <Badge color="amber">{a.open_tasks} task{a.open_tasks !== 1 ? "s" : ""}</Badge>
                    )}
                    <Badge color={ACCOUNT_STATUS_COLORS[a.meta.status]}>
                      {ACCOUNT_STATUS_LABELS[a.meta.status]}
                    </Badge>
                    {a.qbr_count > 0 && (
                      <span className="text-xs text-dd-text-secondary">
                        {a.qbr_count} QBR{a.qbr_count !== 1 ? "s" : ""}
                      </span>
                    )}
                    {a.last_modified && (
                      <span className="text-xs text-dd-text-secondary w-16 text-right flex-shrink-0">
                        {new Date(a.last_modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
