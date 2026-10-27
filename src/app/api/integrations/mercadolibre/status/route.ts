import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getValidAccessToken } from "@/lib/mercadolibre";

export async function GET() {
  try {
    const tokenData = await getValidAccessToken();

    if (!tokenData) {
      return NextResponse.json({
        connected: false,
        account: null,
      });
    }

    const { account } = tokenData;

    // Conteo de publicaciones / productos
    const productCount = await prisma.product.count();
    const salesCount = await prisma.sale.count({
      where: { channel: "MERCADO_LIBRE" },
    });

    return NextResponse.json({
      connected: true,
      account: {
        userId: account.meliUserId,
        nickname: account.nickname,
        email: account.email,
        siteId: account.siteId,
        expiresAt: account.expiresAt,
        syncedProductsCount: productCount,
        syncedSalesCount: salesCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al consultar estado de Mercado Libre";
    return NextResponse.json(
      { connected: false, error: message },
      { status: 500 }
    );
  }
}
