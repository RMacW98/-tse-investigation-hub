"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

export default function ArchiveAccordion({ months, areaLabels }) {
  const [expanded, setExpanded] = useState(new Set(months.length > 0 ? [months[0].name] : []));

  function toggle(name) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {months.map((m) => {
        const isOpen = expanded.has(m.name);
        return (
          <div key={m.name} className="border border-dd-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(m.name)}
              className="w-full flex items-center justify-between px-4 py-3 bg-dd-surface-alt hover:bg-dd-purple-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-dd-text-secondary transition-transform ${isOpen ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-sm font-medium text-dd-text">{m.name}</span>
              </div>
              <Badge color="gray">{m.count} ticket{m.count !== 1 ? "s" : ""}</Badge>
            </button>
            {isOpen && (
              <div className="border-t border-dd-border divide-y divide-dd-border">
                {m.tickets.map((t) => (
                  <Link
                    key={t.key}
                    href={`/archive/${m.name}/${t.key}`}
                    className="flex items-center gap-3 px-5 py-2.5 hover:bg-dd-purple-50 transition-colors"
                  >
                    <span className="font-mono text-xs text-dd-text-secondary w-28 flex-shrink-0">{t.key}</span>
                    <span className="text-sm text-dd-text truncate flex-1">{t.title}</span>
                    {t.product_area && t.product_area !== "other" && (
                      <Badge color="gray">{areaLabels[t.product_area] || t.product_area}</Badge>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
