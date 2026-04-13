import { notFound } from "next/navigation";
import { getArchiveTicket } from "@/lib/archive";
import { PRODUCT_AREA_LABELS } from "@/lib/product-areas";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import CopyButton from "@/components/ui/CopyButton";
import MarkdownRenderer from "@/components/markdown/MarkdownRenderer";

export default async function ArchiveTicketPage({ params }) {
  const { month, ticket } = await params;
  const data = await getArchiveTicket(month, ticket);
  if (!data) notFound();

  const areaLabel = PRODUCT_AREA_LABELS[data.product_area] || data.product_area;

  return (
    <div>
      <Toolbar
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/archive", label: "Archive" },
          { href: "/archive", label: month },
          { label: ticket },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {data.product_area && data.product_area !== "other" && (
              <Badge color="gray">{areaLabel}</Badge>
            )}
            <CopyButton text={data.raw} label="Copy markdown" />
          </div>
        }
      />
      <div className="p-6">
        <Card>
          <div className="p-6">
            <MarkdownRenderer content={data.raw} />
          </div>
        </Card>
      </div>
    </div>
  );
}
