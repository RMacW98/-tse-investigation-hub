import { getArchiveMonths } from "@/lib/archive";
import { PRODUCT_AREA_LABELS } from "@/lib/product-areas";
import Toolbar from "@/components/ui/Toolbar";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ArchiveAccordion from "./ArchiveAccordion";

export default async function ArchivePage() {
  const months = await getArchiveMonths();

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Archive" }]} />
      <div className="p-6">
        <Card>
          <div className="p-5">
            {months.length === 0 ? (
              <div className="text-center text-dd-text-secondary py-12 text-sm">
                No archived tickets yet.
              </div>
            ) : (
              <ArchiveAccordion months={months} areaLabels={PRODUCT_AREA_LABELS} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
