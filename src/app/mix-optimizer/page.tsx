import prisma from "@/lib/db";
import ClientMixOptimizer from "./ClientMixOptimizer";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function MixOptimizerPage(props: PageProps) {
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

  // 1. Obtener todos los productos para la simulación
  const products = await prisma.product.findMany({
    orderBy: {
      sku: "asc",
    },
  });

  // 2. Obtener el objetivo global para el mes/año seleccionado
  const globalGoal = await prisma.goal.findFirst({
    where: {
      category: "Global",
      month: month,
      year: year,
    },
  });

  // 3. Establecer valores por defecto en caso de que no exista el objetivo en BD
  const targetRevenue = globalGoal?.targetRevenue || 25000000;
  const targetMargin = globalGoal?.targetMargin || 0.35;

  // 4. Mapear productos al formato de simulación
  const mixItems = products.map((prod) => ({
    id: prod.id,
    sku: prod.sku,
    name: prod.name,
    brand: prod.brand,
    category: prod.category,
    subCategory: prod.subCategory,
    cost: prod.cost,
    price: prod.price,
    stock: prod.stock,
    coverageInDays: prod.coverageInDays,
    // Inicializamos targetUnits con una cantidad razonable para la simulación (por ejemplo, el stock actual o el volumen de ventas proyectado)
    // El seed.ts define stock y ventas mensuales. Usaremos el stock actual como unidades objetivo iniciales para ver el mix proyectado.
    targetUnits: Math.max(2, Math.round(prod.stock * 0.08)), 
    originalCost: prod.cost,
    originalPrice: prod.price,
    originalTargetUnits: Math.max(2, Math.round(prod.stock * 0.08)),
    classification: prod.classification,
    decision: prod.decision,
    agingInDays: prod.agingInDays,
  }));

  return (
    <div className="p-gutter space-y-gutter">
      {/* Header Contextual */}
      <section className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Mapeo</span>
            <span className="text-xs font-semibold text-midnight">Mix Completo</span>
          </div>
          <span className="material-symbols-outlined text-slate-muted/40 text-[18px]">chevron_right</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Período</span>
            <span className="text-xs font-semibold text-primary-blue">{selectedMonthName} {year}</span>
          </div>
        </div>
        <div className="text-xs text-slate-muted font-sans font-medium">
          * Ajuste precios, costos y cantidades proyectadas para ver el impacto en tiempo real.
        </div>
      </section>

      {/* Componente de cliente interactivo */}
      <ClientMixOptimizer 
        initialItems={mixItems} 
        targetRevenue={targetRevenue} 
        targetMargin={targetMargin} 
      />
    </div>
  );
}
