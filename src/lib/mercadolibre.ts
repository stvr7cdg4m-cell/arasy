import prisma from "./db";

export interface MeliConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getMeliConfig(): MeliConfig {
  const clientId = (process.env.MERCADOLIBRE_CLIENT_ID || process.env.APP_ID || "").replace(/[\r\n\t]/g, "").trim();
  const clientSecret = (process.env.MERCADOLIBRE_CLIENT_SECRET || process.env.SECRET_KEY || "").replace(/[\r\n\t]/g, "").trim();
  const redirectUri = (process.env.MERCADOLIBRE_REDIRECT_URI || "https://arasy.app/api/integrations/mercadolibre/callback")
    .replace(/[\r\n\t]/g, "")
    .trim();

  return { clientId, clientSecret, redirectUri };
}


/**
 * Genera la URL de autorización para el flujo OAuth 2.0 (Authorization Code)
 */
export function getAuthorizationUrl(customRedirectUri?: string): string {
  const { clientId, redirectUri } = getMeliConfig();
  const redirect = customRedirectUri || redirectUri;
  return `https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirect
  )}`;
}

/**
 * Intercambia el código de autorización por access_token y refresh_token
 */
export async function exchangeCodeForTokens(code: string, customRedirectUri?: string) {
  const { clientId, clientSecret, redirectUri } = getMeliConfig();
  const redirect = customRedirectUri || redirectUri;

  if (!clientId || !clientSecret) {
    throw new Error("Faltan las credenciales APP_ID / SECRET_KEY en las variables de entorno.");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code: code.trim(),
    redirect_uri: redirect,
  });

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error_description || data.error || "Error al canjear el código en Mercado Libre.");
  }

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number, // generalmente 21600 (6 horas)
    userId: String(data.user_id),
    scope: data.scope as string,
  };
}

/**
 * Renueva el token utilizando el refresh_token
 */
export async function refreshMeliToken(accountId: string, currentRefreshToken: string) {
  const { clientId, clientSecret } = getMeliConfig();

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: currentRefreshToken,
  });

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error_description || "Error al refrescar el token de Mercado Libre.");
  }

  const expiresAt = new Date(Date.now() + (data.expires_in || 21600) * 1000);

  const updatedAccount = await prisma.mercadoLibreAccount.update({
    where: { id: accountId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    },
  });

  return updatedAccount;
}

/**
 * Obtiene un access_token válido de la base de datos (renovándolo automáticamente si está vencido)
 */
export async function getValidAccessToken() {
  const account = await prisma.mercadoLibreAccount.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    return null;
  }

  // Si vence en menos de 5 minutos, refrescar
  const isExpiringSoon = account.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpiringSoon) {
    try {
      const refreshed = await refreshMeliToken(account.id, account.refreshToken);
      return { account: refreshed, accessToken: refreshed.accessToken };
    } catch (err) {
      console.error("Error al refrescar token de ML, usando token actual:", err);
    }
  }

  return { account, accessToken: account.accessToken };
}

/**
 * Consulta el perfil del vendedor autenticado
 */
export async function fetchSellerProfile(accessToken: string) {
  const response = await fetch("https://api.mercadolibre.com/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al obtener perfil de Mercado Libre.`);
  }

  return response.json();
}

/**
 * Obtiene los IDs de publicaciones activas del vendedor
 */
export async function fetchSellerItems(sellerId: string, accessToken: string): Promise<string[]> {
  const url = `https://api.mercadolibre.com/users/${sellerId}/items/search?status=active&limit=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar publicaciones de Mercado Libre.`);
  }

  const data = await response.json();
  return (data.results as string[]) || [];
}

export interface MeliItem {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  category_id?: string;
  seller_custom_field?: string | null;
  thumbnail?: string;
  permalink?: string;
}

export interface MeliOrderItem {
  item: {
    id: string;
    title: string;
    seller_custom_field?: string | null;
  };
  quantity: number;
  unit_price: number;
}

export interface MeliOrder {
  id: number;
  date_created: string;
  order_items: MeliOrderItem[];
}

/**
 * Obtiene el detalle de una lista de publicaciones (precios, stock, títulos)
 */
export async function fetchItemsDetails(itemIds: string[], accessToken: string): Promise<MeliItem[]> {
  if (itemIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < itemIds.length; i += 20) {
    chunks.push(itemIds.slice(i, i + 20));
  }

  const allItems: MeliItem[] = [];

  for (const chunk of chunks) {
    const url = `https://api.mercadolibre.com/items?ids=${chunk.join(",")}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      for (const entry of data) {
        if (entry.code === 200 && entry.body) {
          allItems.push(entry.body as MeliItem);
        }
      }
    }
  }

  return allItems;
}

/**
 * Consulta órdenes de venta recientes del vendedor
 */
export async function fetchSellerOrders(sellerId: string, accessToken: string): Promise<MeliOrder[]> {
  const url = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.status=paid&limit=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return (data.results as MeliOrder[]) || [];
}


/**
 * Sincronización completa: importa productos y órdenes a la base de datos de Arasy
 */
export async function syncMercadoLibreCatalogAndSales() {
  const tokenData = await getValidAccessToken();
  if (!tokenData) {
    throw new Error("No hay una cuenta de Mercado Libre conectada en Arasy.");
  }

  const { account, accessToken } = tokenData;

  // 1. Obtener perfil actualizado
  const profile = await fetchSellerProfile(accessToken);
  if (profile.nickname && profile.nickname !== account.nickname) {
    await prisma.mercadoLibreAccount.update({
      where: { id: account.id },
      data: {
        nickname: profile.nickname,
        email: profile.email || account.email,
      },
    });
  }

  // 2. Obtener publicaciones y detalles
  const itemIds = await fetchSellerItems(account.meliUserId, accessToken);
  const items = await fetchItemsDetails(itemIds, accessToken);

  let syncedProductsCount = 0;
  let syncedSalesCount = 0;

  for (const item of items) {
    const sku = item.seller_custom_field || item.id;
    const name = item.title || "Producto Mercado Libre";
    const price = Number(item.price) || 0;
    const stock = Number(item.available_quantity) || 0;
    const category = item.category_id || "General";
    
    // Estimación de costo base (65% del precio si no existe) para cálculo de márgenes
    const cost = Math.round(price * 0.65 * 100) / 100;

    await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        price,
        stock,
        category,
        updatedAt: new Date(),
      },
      create: {
        sku,
        name,
        brand: "Mercado Libre",
        category,
        subCategory: "Marketplace",
        cost,
        price,
        stock,
        agingInDays: 15,
        coverageInDays: stock > 0 ? 30 : 0,
        classification: stock > 20 ? "ANCLA" : "ACOMPAÑANTE",
        decision: stock <= 2 ? "EMPUJAR" : "MANTENER",
      },
    });

    syncedProductsCount++;
  }

  // 3. Obtener órdenes de venta y registrarlas
  const orders = await fetchSellerOrders(account.meliUserId, accessToken);

  for (const order of orders) {
    const orderItems = order.order_items || [];
    const dateCreated = order.date_created ? new Date(order.date_created) : new Date();

    for (const oi of orderItems) {
      const itemSku = oi.item?.seller_custom_field || oi.item?.id;
      if (!itemSku) continue;

      // Buscar si el producto existe
      const product = await prisma.product.findUnique({
        where: { sku: itemSku },
      });

      if (product) {
        const quantity = Number(oi.quantity) || 1;
        const revenue = Number(oi.unit_price) * quantity || 0;

        // Registrar venta si no existe una idéntica reciente
        await prisma.sale.create({
          data: {
            productId: product.id,
            date: dateCreated,
            quantity,
            revenue,
            channel: "MERCADO_LIBRE",
          },
        });
        syncedSalesCount++;
      }
    }
  }

  return {
    success: true,
    seller: profile.nickname || account.nickname,
    sellerId: account.meliUserId,
    syncedProducts: syncedProductsCount,
    syncedSales: syncedSalesCount,
    totalPublicationsFound: itemIds.length,
    timestamp: new Date().toISOString(),
  };
}
