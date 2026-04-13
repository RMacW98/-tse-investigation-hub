import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { STATUS_LABELS, STATUS_COLORS, ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS } from "@/lib/cases";
import { PRODUCT_AREA_LABELS } from "@/lib/product-areas";

export default function CaseRow({ caseData }) {
  const c = caseData;
  const modified = c.last_modified
    ? new Date(c.last_modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <Link
      href={`/cases/${c.key}`}
      data-status={c.status}
      data-area={c.product_area}
      className="flex items-center gap-3 px-5 py-3 hover:bg-dd-purple-50 transition-colors group"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${STATUS_COLORS[c.status] || "gray"}`} />
      <span className="font-mono text-xs text-dd-text-secondary w-28 flex-shrink-0">{c.key}</span>
      <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple">{c.title}</span>
      {c.assignee && (
        <span className="text-xs text-dd-text-secondary truncate max-w-24">{c.assignee}</span>
      )}
      <Badge color={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Badge>
      {c.issue_type && ISSUE_TYPE_LABELS[c.issue_type] && (
        <Badge color={ISSUE_TYPE_COLORS[c.issue_type]}>{ISSUE_TYPE_LABELS[c.issue_type]}</Badge>
      )}
      {c.product_area && c.product_area !== "other" && (
        <Badge color="gray">{PRODUCT_AREA_LABELS[c.product_area]}</Badge>
      )}
      <span className="text-xs text-dd-text-secondary w-16 text-right flex-shrink-0">{modified}</span>
    </Link>
  );
}
