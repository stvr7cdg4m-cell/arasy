/**
 * Business Logic: Sales Analytics
 * Contiene utilidades para el análisis de velocidad de venta, cálculo de run-rate ponderado de 90 días,
 * cobertura del stock actual y diagnóstico de vendibilidad (stock realizable vs. inmovilizado).
 */

export interface SalesHistoryItem {
  quantity: number;
  date: Date;
}

export class SalesAnalytics {
  /**
   * Calcula la velocidad de venta mensual ponderada de los últimos 90 días.
   * Regla de negocio:
   * - Mes anterior (M-1): 50%
   * - Hace 2 meses (M-2): 30%
   * - Hace 3 meses (M-3): 20%
   *
   * @param sales Historial de ventas del producto de los últimos 90 días
   * @param m1 Código YYYY-MM del mes M-1
   * @param m2 Código YYYY-MM del mes M-2
   * @param m3 Código YYYY-MM del mes M-3
   */
  public static calculateWeightedVelocity(
    sales: SalesHistoryItem[],
    m1: string,
    m2: string,
    m3: string
  ): number {
    const monthlySales = new Map<string, number>();

    for (const sale of sales) {
      const mStr = sale.date.toISOString().slice(0, 7);
      monthlySales.set(mStr, (monthlySales.get(mStr) || 0) + sale.quantity);
    }

    const q1 = monthlySales.get(m1) || 0;
    const q2 = monthlySales.get(m2) || 0;
    const q3 = monthlySales.get(m3) || 0;

    // Fórmula ponderada
    const weighted = q1 * 0.5 + q2 * 0.3 + q3 * 0.2;
    return weighted;
  }

  /**
   * Diagnostica la vendibilidad del stock en base a una cobertura estándar de 1.5 meses.
   *
   * @param stock Stock físico actual
   * @param monthlyVelocity Velocidad de venta mensual calculada (run-rate)
   * @param standardCoverageMonths Cobertura de venta objetivo (ej. 1.5 meses)
   */
  public static diagnoseStockVendibility(
    stock: number,
    monthlyVelocity: number,
    standardCoverageMonths: number = 1.5
  ): {
    vendibleUnits: number;
    overstockUnits: number;
    coverageMonths: number;
    status: "CRITICO" | "SALUDABLE" | "EXCESO";
  } {
    // Si la velocidad es 0, no hay rotación
    if (monthlyVelocity <= 0) {
      return {
        vendibleUnits: 0,
        overstockUnits: stock,
        coverageMonths: stock > 0 ? 999 : 0,
        status: stock > 0 ? "EXCESO" : "SALUDABLE",
      };
    }

    // Cobertura real en meses
    const coverageMonths = stock / monthlyVelocity;

    // Unidades que se estima vender bajo el período de cobertura objetivo (ej. 1.5 meses)
    const targetRealizableUnits = monthlyVelocity * standardCoverageMonths;
    const vendibleUnits = Math.min(stock, Math.round(targetRealizableUnits));
    const overstockUnits = Math.max(0, stock - vendibleUnits);

    let status: "CRITICO" | "SALUDABLE" | "EXCESO" = "SALUDABLE";
    if (coverageMonths < 0.5) {
      status = "CRITICO";
    } else if (coverageMonths > 3.0) {
      status = "EXCESO";
    }

    return {
      vendibleUnits,
      overstockUnits,
      coverageMonths,
      status,
    };
  }
}
