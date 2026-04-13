const ICON_COLORS = {
  jira: "text-blue-600",
  zendesk: "text-green-600",
  confluence: "text-blue-500",
  datadog_docs: "text-dd-purple",
  github: "text-gray-700 dark:text-gray-300",
  slack: "text-pink-600",
};

export default function SourceLinks({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <div key={source.key}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${ICON_COLORS[source.key] || "text-dd-text-secondary"}`}>
            {source.label}
          </h3>
          <div className="space-y-1">
            {source.refs.map((ref, i) => (
              <div key={i}>
                {ref.url ? (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-dd-purple hover:underline break-all"
                  >
                    {ref.display}
                  </a>
                ) : (
                  <span className="text-sm text-dd-text font-mono">{ref.display}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
