"use client";

import Tabs from "@/components/ui/Tabs";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

export default function ProjectDetailClient({
  projectKey, title, mdFiles, meta, statusLabels, statusColors, typeLabels, typeColors,
}) {
  const readme = mdFiles["README.md"];
  const notes = mdFiles["notes.md"];
  const otherFiles = Object.entries(mdFiles).filter(
    ([k]) => !["README.md", "notes.md"].includes(k)
  );

  const tabs = [];
  if (readme) tabs.push({ id: "overview", label: "Overview", content: <MarkdownRenderer content={readme.raw} /> });
  if (notes) tabs.push({ id: "notes", label: "Notes", content: <MarkdownRenderer content={notes.raw} /> });
  for (const [fname, data] of otherFiles) {
    tabs.push({ id: fname, label: fname.replace(".md", ""), content: <MarkdownRenderer content={data.raw} /> });
  }

  return (
    <div>
      <div className="sticky top-0 z-30 bg-dd-surface/90 backdrop-blur-sm border-b border-dd-border px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/projects" className="text-sm text-dd-text-secondary hover:text-dd-purple transition-colors">
            Projects
          </Link>
          <span className="text-dd-text-secondary">/</span>
          <span className="text-sm font-medium text-dd-text truncate">{title}</span>
          <Badge color={statusColors[meta.status]}>{statusLabels[meta.status]}</Badge>
          {meta.type && typeLabels[meta.type] && (
            <Badge color={typeColors[meta.type]}>{typeLabels[meta.type]}</Badge>
          )}
          {meta.due_date && <span className="text-xs text-dd-text-secondary">Due: {meta.due_date}</span>}
        </div>
      </div>

      <div className="p-6">
        {tabs.length > 0 ? (
          <Tabs tabs={tabs} defaultTab={tabs[0].id} />
        ) : (
          <p className="text-sm text-dd-text-secondary text-center py-8">
            No content yet. Add markdown files to this project folder.
          </p>
        )}
      </div>
    </div>
  );
}
