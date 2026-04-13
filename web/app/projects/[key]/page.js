import { notFound } from "next/navigation";
import { getProjectDetail, PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, PROJECT_TYPE_LABELS, PROJECT_TYPE_COLORS } from "@/lib/projects";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";

export default async function ProjectDetailPage({ params }) {
  const { key } = await params;
  const detail = await getProjectDetail(key);
  if (!detail) notFound();

  const serializedMdFiles = {};
  for (const [fname, data] of Object.entries(detail.mdFiles)) {
    serializedMdFiles[fname] = { title: data.title, raw: data.raw, path: data.path, modified: data.modified };
  }

  let title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  if (serializedMdFiles["README.md"]) {
    const heading = serializedMdFiles["README.md"].raw.match(/^#\s+(?:Project:\s*)?(.+)/m);
    if (heading) title = heading[1].trim();
  }

  return (
    <ProjectDetailClient
      projectKey={key}
      title={title}
      mdFiles={serializedMdFiles}
      meta={detail.meta}
      statusLabels={PROJECT_STATUS_LABELS}
      statusColors={PROJECT_STATUS_COLORS}
      typeLabels={PROJECT_TYPE_LABELS}
      typeColors={PROJECT_TYPE_COLORS}
    />
  );
}
