import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST() {
  try {
    await prisma.mercadoLibreAccount.deleteMany({});
    return NextResponse.json({
      success: true,
      message: "Cuenta de Mercado Libre desconectada exitosamente.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al desconectar la cuenta.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
