import Link from "next/link";
import { getTemplateCategories } from "@/lib/templates-loader";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";

export default async function TemplatesPage() {
  const categories = await getTemplateCategories();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Templates" }]} />
      <div className="p-6">
        {categories.length === 0 ? (
          <Card>
            <div className="p-6 text-center text-dd-text-secondary text-sm">
              No templates found. Add <code>.md</code> files to <code>templates/</code> subdirectories.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {categories.map((cat) => (
              <Card key={cat.dir_name} title={cat.name}>
                <div className="divide-y divide-dd-border">
                  {cat.files.map((file) => (
                    <Link
                      key={file.filename}
                      href={`/templates/${cat.dir_name}/${file.filename}`}
                      className="flex items-center gap-2 px-5 py-3 text-sm text-dd-text hover:bg-dd-purple-50 hover:text-dd-purple transition-colors"
                    >
                      <svg className="w-4 h-4 text-dd-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      {file.name}
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
