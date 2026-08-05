import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month: monthStr, targetRevenue } = body;

    if (!monthStr || targetRevenue === undefined) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (month, targetRevenue)" }, { status: 400 });
    }

    const [yearPart, monthPart] = monthStr.split("-");
    const year = parseInt(yearPart, 10);
    const month = parseInt(monthPart, 10);

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json({ error: "Formato de mes inválido. Debe ser YYYY-MM" }, { status: 400 });
    }

    // Actualizar el objetivo global para este mes y año en la base de datos
    const goalUpdate = await prisma.goal.updateMany({
      where: {
        category: "Global",
        month: month,
        year: year,
      },
      data: {
        targetRevenue: targetRevenue,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Plan comercial guardado. El objetivo de la dashboard fue actualizado.",
      updatedCount: goalUpdate.count,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
