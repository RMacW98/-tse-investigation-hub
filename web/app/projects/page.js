import { getProjects, PROJECT_VALID_STATUSES, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_TYPE_LABELS, PROJECT_TYPE_COLORS } from "@/lib/projects";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Toolbar from "@/components/ui/Toolbar";
import Link from "next/link";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Projects" }]} />
      <div className="p-6">
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dd-text">
                {projects.length} Project{projects.length !== 1 ? "s" : ""}
              </h2>
            </div>

            {projects.length === 0 ? (
              <p className="text-sm text-dd-text-secondary py-8 text-center">
                No projects yet. Create project folders in <code className="text-dd-purple">projects/</code> by copying the template.
              </p>
            ) : (
              <div className="divide-y divide-dd-border">
                {projects.map((p) => {
                  const modified = p.last_modified
                    ? new Date(p.last_modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "";
                  return (
                    <Link
                      key={p.key}
                      href={`/projects/${p.key}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-dd-purple-50 transition-colors group"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 bg-dd-${PROJECT_STATUS_COLORS[p.meta.status] || "gray"}`} />
                      <span className="text-sm text-dd-text truncate flex-1 group-hover:text-dd-purple font-medium">
                        {p.title}
                      </span>
                      <Badge color={PROJECT_STATUS_COLORS[p.meta.status]}>
                        {PROJECT_STATUS_LABELS[p.meta.status]}
                      </Badge>
                      {p.meta.type && PROJECT_TYPE_LABELS[p.meta.type] && (
                        <Badge color={PROJECT_TYPE_COLORS[p.meta.type]}>
                          {PROJECT_TYPE_LABELS[p.meta.type]}
                        </Badge>
                      )}
                      {p.meta.due_date && (
                        <span className="text-xs text-dd-text-secondary">Due: {p.meta.due_date}</span>
                      )}
                      <span className="text-xs text-dd-text-secondary w-16 text-right flex-shrink-0">{modified}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
