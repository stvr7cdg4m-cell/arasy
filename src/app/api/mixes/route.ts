import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// POST /api/mixes
// Guarda un escenario de optimización del mix de productos en la base de datos local
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, weightedMargin, targetMargin, totalRevenue, totalCost, items } = body;

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del escenario es obligatorio" },
        { status: 400 }
      );
    }

    // Crear el registro de Mix
    const newMix = await prisma.mix.create({
      data: {
        name,
        weightedMargin: parseFloat(weightedMargin) || 0,
        targetMargin: parseFloat(targetMargin) || 0,
        totalRevenue: parseFloat(totalRevenue) || 0,
        totalCost: parseFloat(totalCost) || 0,
        itemsJson: JSON.stringify(items), // Guardamos los SKUs e inputs modificados
      },
    });

    return NextResponse.json({ success: true, mix: newMix }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar escenario de mix:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET /api/mixes
// Recupera todos los escenarios de mix guardados
export async function GET() {
  try {
    const mixes = await prisma.mix.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ mixes });
  } catch (error) {
    console.error("Error al obtener escenarios de mix:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud", details: errorMessage },
      { status: 500 }
    );
  }
}
