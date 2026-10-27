import { NextResponse } from "next/server";
import { inspectMeliItem } from "@/lib/mercadolibre";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Debes ingresar una URL de Mercado Libre o un ID de producto (ej: MLA123456789)." },
        { status: 400 }
      );
    }

    const item = await inspectMeliItem(query.trim());
    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al inspeccionar publicación";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
