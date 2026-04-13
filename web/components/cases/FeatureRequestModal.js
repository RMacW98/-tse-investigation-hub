"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import CopyButton from "@/components/ui/CopyButton";

export default function FeatureRequestModal({ caseKey, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseKey}/feature-request-context`);
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
    parts.push(`Title: ${data.title}`);
    parts.push(`Product Area: ${data.product_area}`);
    parts.push(`Zendesk Ticket: ${data.zendesk_ticket}`);
    if (data.pain_point) parts.push(`\nPain Point:\n${data.pain_point}`);
    if (data.user_story) parts.push(`\nUser Story:\n${data.user_story}`);
    if (data.context) parts.push(`\nSupporting Context:\n${data.context}`);
    if (data.links?.length) parts.push(`\nReferences:\n${data.links.map((l) => `- ${l.label}: ${l.url}`).join("\n")}`);
    return parts.join("\n");
  }

  return (
    <Modal open={open} onClose={onClose} title="Feature Request" wide>
      {loading ? (
        <div className="flex items-center justify-center py-12 text-dd-text-secondary text-sm">Loading...</div>
      ) : data ? (
        <div className="space-y-5">
          <p className="text-xs text-dd-text-secondary">
            Copy and paste into JIRA manually. Nothing is created automatically.
          </p>

          <Field label="Title" value={data.title} />
          <Field label="Product Area" value={data.product_area} />
          <Field label="Zendesk Ticket" value={data.zendesk_ticket} />

          <TextArea label="Pain Point" value={data.pain_point} />
          <TextArea label="User Story" value={data.user_story} />
          <TextArea label="Supporting Context" value={data.context} />

          {data.links?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-dd-text-secondary">References</label>
                <CopyButton text={data.links.map((l) => `${l.label}: ${l.url}`).join("\n")} label="Copy" />
              </div>
              <div className="space-y-1">
                {data.links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-dd-text-secondary">{link.label}:</span>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-dd-purple hover:underline truncate">{link.url}</a>
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
        <div className="text-center py-8 text-dd-text-secondary text-sm">Failed to load feature request context.</div>
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

function TextArea({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-dd-text-secondary">{label}</label>
        <CopyButton text={value} label="Copy" />
      </div>
      <textarea
        readOnly
        value={value}
        rows={5}
        className="w-full bg-dd-surface-alt border border-dd-border rounded-lg p-3 text-sm text-dd-text resize-y"
      />
    </div>
  );
}
