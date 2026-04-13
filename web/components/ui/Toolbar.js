import Link from "next/link";

export default function Toolbar({ breadcrumbs = [], actions }) {
  return (
    <div className="sticky top-0 z-30 bg-dd-surface/90 backdrop-blur-sm border-b border-dd-border px-5 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2 min-w-0">
            {i > 0 && <span className="text-dd-text-secondary">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="text-dd-text-secondary hover:text-dd-purple transition-colors truncate">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-dd-text truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
