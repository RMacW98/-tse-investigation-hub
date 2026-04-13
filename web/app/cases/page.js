import { getCases, VALID_STATUSES, STATUS_LABELS, STATUS_COLORS } from "@/lib/cases";
import { PRODUCT_AREA_LABELS, PRODUCT_AREA_RULES } from "@/lib/product-areas";
import Card from "@/components/ui/Card";
import CaseFilters from "@/components/cases/CaseFilters";
import CaseRow from "@/components/cases/CaseRow";
import Toolbar from "@/components/ui/Toolbar";

export default async function CasesPage() {
  const cases = await getCases();

  const seenAreas = new Set();
  const productAreas = [];
  for (const c of cases) {
    const area = c.product_area || "other";
    if (!seenAreas.has(area)) {
      seenAreas.add(area);
      productAreas.push(area);
    }
  }
  const canonicalOrder = PRODUCT_AREA_RULES.map(([key]) => key);
  productAreas.sort((a, b) => {
    if (a === "other") return 1;
    if (b === "other") return -1;
    return (canonicalOrder.indexOf(a) ?? 999) - (canonicalOrder.indexOf(b) ?? 999);
  });

  return (
    <div>
      <Toolbar breadcrumbs={[{ href: "/", label: "Dashboard" }, { label: "Cases" }]} />
      <div className="p-6">
        <Card>
          <div className="p-5">
            <CaseFilters
              statuses={VALID_STATUSES}
              statusLabels={STATUS_LABELS}
              statusColors={STATUS_COLORS}
              productAreas={productAreas}
              areaLabels={PRODUCT_AREA_LABELS}
            >
              {cases.map((c) => (
                <CaseRow key={c.key} caseData={c} data-status={c.status} data-area={c.product_area} />
              ))}
            </CaseFilters>
          </div>
        </Card>
      </div>
    </div>
  );
}
