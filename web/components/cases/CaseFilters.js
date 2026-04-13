"use client";

import { useState } from "react";

export default function CaseFilters({ statuses, statusLabels, statusColors, productAreas, areaLabels, children }) {
  const [activeStatus, setActiveStatus] = useState(null);
  const [activeArea, setActiveArea] = useState(null);

  function toggleStatus(s) {
    setActiveStatus(activeStatus === s ? null : s);
  }

  function toggleArea(a) {
    setActiveArea(activeArea === a ? null : a);
  }

  const filteredChildren = Array.isArray(children)
    ? children.filter((child) => {
        if (!child?.props) return true;
        const { "data-status": status, "data-area": area } = child.props;
        if (activeStatus && status !== activeStatus) return false;
        if (activeArea && area !== activeArea) return false;
        return true;
      })
    : children;

  const count = Array.isArray(filteredChildren) ? filteredChildren.length : 0;

  return (
    <div>
      {/* Status filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-dd-text-secondary font-medium">Status:</span>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => toggleStatus(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors
              ${activeStatus === s
                ? `bg-dd-${statusColors[s]} text-white border-dd-${statusColors[s]}`
                : "bg-dd-surface border-dd-border text-dd-text-secondary hover:border-dd-purple-200"
              }`}
          >
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Product area filters */}
      {productAreas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-dd-text-secondary font-medium">Area:</span>
          {productAreas.map((a) => (
            <button
              key={a}
              onClick={() => toggleArea(a)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors
                ${activeArea === a
                  ? "bg-dd-purple text-white border-dd-purple"
                  : "bg-dd-surface border-dd-border text-dd-text-secondary hover:border-dd-purple-200"
                }`}
            >
              {areaLabels[a] || a}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-dd-text-secondary mb-3">{count} case{count !== 1 ? "s" : ""}</div>

      <div className="divide-y divide-dd-border">
        {filteredChildren}
      </div>
    </div>
  );
}
