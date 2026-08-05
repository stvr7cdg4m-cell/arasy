import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: {
        resolved: false,
      },
      include: {
        product: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error al obtener alertas operativas:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor al obtener alertas", details: errorMessage },
      { status: 500 }
    );
  }
}
