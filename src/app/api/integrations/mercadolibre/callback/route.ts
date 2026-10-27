import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchSellerProfile } from "@/lib/mercadolibre";
import prisma from "@/lib/db";

/**
 * Endpoint de Callback OAuth 2.0 (Redirección automática de Mercado Libre)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = request.nextUrl.origin;

  if (error) {
    console.error("Mercado Libre OAuth Error:", error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/integrations?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/integrations?error=No_se_recibio_codigo_de_autorizacion`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchSellerProfile(tokens.accessToken);

    const expiresAt = new Date(Date.now() + (tokens.expiresIn || 21600) * 1000);

    await prisma.mercadoLibreAccount.upsert({
      where: { meliUserId: tokens.userId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        nickname: profile.nickname || null,
        email: profile.email || null,
        siteId: profile.site_id || "MLA",
        updatedAt: new Date(),
      },
      create: {
        meliUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        nickname: profile.nickname || null,
        email: profile.email || null,
        siteId: profile.site_id || "MLA",
      },
    });

    return NextResponse.redirect(
      `${baseUrl}/integrations?success=meli_connected&seller=${encodeURIComponent(profile.nickname || "Vendedor")}`
    );
  } catch (err: unknown) {
    console.error("Error al procesar callback de Mercado Libre:", err);
    const message = err instanceof Error ? err.message : "Error al autenticar con Mercado Libre";
    return NextResponse.redirect(
      `${baseUrl}/integrations?error=${encodeURIComponent(message)}`
    );
  }
}

/**
 * Endpoint para canjear el código manualmente desde la interfaz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri } = body;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "El código de autorización es obligatorio." },
        { status: 400 }
      );
    }

    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const profile = await fetchSellerProfile(tokens.accessToken);

    const expiresAt = new Date(Date.now() + (tokens.expiresIn || 21600) * 1000);

    const account = await prisma.mercadoLibreAccount.upsert({
      where: { meliUserId: tokens.userId },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        nickname: profile.nickname || null,
        email: profile.email || null,
        siteId: profile.site_id || "MLA",
        updatedAt: new Date(),
      },
      create: {
        meliUserId: tokens.userId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        nickname: profile.nickname || null,
        email: profile.email || null,
        siteId: profile.site_id || "MLA",
      },
    });

    return NextResponse.json({
      success: true,
      message: "¡Cuenta de Mercado Libre conectada exitosamente!",
      account: {
        id: account.id,
        userId: account.meliUserId,
        nickname: account.nickname,
        email: account.email,
        expiresAt: account.expiresAt,
      },
    });
  } catch (err: unknown) {
    console.error("Error en POST callback de Mercado Libre:", err);
    const message = err instanceof Error ? err.message : "Error al conectar la cuenta de Mercado Libre.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
