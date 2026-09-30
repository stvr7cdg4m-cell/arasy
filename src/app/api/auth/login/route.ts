import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    const success = await createSession(password);
    if (!success) {
      return NextResponse.json(
        { error: "Contraseña incorrecta. Acceso denegado." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  } catch (error) {
    return NextResponse.json(
      { error: "Error en el servidor de autenticación" },
      { status: 500 }
    );
  }
}
