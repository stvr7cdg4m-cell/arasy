import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/mercadolibre";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectParam = searchParams.get("redirect");
    const customRedirectUri = searchParams.get("redirect_uri") || undefined;

    const url = getAuthorizationUrl(customRedirectUri);

    if (redirectParam === "true" || redirectParam === "1") {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al generar la URL de autorización.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

