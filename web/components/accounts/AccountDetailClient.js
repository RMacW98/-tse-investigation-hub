"use client";

import Tabs from "@/components/ui/Tabs";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default function AccountDetailClient({
  accountKey, mdFiles, meta, qbrs, statusLabels, statusColors,
}) {
  const displayName = meta.account_name || accountKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const readme = mdFiles["README.md"];
  const notes = mdFiles["notes.md"];
  const tasks = mdFiles["tasks.md"];
  const otherFiles = Object.entries(mdFiles).filter(
    ([k]) => !["README.md", "notes.md", "tasks.md"].includes(k)
  );

  const tabs = [];
  if (readme) tabs.push({ id: "overview", label: "Overview", content: <MarkdownRenderer content={readme.raw} /> });
  if (tasks) tabs.push({ id: "tasks", label: "Tasks", content: <MarkdownRenderer content={tasks.raw} /> });
  if (notes) tabs.push({ id: "notes", label: "Notes", content: <MarkdownRenderer content={notes.raw} /> });
  if (qbrs && qbrs.length > 0) {
    tabs.push({
      id: "qbrs",
      label: `QBRs (${qbrs.length})`,
      content: (
        <div className="space-y-6">
          {qbrs.map((qbr) => (
            <div key={qbr.filename} className="border-b border-dd-border pb-6 last:border-b-0 last:pb-0">
              <MarkdownRenderer content={qbr.data.raw} />
            </div>
          ))}
        </div>
      ),
    });
  }
  for (const [fname, data] of otherFiles) {
    tabs.push({ id: fname, label: fname.replace(".md", ""), content: <MarkdownRenderer content={data.raw} /> });
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dd-surface/90 backdrop-blur-sm border-b border-dd-border px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/accounts" className="text-sm text-dd-text-secondary hover:text-dd-purple transition-colors">
            Accounts
          </Link>
          <span className="text-dd-text-secondary">/</span>
          <span className="text-sm font-medium text-dd-text truncate">{displayName}</span>
          <Badge color={statusColors[meta.status]}>{statusLabels[meta.status]}</Badge>
          {meta.tier && <span className="text-xs text-dd-text-secondary">{meta.tier}</span>}
          {meta.org_id && <span className="text-xs text-dd-text-secondary">Org: {meta.org_id}</span>}
        </div>
      </div>

      <div className="p-6">
        {tabs.length > 0 ? (
          <Tabs tabs={tabs} defaultTab={tabs[0].id} />
        ) : (
          <p className="text-sm text-dd-text-secondary text-center py-8">
            No content yet. Add markdown files to this account folder.
          </p>
        )}
      </div>
    </div>
  );
}
