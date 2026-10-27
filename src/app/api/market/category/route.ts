import { NextResponse } from "next/server";
import { getMeliCategoryDetail } from "@/lib/mercadolibre";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Falta el parámetro id de la categoría." }, { status: 400 });
    }

    const category = await getMeliCategoryDetail(id);
    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener detalle de la categoría";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
