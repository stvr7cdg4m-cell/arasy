import prisma from "@/lib/db";
import ClientDecisionCenter from "./ClientDecisionCenter";

export default async function DecisionCenterPage() {
  // 1. Obtener todos los productos para calcular el capital inmovilizado dinámicamente
  const products = await prisma.product.findMany({
    include: {
      alerts: true,
    },
  });

  // 2. Calcular capital a liberar (costo * stock para productos con decisión "LIQUIDAR")
  const liquidarProducts = products.filter((p) => p.decision === "LIQUIDAR");
  const capitalToLiberate = liquidarProducts.reduce((sum, p) => sum + p.stock * p.cost, 0);

  // 3. Contar alertas críticas activas
  const activeAlertsCount = products.reduce(
    (sum, p) => sum + p.alerts.filter((a) => !a.resolved).length,
    0
  );

  // 4. Calcular margen actual estimado
  let totalRev = 0;
  let totalCost = 0;
  products.forEach((p) => {
    const qty = Math.max(10, p.stock);
    totalRev += qty * p.price;
    totalCost += qty * p.cost;
  });
  const estimatedMargin = totalRev > 0 ? (totalRev - totalCost) / totalRev : 0;

  return (
    <ClientDecisionCenter
      initialCapitalToLiberate={capitalToLiberate}
      activeAlertsCount={activeAlertsCount}
      estimatedMargin={estimatedMargin}
      liquidarCount={liquidarProducts.length}
    />
  );
}
