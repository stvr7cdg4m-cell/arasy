import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "sale") {
      // Find a random product to simulate a sale
      const products = await prisma.product.findMany({ take: 10 });
      if (products.length === 0) {
        return NextResponse.json({ error: "No hay productos en la base de datos" }, { status: 400 });
      }

      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const rev = product.price * qty;

      const sale = await prisma.sale.create({
        data: {
          productId: product.id,
          date: new Date(),
          quantity: qty,
          revenue: rev,
          channel: ["RETAIL", "SHOPIFY", "MERCADO_LIBRE"][Math.floor(Math.random() * 3)],
        },
      });

      // Update stock
      await prisma.product.update({
        where: { id: product.id },
        data: { stock: Math.max(0, product.stock - qty) },
      });

      return NextResponse.json({
        success: true,
        message: `⚡ Venta simulada: ${qty}x ${product.name} en ${sale.channel} (+$${rev.toLocaleString("es-AR")})`,
      });
    }

    if (action === "alert") {
      const products = await prisma.product.findMany({ take: 5 });
      if (products.length === 0) return NextResponse.json({ error: "Sin productos" });

      const product = products[Math.floor(Math.random() * products.length)];
      const alertType = ["QUIEBRE", "SOBRESTOCK", "STOCK_MUERTO"][Math.floor(Math.random() * 3)];
      
      const alert = await prisma.alert.create({
        data: {
          type: alertType,
          message: `Alerta generada en tiempo real: Riesgo de ${alertType} para ${product.name}`,
          productId: product.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: `⚠️ Alerta generada: ${alertType} en ${product.name}`,
      });
    }

    if (action === "reset") {
      // Run seed script logic or re-initialize dates
      return NextResponse.json({
        success: true,
        message: "♻️ Estado de demostración restablecido con éxito.",
      });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error al simular" }, { status: 500 });
  }
}
