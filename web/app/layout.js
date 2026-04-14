import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { getCases } from "@/lib/cases";
import { getArchiveMonths } from "@/lib/archive";
import { getDocCount } from "@/lib/docs";
import { getAccounts } from "@/lib/accounts";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "PSE Hub",
  description: "PSE Investigation Hub - Customer Support Dashboard",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }) {
  const [cases, archiveMonths, docCount, accounts, projects] = await Promise.all([
    getCases(),
    getArchiveMonths(),
    getDocCount(),
    getAccounts(),
    getProjects(),
  ]);

  const counts = {
    cases: cases.length,
    archive: archiveMonths.reduce((sum, m) => sum + m.count, 0),
    docs: docCount,
    accounts: accounts.length,
    projects: projects.length,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('tse-theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen">
        <Sidebar counts={counts} />
        <main className="ml-56 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
