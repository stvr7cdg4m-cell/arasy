import prisma from "@/lib/db";
import PerformanceChartWrapper from "./PerformanceChartWrapper";
import ChannelDistributionChartWrapper from "./ChannelDistributionChartWrapper";
import ChannelSyncStatusWrapper from "./ChannelSyncStatusWrapper";

// Helper de formateo local (en caso de que utils no esté creado aún)
const formatNumber = (num: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(num);
};

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage(props: PageProps) {
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

  // Rango de fechas dinámico del mes seleccionado
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // 1. Obtener Ventas MTD del mes seleccionado
  const sales = await prisma.sale.findMany({
    where: {
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      product: true,
    },
  });

  // Calcular métricas agregadas
  let totalRevenue = 0;
  let totalCost = 0;
  let mLibreSales = 0;
  let shopifySales = 0;
  let retailSales = 0;

  for (const sale of sales) {
    totalRevenue += sale.revenue;
    totalCost += sale.quantity * sale.product.cost;

    if (sale.channel === "MERCADO_LIBRE") {
      mLibreSales += sale.revenue;
    } else if (sale.channel === "SHOPIFY") {
      shopifySales += sale.revenue;
    } else {
      retailSales += sale.revenue;
    }
  }

  const channelData = [
    { name: "Mercado Libre", value: mLibreSales, color: "#FCD34D" },
    { name: "Shopify Store", value: shopifySales, color: "#10B981" },
    { name: "Retail Físico", value: retailSales, color: "#2563EB" },
  ];

  const totalProfit = totalRevenue - totalCost;
  const weightedMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  // 2. Obtener Objetivo Global del mes/año seleccionado
  const goal = await prisma.goal.findFirst({
    where: {
      month: month,
      year: year,
      category: "Global",
    },
  });

  const targetRevenue = goal?.targetRevenue || 25000000;
  const targetMargin = goal?.targetMargin || 0.35;
  const gapRemaining = Math.max(0, targetRevenue - totalRevenue);
  const progressPercent = Math.min(100, Math.round((totalRevenue / targetRevenue) * 100));

  // 3. Valorización de Stock (Fijo de stock actual en almacén)
  const products = await prisma.product.findMany();
  let totalStockCost = 0;
  let totalStockWeightedCoverage = 0;
  let totalStockQty = 0;

  for (const prod of products) {
    totalStockCost += prod.stock * prod.cost;
    totalStockWeightedCoverage += prod.coverageInDays * prod.stock;
    totalStockQty += prod.stock;
  }
  const averageCoverageDays = totalStockQty > 0 ? Math.round(totalStockWeightedCoverage / totalStockQty) : 0;

  // 4. Obtener todas las ventas del último año y consolidar por mes
  const allSales = await prisma.sale.findMany({
    include: {
      product: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const forecasts = await prisma.forecast.findMany({
    orderBy: {
      month: "asc",
    },
  });

  const goals = await prisma.goal.findMany();

  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const monthlyData: { monthName: string; revenue: number; goal: number; forecast: number; isFuture: boolean }[] = [];
  
  // Junio 2025 a Agosto 2026 (12 meses de historia + 3 meses de proyecciones)
  const startMonthIndex = 5; // Junio
  const startYear = 2025;
  
  for (let i = 0; i < 15; i++) {
    const m = (startMonthIndex + i) % 12;
    const y = startYear + Math.floor((startMonthIndex + i) / 12);
    const isFuture = y > 2026 || (y === 2026 && m > 4); // Mayo es index 4

    // Buscar objetivo mensual (Global)
    const monthGoal = goals.find((g) => g.month === m + 1 && g.year === y && g.category === "Global");
    const targetVal = monthGoal?.targetRevenue || (isFuture ? 23000000 : 20000000);

    // Buscar forecast de este mes
    const monthForecast = forecasts.find((f) => f.month === m + 1 && f.year === y && f.category === "Global");
    const forecastVal = monthForecast?.forecastedRevenue || 0;

    monthlyData.push({
      monthName: `${monthNames[m]} ${y.toString().slice(-2)}`,
      revenue: 0,
      goal: targetVal,
      forecast: forecastVal,
      isFuture,
    });
  }

  // Sumar ventas reales a los meses correspondientes
  for (const sale of allSales) {
    const date = new Date(sale.date);
    const m = date.getMonth();
    const y = date.getFullYear();
    
    const monthObj = monthlyData.find((d) => {
      const parts = d.monthName.split(" ");
      const nameMatch = parts[0] === monthNames[m];
      const yearMatch = parts[1] === y.toString().slice(-2);
      return nameMatch && yearMatch;
    });

    if (monthObj) {
      monthObj.revenue += sale.revenue;
    }
  }


  // 5. Alertas de Stock Críticas (Top 3)
  const alerts = await prisma.alert.findMany({
    where: {
      resolved: false,
    },
    take: 3,
    include: {
      product: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // 6. Oportunidades y Riesgos
  // Oportunidades: Clasificados como ANCLA y decisión EMPUJAR
  const opportunities = products
    .filter((p) => p.classification === "ANCLA" || p.decision === "EMPUJAR")
    .slice(0, 3);

  // Riesgos: Clasificados como LASTRE o decisión LIQUIDAR
  const risks = products
    .filter((p) => p.classification === "LASTRE" || p.decision === "LIQUIDAR")
    .slice(0, 3);

  return (
    <div className="p-gutter space-y-gutter">
      {/* KPI Header */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        {/* Objetivo Mensual */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-4xl text-midnight font-bold">
              track_changes
            </span>
          </div>
          <p className="font-sans text-[10px] text-slate-muted uppercase font-bold tracking-wider mb-2">
            Objetivo Mensual
          </p>
          <div className="flex items-baseline gap-1.5">
            <h2 className="font-display text-2xl font-bold text-primary-blue">
              {formatNumber(totalRevenue)}
            </h2>
            <span className="text-slate-muted text-xs font-sans">
              / {formatNumber(targetRevenue)}
            </span>
          </div>
          <div className="mt-4 w-full bg-ice rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary-blue h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-muted mt-2 font-sans font-medium">
            Progreso actual: <span className="font-bold">{progressPercent}%</span>
          </p>
        </div>

        {/* Ventas MTD */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 relative overflow-hidden group">
          <p className="font-sans text-[10px] text-slate-muted uppercase font-bold tracking-wider mb-2">
            Venta Actual MTD
          </p>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-midnight">
              {formatNumber(totalRevenue)}
            </h2>
            <span className="bg-teal-push/10 text-teal-push text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 font-sans">
              <span className="material-symbols-outlined text-[10px] font-bold">
                trending_up
              </span>{" "}
              +12%
            </span>
          </div>
          <p className="text-[9px] text-slate-muted mt-4 font-mono font-bold uppercase tracking-wider">
            Última sincronización: Hace 2 min
          </p>
        </div>

        {/* Brecha de Ingresos */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 relative overflow-hidden group">
          <p className="font-sans text-[10px] text-slate-muted uppercase font-bold tracking-wider mb-2">
            Brecha Restante (GAP)
          </p>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-coral-liquidate">
              {gapRemaining > 0 ? `-${formatNumber(gapRemaining)}` : "$0"}
            </h2>
            {gapRemaining > 0 && (
              <span className="material-symbols-outlined text-coral-liquidate text-[18px]">
                warning
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-muted mt-4 font-sans font-medium">
            Recuperación estimada: <span className="font-bold">14 días</span>
          </p>
        </div>

        {/* Margen Ponderado */}
        <div className="bg-midnight p-6 rounded-2xl card-shadow relative overflow-hidden group">
          <div className="absolute inset-0 opacity-5 bg-gradient-to-tr from-primary-blue to-transparent pointer-events-none"></div>
          <p className="font-sans text-[10px] text-ice/60 uppercase font-bold tracking-wider mb-2">
            Margen Ponderado (Mix)
          </p>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl font-bold text-white">
              {new Intl.NumberFormat("es-AR", {
                style: "percent",
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(weightedMargin)}
            </h2>
            <span
              className={`text-xs font-sans font-bold ${
                weightedMargin >= targetMargin
                  ? "text-teal-push"
                  : "text-coral-liquidate"
              }`}
            >
              {weightedMargin >= targetMargin
                ? `Objetivo Cumplido`
                : `Objetivo: ${new Intl.NumberFormat("es-AR", {
                    style: "percent",
                  }).format(targetMargin)}`}
            </span>
          </div>
          {/* Indicador visual de salud de margen */}
          <div className="mt-4 flex gap-1">
            <div className="h-1 flex-1 bg-white/10 rounded overflow-hidden">
              <div className="h-full bg-teal-push w-full"></div>
            </div>
            <div className="h-1 flex-1 bg-white/10 rounded overflow-hidden">
              <div className="h-full bg-teal-push w-full"></div>
            </div>
            <div className="h-1 flex-1 bg-white/10 rounded overflow-hidden">
              <div
                className={`h-full w-full ${
                  weightedMargin >= 0.3 ? "bg-teal-push" : "bg-gold-maintain"
                }`}
              ></div>
            </div>
            <div className="h-1 flex-1 bg-white/10 rounded overflow-hidden">
              <div
                className={`h-full w-1/2 ${
                  weightedMargin >= targetMargin ? "bg-teal-push" : "bg-transparent"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stock Overview & Visual Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Valorización de Stock */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-display text-sm font-bold text-midnight">
                Inventario Operativo
              </h3>
              <span className="material-symbols-outlined text-slate-muted text-[20px]">
                inventory_2
              </span>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-slate-muted text-xs font-sans mb-1">
                  Capital Inmovilizado (Costo)
                </p>
                <p className="font-display text-2xl font-bold text-midnight">
                  {formatNumber(totalStockCost)}
                </p>
              </div>
              <div>
                <p className="text-slate-muted text-xs font-sans mb-1">
                  Cobertura Promedio (Mix)
                </p>
                <div className="flex items-center gap-3">
                  <p className="font-display text-2xl font-bold text-midnight">
                    {averageCoverageDays} Días
                  </p>
                  <span className="bg-gold-maintain/10 text-gold-maintain text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-maintain/20 font-sans">
                    Mantener
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-muted/10">
            <button className="w-full bg-ice hover:bg-primary-blue/10 text-primary-blue text-xs font-bold py-3 rounded-xl transition-colors font-sans cursor-pointer">
              Descargar Informe de Inventario
            </button>
          </div>
        </div>

        {/* Historial Comercial de Ventas, Objetivos y Forecast */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
              <div>
                <h3 className="font-display text-sm font-bold text-midnight">
                  Control de Performance: Historial, Objetivos y Forecast
                </h3>
                <p className="text-[10px] text-slate-muted font-sans font-medium mt-0.5">
                  Análisis consolidado de 12 meses históricos y 3 meses proyectados (ARS)
                </p>
              </div>
              
              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 text-[10px] font-sans font-bold select-none pt-1 sm:pt-0">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-primary-blue rounded-full"></span>
                  <span className="text-midnight">Venta Real</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-gold-maintain/20 border border-gold-maintain rounded"></span>
                  <span className="text-midnight">Meta Mensual</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-primary-blue/10 border border-dashed border-primary-blue rounded"></span>
                  <span className="text-midnight">Forecast</span>
                </div>
              </div>
            </div>

            {/* Gráfico de Columnas Dinámico */}
            <PerformanceChartWrapper data={monthlyData} />
          </div>
          <div className="mt-4 flex justify-between items-center text-[10px] text-slate-muted border-t border-slate-muted/10 pt-4 font-sans">
            <span>DATOS DE CONTROL OPERATIVO ACTUALIZADOS EN TIEMPO REAL</span>
            <span className="text-primary-blue font-bold hover:underline cursor-pointer">
              DESCARGAR HISTORIAL COMPLETO
            </span>
          </div>
        </div>
      </section>

      {/* Sección Multi-Canal & Sincronización ERP */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Distribución de Ventas por Canal */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display text-sm font-bold text-midnight">
                Participación por Canal de Venta MTD
              </h3>
              <p className="text-[10px] text-slate-muted font-sans font-medium mt-0.5">
                Ingresos mensuales distribuidos por plataforma comercial (ARS)
              </p>
            </div>
            <span className="material-symbols-outlined text-slate-muted text-[20px]">
              donut_large
            </span>
          </div>
          <ChannelDistributionChartWrapper data={channelData} />
        </div>

        {/* Estado del Sincronizador ERP */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-sm font-bold text-midnight">
                Integraciones & ERP Sync
              </h3>
              <span className="material-symbols-outlined text-slate-muted text-[20px]">
                sync_alt
              </span>
            </div>
            <ChannelSyncStatusWrapper />
          </div>
        </div>
      </section>

      {/* Bento Grid: Sugerencias, Oportunidades y Alertas */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* 1. Oportunidades (Push) */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-teal-push text-[22px] font-bold">
              rocket_launch
            </span>
            <h3 className="font-display text-sm font-bold text-midnight">
              Oportunidades (Empujar)
            </h3>
          </div>
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="flex justify-between items-center group cursor-pointer border-b border-slate-muted/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-xs font-bold text-midnight font-sans">
                    {opp.name}
                  </p>
                  <p className="text-[10px] text-slate-muted font-sans">
                    Marca: {opp.brand} • Stock: {opp.stock} u.
                  </p>
                </div>
                <span className="bg-teal-push/10 text-teal-push text-[9px] px-2 py-1 rounded-full font-bold font-sans uppercase tracking-wider border border-teal-push/20">
                  {opp.decision}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Riesgos Detectados (Liquidar) */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-gold-maintain text-[22px] font-bold">
              history
            </span>
            <h3 className="font-display text-sm font-bold text-midnight">
              Riesgos Detectados
            </h3>
          </div>
          <div className="space-y-4">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className="flex justify-between items-center group cursor-pointer border-b border-slate-muted/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-xs font-bold text-midnight font-sans">
                    {risk.name}
                  </p>
                  <p className="text-[10px] text-slate-muted font-sans">
                    Aging: {risk.agingInDays} días • Stock: {risk.stock} u.
                  </p>
                </div>
                <span className="bg-coral-liquidate/10 text-coral-liquidate text-[9px] px-2 py-1 rounded-full font-bold font-sans uppercase tracking-wider border border-coral-liquidate/20">
                  {risk.decision}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Alertas Críticas (Control Tower) */}
        <div className="bg-white p-6 rounded-2xl card-shadow border border-coral-liquidate/20 border-l-4 border-l-coral-liquidate">
          <div className="flex items-center gap-2 mb-6 text-coral-liquidate">
            <span className="material-symbols-outlined text-[22px] font-bold">
              campaign
            </span>
            <h3 className="font-display text-sm font-bold text-midnight">
              Alertas de Operación
            </h3>
          </div>
          <div className="space-y-4">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3 bg-coral-liquidate/5 rounded-xl border border-coral-liquidate/10 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-coral-liquidate bg-coral-liquidate/10 px-2 py-0.5 rounded border border-coral-liquidate/15 font-sans">
                    {alt.type}
                  </span>
                  <span className="text-[8px] text-slate-muted font-mono font-bold">
                    MTD {selectedMonthName.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-midnight font-sans leading-relaxed">
                  {alt.message}
                </p>
                <div className="pt-1.5 flex justify-end">
                  <button className="text-[9px] font-bold text-primary-blue hover:text-primary-blue/80 transition-colors uppercase tracking-wider cursor-pointer underline underline-offset-4">
                    Gestionar Acción
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
