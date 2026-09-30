import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, phone, challenge, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos." },
        { status: 400 }
      );
    }

    // In a production environment, this would send an email via Resend/SendGrid/SMTP or trigger a webhook to Slack/Telegram/CRM.
    console.log("📥 [NUEVA SOLICITUD DE DEMO / CONSULTORÍA]:", {
      name,
      email,
      company,
      phone,
      challenge,
      message,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "¡Solicitud recibida! Te contactaremos a la brevedad para coordinar la demo.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
