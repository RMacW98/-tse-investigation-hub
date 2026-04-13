export default function JiraStatus({ escalations }) {
  if (!escalations || escalations.length === 0) return null;

  return (
    <div className="space-y-3">
      {escalations.map((esc) => (
        <div key={esc.key} className="border border-dd-border rounded-lg p-4 bg-dd-surface">
          <div className="flex items-center justify-between mb-2">
            <a
              href={esc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-dd-purple hover:underline"
            >
              {esc.key}
            </a>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium
              ${esc.status === "Done" || esc.status === "Closed"
                ? "bg-dd-green-light text-emerald-700"
                : esc.status === "In Progress"
                  ? "bg-dd-blue-light text-dd-blue"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}>
              {esc.status}
            </span>
          </div>
          <div className="text-sm text-dd-text mb-1">{esc.summary}</div>
          {esc.assignees && esc.assignees.length > 0 && (
            <div className="text-xs text-dd-text-secondary">
              Assignees: {esc.assignees.join(", ")}
            </div>
          )}
          {esc.updated && (
            <div className="text-xs text-dd-text-secondary">Updated: {esc.updated}</div>
          )}
          {esc.last_comments && esc.last_comments.length > 0 && (
            <div className="mt-3 space-y-2">
              {esc.last_comments.map((comment, i) => (
                <div key={i} className="bg-dd-surface-alt rounded-lg p-3 text-xs">
                  <div className="font-medium text-dd-text-secondary mb-1">
                    {comment.author} &middot; {comment.date}
                  </div>
                  <div className="text-dd-text whitespace-pre-wrap">{comment.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
