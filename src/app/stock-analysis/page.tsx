import prisma from "@/lib/db";
import { SalesAnalytics } from "@/lib/business-logic/sales_analytics";
import { Financials } from "@/lib/business-logic/financials";
import ClientStockAnalysis from "./ClientStockAnalysis";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function StockAnalysisPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = searchParams.month || currentMonthStr;

  // Parse YYYY-MM
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10) || currentDate.getFullYear();
  const month = parseInt(monthStr, 10) || (currentDate.getMonth() + 1);

  const monthNamesSpanish = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const selectedMonthName = monthNamesSpanish[month - 1] || "Mayo";

  // Calcular rango 90 días precedentes
  const startOfHistory = new Date(year, month - 4, 1);
  const endOfHistory = new Date(year, month - 1, 0, 23, 59, 59);

  const getPrecedingMonths = (y: number, m: number) => {
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, m - 1 - i, 1);
      dates.push(d.toISOString().slice(0, 7));
    }
    return dates;
  };
  const [m1, m2, m3] = getPrecedingMonths(year, month);

  // Consultar productos y ventas del rango histórico
  const products = await prisma.product.findMany({
    include: {
      sales: {
        where: {
          date: {
            gte: startOfHistory,
            lte: endOfHistory,
          },
        },
      },
    },
  });

  const analyzedItems = products.map((prod) => {
    // Velocidad ponderada
    const rawVelocity = SalesAnalytics.calculateWeightedVelocity(
      prod.sales,
      m1,
      m2,
      m3
    );

    const velocity = Math.round(rawVelocity) || Math.max(1, Math.round(prod.stock * 0.05));

    // Vendibilidad
    const diagnosis = SalesAnalytics.diagnoseStockVendibility(prod.stock, velocity, 1.5);

    // Margen Mercado Libre
    const financial = Financials.calculateNetMargin(prod.price, prod.cost, "MERCADO_LIBRE");

    const stockValCost = prod.stock * prod.cost;
    const stockValPrice = prod.stock * prod.price;
    const vendibleValCost = diagnosis.vendibleUnits * prod.cost;
    const vendibleValPrice = diagnosis.vendibleUnits * prod.price;
    const overstockValCost = diagnosis.overstockUnits * prod.cost;
    const overstockValPrice = diagnosis.overstockUnits * prod.price;

    // Recomendación
    let recommendation = "";
    if (diagnosis.status === "EXCESO") {
      if (prod.classification === "LASTRE") {
        recommendation = "Liquidación urgente en Mercado Libre con 40%+ de descuento o combo estratégico con productos ancla.";
      } else {
        recommendation = "Campaña de descuento moderado (15-20%) apoyado con pauta digital para acelerar rotación.";
      }
    } else if (diagnosis.status === "CRITICO") {
      recommendation = "Quiebre de stock potencial. Emitir Orden de Compra de reposición por " + Math.round(velocity * 2) + " unidades.";
    } else {
      recommendation = "Mantener nivel de stock actual. Rotación en rango saludable.";
    }

    return {
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      subCategory: prod.subCategory,
      cost: prod.cost,
      price: prod.price,
      stock: prod.stock,
      velocity,
      vendibleUnits: diagnosis.vendibleUnits,
      overstockUnits: diagnosis.overstockUnits,
      coverageMonths: diagnosis.coverageMonths,
      status: diagnosis.status,
      netProfit: financial.netProfit,
      marginPercent: financial.marginPercent,
      stockValCost,
      stockValPrice,
      vendibleValCost,
      vendibleValPrice,
      overstockValCost,
      overstockValPrice,
      recommendation,
      classification: prod.classification,
    };
  });

  return (
    <div className="p-gutter space-y-gutter">
      {/* Header Contextual */}
      <section className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Módulo</span>
            <span className="text-xs font-semibold text-midnight">Análisis de Stock</span>
          </div>
          <span className="material-symbols-outlined text-slate-muted/40 text-[18px]">chevron_right</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Período</span>
            <span className="text-xs font-semibold text-primary-blue">{selectedMonthName} {year}</span>
          </div>
        </div>
        <div className="text-xs text-slate-muted font-sans font-medium">
          * Análisis de vendibilidad (cobertura proyectada en base a las ventas de los últimos 90 días).
        </div>
      </section>

      {/* Vista de Cliente */}
      <ClientStockAnalysis initialItems={analyzedItems} />
    </div>
  );
}
