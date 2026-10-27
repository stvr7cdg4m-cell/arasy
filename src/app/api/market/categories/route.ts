import { NextResponse } from "next/server";
import { getMeliCategories } from "@/lib/mercadolibre";

export async function GET() {
  try {
    const categories = await getMeliCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener categorías";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
