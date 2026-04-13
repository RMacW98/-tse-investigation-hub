import { notFound } from "next/navigation";
import { getCases, getCaseDetail, STATUS_LABELS, STATUS_COLORS, ISSUE_TYPE_LABELS, ISSUE_TYPE_COLORS } from "@/lib/cases";
import { extractSources, extractJiraKeys, extractSupportAdminLinks } from "@/lib/sources";
import { fetchEscalations } from "@/lib/jira";
import CaseDetailClient from "@/components/cases/CaseDetailClient";

export default async function CaseDetailPage({ params }) {
  const { key } = await params;
  const detail = await getCaseDetail(key);
  if (!detail) notFound();

  const allCases = await getCases();
  const allKeys = allCases.map((c) => c.key);
  const currentIdx = allKeys.indexOf(key);
  const prevKey = currentIdx > 0 ? allKeys[currentIdx - 1] : null;
  const nextKey = currentIdx >= 0 && currentIdx < allKeys.length - 1 ? allKeys[currentIdx + 1] : null;

  let allRaw = "";
  for (const data of Object.values(detail.mdFiles)) {
    allRaw += data.raw + "\n";
  }

  const sources = extractSources(allRaw);
  const sourcesCount = sources.reduce((sum, s) => sum + s.refs.length, 0);
  const jiraKeys = extractJiraKeys(allRaw);
  const escalations = jiraKeys.length > 0 ? await fetchEscalations(jiraKeys) : [];
  const supportAdminLinks = extractSupportAdminLinks(allRaw);

  const serializedMdFiles = {};
  for (const [fname, data] of Object.entries(detail.mdFiles)) {
    serializedMdFiles[fname] = { title: data.title, raw: data.raw, path: data.path, modified: data.modified };
  }

  return (
    <CaseDetailClient
      caseKey={key}
      mdFiles={serializedMdFiles}
      assets={detail.assets}
      meta={detail.meta}
      sources={sources}
      sourcesCount={sourcesCount}
      escalations={escalations}
      supportAdminLinks={supportAdminLinks}
      statusLabels={STATUS_LABELS}
      statusColors={STATUS_COLORS}
      issueTypeLabels={ISSUE_TYPE_LABELS}
      issueTypeColors={ISSUE_TYPE_COLORS}
      prevKey={prevKey}
      nextKey={nextKey}
    />
  );
}
