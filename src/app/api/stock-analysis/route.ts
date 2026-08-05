import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { SalesAnalytics } from "@/lib/business-logic/sales_analytics";
import { Financials } from "@/lib/business-logic/financials";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const monthParam = searchParams.get("month") || currentMonthStr;

  // Parse YYYY-MM
  const [yearStr, monthStr] = monthParam.split("-");
  const year = parseInt(yearStr, 10) || currentDate.getFullYear();
  const month = parseInt(monthStr, 10) || (currentDate.getMonth() + 1);

  // Calculamos los 90 días anteriores
  // Ej: si es Mayo 2026, los 90 días cubren Febrero, Marzo y Abril 2026.
  const startOfHistory = new Date(year, month - 4, 1);
  const endOfHistory = new Date(year, month - 1, 0, 23, 59, 59);

  // Obtener los códigos de mes correspondientes (YYYY-MM)
  const getPrecedingMonths = (y: number, m: number) => {
    const dates = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(y, m - 1 - i, 1);
      dates.push(d.toISOString().slice(0, 7));
    }
    return dates;
  };
  const [m1, m2, m3] = getPrecedingMonths(year, month);

  try {
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
      // Calcular velocidad de venta ponderada (run-rate de los últimos 90 días)
      const rawVelocity = SalesAnalytics.calculateWeightedVelocity(
        prod.sales,
        m1,
        m2,
        m3
      );

      // Si no tiene ventas en el período, tomamos un fallback del 5% del stock
      const velocity = Math.round(rawVelocity) || Math.max(1, Math.round(prod.stock * 0.05));

      // Diagnosticar vendibilidad (cobertura estándar de 1.5 meses)
      const diagnosis = SalesAnalytics.diagnoseStockVendibility(prod.stock, velocity, 1.5);

      // Calcular costos y márgenes de Mercado Libre
      const financial = Financials.calculateNetMargin(prod.price, prod.cost, "MERCADO_LIBRE");

      // Valores monetarios
      const stockValCost = prod.stock * prod.cost;
      const stockValPrice = prod.stock * prod.price;
      const vendibleValCost = diagnosis.vendibleUnits * prod.cost;
      const vendibleValPrice = diagnosis.vendibleUnits * prod.price;
      const overstockValCost = diagnosis.overstockUnits * prod.cost;
      const overstockValPrice = diagnosis.overstockUnits * prod.price;

      // Recomendación de mitigación heurística
      let recommendation = "";
      if (diagnosis.status === "EXCESO") {
        if (prod.classification === "LASTRE") {
          recommendation = "Campaña de Liquidación Agresiva (50% de descuento) o venta en lote para liberar costo financiero de almacenamiento.";
        } else {
          recommendation = "Descuento moderado (15-20%) en Mercado Libre y pauta publicitaria en Product Ads para acelerar salida.";
        }
      } else if (diagnosis.status === "CRITICO") {
        recommendation = "Reposición urgente necesaria. Stock crítico. Sugerencia de orden de compra (PO) de " + Math.round(velocity * 2) + " unidades.";
      } else {
        recommendation = "Nivel óptimo. Mantener estrategia de precios y reponer según ventas estándar.";
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

    return NextResponse.json({
      month: monthParam,
      items: analyzedItems,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
