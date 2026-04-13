import { notFound } from "next/navigation";
import { getAccountDetail, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_COLORS } from "@/lib/accounts";
import AccountDetailClient from "@/components/accounts/AccountDetailClient";

export default async function AccountDetailPage({ params }) {
  const { key } = await params;
  const detail = await getAccountDetail(key);
  if (!detail) notFound();

  const serializedMdFiles = {};
  for (const [fname, data] of Object.entries(detail.mdFiles)) {
    serializedMdFiles[fname] = { title: data.title, raw: data.raw, path: data.path, modified: data.modified };
  }

  const serializedQbrs = detail.qbrs.map((q) => ({
    filename: q.filename,
    name: q.name,
    data: { title: q.data.title, raw: q.data.raw, path: q.data.path, modified: q.data.modified },
  }));

  return (
    <AccountDetailClient
      accountKey={key}
      mdFiles={serializedMdFiles}
      meta={detail.meta}
      qbrs={serializedQbrs}
      statusLabels={ACCOUNT_STATUS_LABELS}
      statusColors={ACCOUNT_STATUS_COLORS}
    />
  );
}
