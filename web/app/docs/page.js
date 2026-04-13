import Link from "next/link";
import { getDocsTree } from "@/lib/docs";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";

function DocTree({ tree, depth = 0 }) {
  return (
    <div className={depth > 0 ? "ml-4" : ""}>
      {tree.map((item) => {
        if (item.type === "dir") {
          return (
            <div key={item.name} className="mb-2">
              <div className="flex items-center gap-2 py-1.5 text-sm font-medium text-dd-text">
                <svg className="w-4 h-4 text-dd-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                {item.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <DocTree tree={item.children} depth={depth + 1} />
            </div>
          );
        }
        const filePath = item.path.replace(/^docs\//, "").replace(/\.md$/, "");
        return (
          <Link
            key={item.path}
            href={`/docs/${filePath}`}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-dd-text-secondary hover:text-dd-purple hover:bg-dd-purple-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {item.name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Link>
        );
      })}
    </div>
  );
}

export default async function DocsPage() {
  const tree = await getDocsTree();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Documentation" }]} />
      <div className="p-6">
        <Card title="Documentation">
          <div className="p-5">
            {tree.length > 0 ? (
              <DocTree tree={tree} />
            ) : (
              <div className="text-center text-dd-text-secondary py-12 text-sm">
                No documentation files found. Add <code>.md</code> files to the <code>docs/</code> directory.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
