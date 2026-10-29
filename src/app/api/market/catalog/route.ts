import { NextResponse } from "next/server";
import { searchCatalogProducts } from "@/lib/mercadolibre";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;
    const onlyActive = searchParams.get("onlyActive") !== "false";

    if (!q || !q.trim()) {
      return NextResponse.json({ success: false, error: "Debes especificar un término de búsqueda (q)." }, { status: 400 });
    }

    const data = await searchCatalogProducts(q.trim(), category, limit, onlyActive);
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al buscar productos en el catálogo";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
