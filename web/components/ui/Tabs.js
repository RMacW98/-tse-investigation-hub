"use client";

import { useState } from "react";

export default function Tabs({ tabs, defaultTab }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div>
      <div className="flex gap-1 border-b border-dd-border px-1 -mb-px overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
              ${active === tab.id
                ? "bg-dd-surface border border-dd-border border-b-dd-surface text-dd-purple -mb-px"
                : "text-dd-text-secondary hover:text-dd-text hover:bg-dd-surface-alt"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">
        {tabs.map((tab) => (
          <div key={tab.id} className={active === tab.id ? "block" : "hidden"}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
