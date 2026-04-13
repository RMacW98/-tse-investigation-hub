import { notFound } from "next/navigation";
import { getSolution } from "@/lib/solutions";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";
import CopyButton from "@/components/ui/CopyButton";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";

export default async function SolutionDetailPage({ params }) {
  const { filename } = await params;
  const data = await getSolution(filename);
  if (!data) notFound();

  return (
    <div>
      <Toolbar
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/known-issues", label: "Known Issues" },
          { label: data.title },
        ]}
        actions={<CopyButton text={data.raw} label="Copy markdown" />}
      />
      <div className="p-6">
        <Card>
          <div className="px-2 py-1 border-b border-dd-border">
            <span className="text-xs text-dd-text-secondary font-mono px-3">{data.path}</span>
          </div>
          <div className="p-6">
            <MarkdownRenderer content={data.raw} />
          </div>
        </Card>
      </div>
    </div>
  );
}
