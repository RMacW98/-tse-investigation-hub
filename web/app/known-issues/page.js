import { getKnownIssues } from "@/lib/solutions";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";

export default async function KnownIssuesPage() {
  const data = await getKnownIssues();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Known Issues" }]} />
      <div className="p-6">
        <Card>
          <div className="p-6">
            {data ? (
              <MarkdownRenderer content={data.raw} />
            ) : (
              <div className="text-center text-dd-text-secondary py-12 text-sm">
                No known issues file found. Create <code>solutions/known-issues.md</code> to get started.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
