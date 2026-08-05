import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, decision, quantity } = body;

    if (!productId || !decision || quantity === undefined) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (productId, decision, quantity)" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 0) {
      return NextResponse.json(
        { error: "La cantidad especificada debe ser un número entero no negativo" },
        { status: 400 }
      );
    }

    // Ejecutar operaciones en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener producto actual
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Producto con ID ${productId} no encontrado`);
      }

      let updatedStock = product.stock;
      let newDecision = product.decision;

      // 2. Aplicar lógica de inventario según decisión
      if (decision === "EMPUJAR") {
        updatedStock = product.stock + qty;
        newDecision = "MANTENER"; // Pasa a estado regular tras reabastecerse
      } else if (decision === "LIQUIDAR") {
        const sellOff = Math.min(product.stock, qty);
        updatedStock = product.stock - sellOff;
        newDecision = "MANTENER"; // Aliviar el sobrestock

        // Crear registro de Venta para que impacte la facturación en el Dashboard
        if (sellOff > 0) {
          await tx.sale.create({
            data: {
              productId: product.id,
              date: new Date(),
              quantity: sellOff,
              revenue: sellOff * product.price,
              channel: "MERCADO_LIBRE", // Canal por defecto de simulación
            },
          });
        }
      } else if (decision === "EXCLUIR") {
        newDecision = "EXCLUIDO";
      }

      // Calcular nueva cobertura diaria estimada (aproximada basada en velocidad de stock)
      const dailyVelocity = Math.max(1, Math.round(product.stock * 0.05)) / 30; // run-rate aprox
      const newCoverageDays = dailyVelocity > 0 ? updatedStock / dailyVelocity : 0;

      // 3. Actualizar el producto en base de datos
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: updatedStock,
          decision: newDecision,
          coverageInDays: newCoverageDays,
        },
      });

      // 4. Marcar todas las alertas no resueltas de este producto como resueltas
      const alertsUpdate = await tx.alert.updateMany({
        where: {
          productId: productId,
          resolved: false,
        },
        data: {
          resolved: true,
        },
      });

      return {
        product: updatedProduct,
        alertsResolved: alertsUpdate.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Decisión ejecutada y persistida en base de datos con éxito.",
      data: result,
    });
  } catch (error) {
    console.error("Error al ejecutar decisión de planning:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
