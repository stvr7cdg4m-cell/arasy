export interface SkuMixItem {
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  cost: number;
  price: number;
  stock: number;
  coverageInDays: number;
  targetUnits: number; // Unidades objetivo para la simulación
}

export interface MixCalculationResult {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  weightedMargin: number;
  targetRevenue: number;
  targetMargin: number;
  gapRemaining: number;
  isMarginTargetMet: boolean;
}

/**
 * Calcula las métricas financieras ponderadas del mix de productos.
 * Evalúa la regla principal de negocio: el margen objetivo se evalúa a nivel MIX, no a nivel SKU.
 */
export function calculateMixMetrics(
  items: SkuMixItem[],
  targetRevenue: number,
  targetMargin: number
): MixCalculationResult {
  let totalRevenue = 0;
  let totalCost = 0;

  for (const item of items) {
    const itemRevenue = item.targetUnits * item.price;
    const itemCost = item.targetUnits * item.cost;

    totalRevenue += itemRevenue;
    totalCost += itemCost;
  }

  const totalProfit = totalRevenue - totalCost;
  const weightedMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

  const gapRemaining = Math.max(0, targetRevenue - totalRevenue);
  const isMarginTargetMet = weightedMargin >= targetMargin;

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    weightedMargin,
    targetRevenue,
    targetMargin,
    gapRemaining,
    isMarginTargetMet,
  };
}

/**
 * Clasifica dinámicamente un producto en base a su stock, rotación y cobertura.
 * Regla de Clasificación de SKU:
 * - ANCLA: Alta rotación de stock y alta contribución.
 * - ACOMPAÑANTE: Rotación media.
 * - LASTRE: Baja rotación y/o alto aging de stock.
 */
export function evaluateSkuClassification(
  salesVolume: number,
  marginPercent: number,
  agingInDays: number
): "ANCLA" | "ACOMPAÑANTE" | "LASTRE" {
  if (salesVolume > 100 && marginPercent > 0.3) {
    return "ANCLA";
  }
  if (agingInDays > 120 || salesVolume < 10) {
    return "LASTRE";
  }
  return "ACOMPAÑANTE";
}

/**
 * Determina la decisión operativa sugerida en base a las alertas y estado financiero.
 * Decisiones:
 * - EMPUJAR: Buen margen, stock sano o bajo, potencial de crecimiento.
 * - MANTENER: Todo en orden, balanceado.
 * - LIQUIDAR: Exceso de stock (Sobrestock) o stock muerto (Aging > 120 días).
 * - EXCLUIR: Rentabilidad negativa o nula persistente, o stock obsoleto sin venta.
 */
export function suggestOperationalDecision(
  stock: number,
  coverageInDays: number,
  agingInDays: number,
  marginPercent: number
): "EMPUJAR" | "MANTENER" | "LIQUIDAR" | "EXCLUIR" {
  if (agingInDays >= 120 || (stock > 100 && coverageInDays > 120)) {
    return "LIQUIDAR";
  }
  if (stock === 0 || (marginPercent < 0.1 && agingInDays > 90)) {
    return "EXCLUIR";
  }
  if (stock < 20 && coverageInDays < 15) {
    return "EMPUJAR"; // Necesita reposición rápida o fuerza de venta si hay margen
  }
  return "MANTENER";
}
