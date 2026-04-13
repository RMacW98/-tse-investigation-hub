"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import CopyButton from "@/components/ui/CopyButton";

export default function EscalationModal({ caseKey, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseKey}/escalation-context`);
      if (res.ok) setData(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, [caseKey]);

  useEffect(() => {
    if (open && !data) load();
  }, [open, data, load]);

  function buildCopyAll() {
    if (!data) return "";
    const parts = [];
    parts.push(`Summary: ${data.summary}`);
    parts.push(`Priority: ${data.priority}`);
    parts.push(`Product Area: ${data.product_area}`);
    if (data.tee_board) parts.push(`TEE Board: ${data.tee_board.project} (${data.tee_board.team})`);
    parts.push(`\nDescription:\n${data.description}`);
    if (data.support_admin_links?.length) {
      parts.push(`\nSupport Admin Links:\n${data.support_admin_links.map((l) => `- ${l.label}: ${l.url}`).join("\n")}`);
    }
    if (data.investigation_links?.length) {
      parts.push(`\nInvestigation Links:\n${data.investigation_links.map((l) => `- ${l.label}: ${l.url}`).join("\n")}`);
    }
    if (data.other_links?.length) {
      parts.push(`\nOther Links:\n${data.other_links.map((u) => `- ${u}`).join("\n")}`);
    }
    return parts.join("\n");
  }

  return (
    <Modal open={open} onClose={onClose} title="Prepare Escalation" wide>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-dd-text-secondary text-sm">Loading...</div>
      ) : data ? (
        <div className="space-y-5">
          <p className="text-xs text-dd-text-secondary">
            Copy and paste into JIRA manually. Nothing is created automatically.
          </p>

          <Field label="Summary" value={data.summary} />
          <Field label="Priority" value={data.priority} />
          <Field label="Product Area" value={data.product_area} />

          {data.tee_board && (
            <div className="bg-dd-purple-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-dd-text">TEE Board: {data.tee_board.project} ({data.tee_board.team})</div>
              <a href={data.tee_board.url} target="_blank" rel="noopener noreferrer" className="text-dd-purple hover:underline text-xs">{data.tee_board.url}</a>
              {data.tee_board.email && <div className="text-xs text-dd-text-secondary mt-1">{data.tee_board.email}</div>}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-dd-text-secondary">Description</label>
              <CopyButton text={data.description} label="Copy" />
            </div>
            <textarea
              readOnly
              value={data.description}
              rows={10}
              className="w-full bg-dd-surface-alt border border-dd-border rounded-lg p-3 text-sm text-dd-text font-mono resize-y"
            />
          </div>

          {data.support_admin_links?.length > 0 && (
            <LinksSection label="Support Admin Links" links={data.support_admin_links} />
          )}
          {data.investigation_links?.length > 0 && (
            <LinksSection label="Investigation Links" links={data.investigation_links} />
          )}
          {data.other_links?.length > 0 && (
            <div>
              <label className="text-xs font-medium text-dd-text-secondary mb-1 block">Other Links</label>
              <div className="space-y-1">
                {data.other_links.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-dd-purple hover:underline block truncate">{url}</a>
                ))}
              </div>
            </div>
          )}

          {data.screenshots?.length > 0 && (
            <div>
              <label className="text-xs font-medium text-dd-text-secondary mb-2 block">Screenshots</label>
              <div className="grid grid-cols-3 gap-2">
                {data.screenshots.map((s, i) => (
                  <div key={i} className="border border-dd-border rounded-lg overflow-hidden">
                    <img src={s.url} alt={s.name} className="w-full h-24 object-cover" />
                    <div className="px-2 py-1 text-xs text-dd-text-secondary truncate">{s.name} ({s.size})</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-dd-border">
            <CopyButton text={buildCopyAll()} label="Copy Everything" />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-dd-text-secondary text-sm">Failed to load escalation context.</div>
      )}
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-dd-text-secondary">{label}</label>
        <CopyButton text={value || ""} label="Copy" />
      </div>
      <input
        readOnly
        value={value || ""}
        className="w-full bg-dd-surface-alt border border-dd-border rounded-lg px-3 py-2 text-sm text-dd-text"
      />
    </div>
  );
}

function LinksSection({ label, links }) {
  const text = links.map((l) => `${l.label}: ${l.url}`).join("\n");
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-dd-text-secondary">{label}</label>
        <CopyButton text={text} label="Copy" />
      </div>
      <div className="space-y-1">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-dd-text-secondary">{link.label}:</span>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-dd-purple hover:underline truncate">{link.url}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
