"use client";

import Tabs from "@/components/ui/Tabs";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";
import SourceLinks from "./SourceLinks";
import JiraStatus from "./JiraStatus";
import EscalationModal from "./EscalationModal";
import FeatureRequestModal from "./FeatureRequestModal";
import Badge from "@/components/ui/Badge";
import { useState } from "react";

export default function CaseDetailClient({
  caseKey, mdFiles, assets, meta, sources, sourcesCount,
  escalations, supportAdminLinks, statusLabels, statusColors,
  issueTypeLabels, issueTypeColors, prevKey, nextKey,
}) {
  const [showEscalation, setShowEscalation] = useState(false);
  const [showFeatureRequest, setShowFeatureRequest] = useState(false);

  const readme = mdFiles["README.md"];
  const notes = mdFiles["notes.md"];
  const response = mdFiles["response.md"];
  const otherFiles = Object.entries(mdFiles).filter(
    ([k]) => !["README.md", "notes.md", "response.md"].includes(k)
  );

  const tabs = [];
  if (readme) tabs.push({ id: "readme", label: "README", content: <MarkdownRenderer content={readme.raw} /> });
  if (notes) tabs.push({ id: "notes", label: "Notes", content: <MarkdownRenderer content={notes.raw} /> });
  if (response) tabs.push({ id: "response", label: "Response", content: <MarkdownRenderer content={response.raw} /> });
  for (const [fname, data] of otherFiles) {
    tabs.push({ id: fname, label: fname.replace(".md", ""), content: <MarkdownRenderer content={data.raw} /> });
  }
  if (sources && sourcesCount > 0) {
    tabs.push({
      id: "sources",
      label: `Sources (${sourcesCount})`,
      content: <SourceLinks sources={sources} />,
    });
  }
  if (assets && assets.length > 0) {
    tabs.push({
      id: "assets",
      label: `Assets (${assets.length})`,
      content: (
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => (
            <div key={asset.name} className="border border-dd-border rounded-lg p-3 bg-dd-surface-alt">
              {asset.is_image ? (
                <img
                  src={`/api/cases/${caseKey}/assets/${asset.name}`}
                  alt={asset.name}
                  className="w-full rounded-md mb-2 max-h-48 object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-dd-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <a
                    href={`/api/cases/${caseKey}/assets/${asset.name}`}
                    className="text-sm text-dd-purple hover:underline truncate"
                  >
                    {asset.name}
                  </a>
                </div>
              )}
              <div className="text-xs text-dd-text-secondary">{formatSize(asset.size)}</div>
            </div>
          ))}
        </div>
      ),
    });
  }

  return (
    <div>
      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-dd-surface/90 backdrop-blur-sm border-b border-dd-border px-5 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <a href="/" className="text-dd-text-secondary hover:text-dd-purple text-sm">Dashboard</a>
          <span className="text-dd-text-secondary">/</span>
          <a href="/cases" className="text-dd-text-secondary hover:text-dd-purple text-sm">Cases</a>
          <span className="text-dd-text-secondary">/</span>
          <span className="font-mono font-medium text-sm text-dd-text">{caseKey}</span>
          <Badge color={statusColors[meta.status]}>{statusLabels[meta.status]}</Badge>
          {meta.issue_type && issueTypeLabels[meta.issue_type] && (
            <Badge color={issueTypeColors[meta.issue_type]}>{issueTypeLabels[meta.issue_type]}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFeatureRequest(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-dd-border bg-dd-surface text-dd-text-secondary hover:bg-dd-purple-50 hover:text-dd-purple hover:border-dd-purple-200 transition-colors"
          >
            Feature Request
          </button>
          <button
            onClick={() => setShowEscalation(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-dd-purple text-white hover:bg-dd-purple-light transition-colors"
          >
            Prepare Escalation
          </button>
          <div className="flex items-center gap-1 ml-2">
            {prevKey && (
              <a href={`/cases/${prevKey}`} className="p-1 rounded text-dd-text-secondary hover:bg-dd-purple-50" title="Previous case">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              </a>
            )}
            {nextKey && (
              <a href={`/cases/${nextKey}`} className="p-1 rounded text-dd-text-secondary hover:bg-dd-purple-50" title="Next case">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* JIRA Escalation Status */}
        {escalations && escalations.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-dd-text mb-3">JIRA Escalation Status</h2>
            <JiraStatus escalations={escalations} />
          </div>
        )}

        {/* Support Admin Links */}
        {supportAdminLinks && supportAdminLinks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {supportAdminLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dd-border bg-dd-surface text-dd-purple hover:bg-dd-purple-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Tabs */}
        {tabs.length > 0 ? (
          <div className="bg-dd-surface border border-dd-border rounded-xl p-5">
            <Tabs tabs={tabs} defaultTab={tabs[0]?.id} />
          </div>
        ) : (
          <div className="text-center text-dd-text-secondary py-12 text-sm">
            No files in this case yet.
          </div>
        )}
      </div>

      {/* Modals */}
      <EscalationModal caseKey={caseKey} open={showEscalation} onClose={() => setShowEscalation(false)} />
      <FeatureRequestModal caseKey={caseKey} open={showFeatureRequest} onClose={() => setShowFeatureRequest(false)} />
    </div>
  );
}

function formatSize(bytes) {
  if (typeof bytes !== "number") return String(bytes);
  if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
