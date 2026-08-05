import prisma from "@/lib/db";
import { formatCurrency } from "@/lib/utils";
import ClientPlanningView from "./ClientPlanningView";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function PlanningPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = searchParams.month || currentMonthStr;

  // Parsear el período seleccionado
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10) || currentDate.getFullYear();
  const month = parseInt(monthStr, 10) || (currentDate.getMonth() + 1);

  const monthNamesSpanish = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const selectedMonthName = monthNamesSpanish[month - 1] || "Mayo";
  // 1. Obtener todos los productos y sus ventas en el rango de los 90 días anteriores
  const startOfHistory = new Date(year, month - 4, 1);
  const endOfHistory = new Date(year, month - 1, 0, 23, 59, 59);

  const products = await prisma.product.findMany({
    include: {
      alerts: true,
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

  // Helper para YYYY-MM
  const getPrecedingMonths = (y: number, m: number) => {
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, m - 1 - i, 1);
      dates.push(d.toISOString().slice(0, 7));
    }
    return dates;
  };
  const [m1, m2, m3] = getPrecedingMonths(year, month);

  const getPrecedingMonthLabels = (y: number, m: number) => {
    const labels = [];
    const monthNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, m - 1 - i, 1);
      labels.push(monthNamesShort[d.getMonth()]);
    }
    return labels;
  };
  const [m1Label, m2Label, m3Label] = getPrecedingMonthLabels(year, month);

  // 2. Obtener el Objetivo Global para el período seleccionado
  const globalGoal = await prisma.goal.findFirst({
    where: {
      category: "Global",
      month: month,
      year: year,
    },
  });
  const targetRevenue = globalGoal?.targetRevenue || 25000000;

  // 3. Mapear los datos de productos a un formato simple para el componente de cliente
  const planningItems = products.map((prod) => {
    // Calcular venta por mes en el historial de 90 días
    const monthlySales = new Map<string, number>();
    for (const sale of prod.sales) {
      const mStr = sale.date.toISOString().slice(0, 7);
      monthlySales.set(mStr, (monthlySales.get(mStr) || 0) + sale.quantity);
    }
    const q1 = monthlySales.get(m1) || 0;
    const q2 = monthlySales.get(m2) || 0;
    const q3 = monthlySales.get(m3) || 0;

    // Calcular promedio ponderado (50% M-1, 30% M-2, 20% M-3)
    // Fallback si no hay ventas: 10% del stock para tener un punto de partida
    const suggestedUnits = Math.round(q1 * 0.5 + q2 * 0.3 + q3 * 0.2) || Math.max(1, Math.round(prod.stock * 0.1));

    // Generar un insight de IA dinámico adaptado en base a los indicadores del SKU
    let aiInsight = "";
    if (prod.decision === "EMPUJAR") {
      aiInsight = `Velocidad de venta alta detectada. Se recomienda empujar la venta comercial para capitalizar la temporada. Cobertura actual crítica de ${Math.round(
        prod.coverageInDays
      )} días.`;
    } else if (prod.decision === "LIQUIDAR") {
      aiInsight = `Exceso de stock detectado (Aging: ${prod.agingInDays} días). Almacenamiento ineficiente. Se aconseja una campaña de descuento agresiva para liberar ${formatCurrency(
        prod.stock * prod.cost
      )} en capital inmovilizado.`;
    } else if (prod.decision === "EXCLUIR") {
      aiInsight = `Bajo rendimiento persistente y nula rotación de inventario. Se sugiere excluir de campañas activas de publicidad digital y reposición automática.`;
    } else {
      aiInsight = `Desempeño y velocidad de inventario estables. Cobertura de ${Math.round(
        prod.coverageInDays
      )} días en rango óptimo. Mantener estrategia de precios actual.`;
    }

    // Impacto financiero estimado
    let impactValue = 0;
    if (prod.decision === "EMPUJAR") {
      impactValue = prod.stock * (prod.price - prod.cost) * 0.4;
    } else if (prod.decision === "LIQUIDAR") {
      impactValue = prod.stock * prod.price * 0.6; // Recuperación al 60% del precio
    } else if (prod.decision === "EXCLUIR") {
      impactValue = prod.stock * prod.cost; // Ahorro en costo de almacenamiento
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
      agingInDays: prod.agingInDays,
      coverageInDays: prod.coverageInDays,
      classification: prod.classification,
      decision: prod.decision,
      aiInsight,
      impactValue,
      suggestedUnits,
      m1Sales: q1,
      m2Sales: q2,
      m3Sales: q3,
    };
  });

  // 4. Calcular métricas agregadas del panel de control de Planning de forma dinámica
  let potentialRevenue = 0;
  let pendingActionsCount = 0;
  let riskCount = 0;

  for (const item of planningItems) {
    if (item.decision === "EMPUJAR") {
      potentialRevenue += item.impactValue;
      pendingActionsCount++;
    } else if (item.decision === "LIQUIDAR") {
      riskCount++;
      pendingActionsCount++;
    } else if (item.decision === "EXCLUIR") {
      pendingActionsCount++;
    }
  }

  return (
    <div className="p-gutter space-y-gutter">
      {/* Header Contextual */}
      <section className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Módulo</span>
            <span className="text-xs font-semibold text-midnight">Planning Inteligente</span>
          </div>
          <span className="material-symbols-outlined text-slate-muted/40 text-[18px]">chevron_right</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Período</span>
            <span className="text-xs font-semibold text-primary-blue">{selectedMonthName} {year}</span>
          </div>
        </div>
        <div className="text-xs text-slate-muted font-sans font-medium">
          * Decisiones sugeridas para la optimización de inventario del período.
        </div>
      </section>

      {/* Grid de Métricas de Resumen del Planning */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Ingreso Potencial (Push)</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-display font-bold text-teal-push">+{formatCurrency(potentialRevenue)}</h3>
            <span className="text-[10px] text-teal-push font-bold bg-teal-push/10 px-1.5 py-0.5 rounded">+15.4%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Exposición a Riesgo</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-display font-bold text-midnight">
              {riskCount > 2 ? "Moderado" : "Bajo"}
            </h3>
            <span className="text-[10px] text-slate-muted font-semibold bg-ice px-1.5 py-0.5 rounded">
              {riskCount} SKUs en riesgo
            </span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-l-4 border-l-primary-blue border-y border-r border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Acciones Pendientes</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-display font-bold text-midnight">{pendingActionsCount}</h3>
            <span className="text-[10px] text-slate-muted font-semibold">Decisiones sugeridas</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Confianza de IA</p>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl font-display font-bold text-midnight">96%</h3>
            <div className="flex-1 max-w-[80px] bg-ice rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary-blue h-full" style={{ width: "96%" }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Componente Cliente Interactivo para Filtrar y Ejecutar */}
      <ClientPlanningView
        initialItems={planningItems}
        targetRevenue={targetRevenue}
        selectedMonth={selectedMonth}
        historyLabels={[m1Label, m2Label, m3Label]}
      />
    </div>
  );
}
