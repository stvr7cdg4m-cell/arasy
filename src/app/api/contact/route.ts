import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const DESTINATION_EMAIL = process.env.CONTACT_EMAIL || "federicorm@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, website, phone, channel, goal, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos." },
        { status: 400 }
      );
    }

    console.log("📥 [NUEVA SOLICITUD DE DEMO / CONSULTORÍA]:", {
      name,
      email,
      company,
      website,
      phone,
      channel,
      goal,
      message,
      resendConfigured: !!resendApiKey,
      createdAt: new Date().toISOString(),
    });

    if (!resend) {
      console.warn("⚠️ RESEND_API_KEY no está configurada en las variables de entorno.");
    } else {
      const response = await resend.emails.send({
        from: "ARASY Consulting <onboarding@resend.dev>",
        to: [DESTINATION_EMAIL],
        subject: `🎯 Nueva Consulta E-Commerce de ${name} (${company || "Empresa"})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
            <h2 style="color: #0d1b2a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">🎯 Nueva Solicitud de Consultoría</h2>
            <p style="font-size: 14px; color: #475569;">Has recibido una nueva consulta a través del sitio web de ARASY Consulting:</p>
            
            <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px; margin-top: 16px;">
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Nombre:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${name}</td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Email del Cliente:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Empresa / Marca:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${company || "No especificado"}</td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Sitio Web / Shop:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${website || "No especificado"}</td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Teléfono / WhatsApp:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${phone || "No especificado"}</td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Canal Principal:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #2563eb;">${channel}</td></tr>
              <tr><th style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Objetivo Estratégico:</th><td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #059669;">${goal}</td></tr>
            </table>

            ${
              message
                ? `
              <div style="margin-top: 20px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #334155;">Mensaje del Cliente:</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b;">${message}</p>
              </div>
            `
                : ""
            }

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              Enviado automáticamente desde arasy.app
            </div>
          </div>
        `,
      });

      if (response.error) {
        console.error("❌ Resend API Error:", response.error);
      } else {
        console.log("✅ Email enviado con éxito vía Resend ID:", response.data?.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: "¡Solicitud recibida! Te contactaremos a la brevedad para coordinar la demo.",
    });
  } catch (error) {
    console.error("Error al procesar solicitud de contacto:", error);
    return NextResponse.json({
      success: true,
      message: "¡Solicitud recibida! Te contactaremos a la brevedad.",
    });
  }
}
