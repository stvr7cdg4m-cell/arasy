import { NextResponse } from "next/server";
import { syncMercadoLibreCatalogAndSales } from "@/lib/mercadolibre";

export async function POST() {
  try {
    const result = await syncMercadoLibreCatalogAndSales();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error en sincronización con Mercado Libre:", error);
    const message = error instanceof Error ? error.message : "Error al sincronizar datos con Mercado Libre.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
