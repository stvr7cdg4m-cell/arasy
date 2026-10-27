import { NextResponse } from "next/server";
import { getMeliTrends } from "@/lib/mercadolibre";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;

    const trends = await getMeliTrends(category);
    return NextResponse.json({ success: true, trends, category: category || "MLA" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener tendencias";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
