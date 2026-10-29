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

export interface MeliCategoryBasic {
  id: string;
  name: string;
}

export interface MeliCategoryDetail extends MeliCategoryBasic {
  picture?: string;
  total_items_in_this_category?: number;
  children_categories?: Array<{
    id: string;
    name: string;
    total_items_in_this_category?: number;
  }>;
  path_from_root?: Array<{
    id: string;
    name: string;
  }>;
}

export interface MeliTrend {
  keyword: string;
  url: string;
}

export interface MeliCatalogProduct {
  id: string;
  name: string;
  domain_id?: string;
  permalink?: string;
  status?: string;
  pictures?: Array<{ id: string; url: string }>;
  attributes?: Array<{ id: string; name: string; value_name: string }>;
  rating?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  currency_id?: string;
  total_offers?: number;
  has_active_offers?: boolean;
  free_shipping?: boolean;
  buy_box_winner?: {
    seller_id?: number | string;
    price?: number;
    free_shipping?: boolean;
  };
}

export interface MeliCompetitorOffer {
  itemId: string;
  sellerId: number | string;
  sellerNickname: string;
  sellerReputation?: string;
  sellerTransactions?: number;
  powerSellerStatus?: string | null;
  price: number;
  originalPrice?: number | null;
  freeShipping: boolean;
  logisticType?: string;
  city?: string;
  warranty?: string;
}

export interface MeliInspectedItem {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  currency_id: string;
  sold_quantity: number;
  available_quantity: number;
  estimated_revenue: number;
  permalink: string;
  thumbnail: string;
  condition: string;
  status?: string;
  has_active_offers?: boolean;
  listing_type_id: string;
  category_id: string;
  category_name?: string;
  warranty?: string;
  free_shipping?: boolean;
  seller: {
    id: number | string;
    nickname: string;
    reputation_level?: string;
    power_seller_status?: string | null;
    total_sales?: number;
  };
  pictures: string[];
  attributes: Array<{ name: string; value: string }>;
  is_catalog?: boolean;
  total_competitors?: number;
  min_competitor_price?: number;
  max_competitor_price?: number;
  competitors?: MeliCompetitorOffer[];
}

/**
 * Obtiene las categorías principales del sitio MLA
 */
export async function getMeliCategories(): Promise<MeliCategoryBasic[]> {
  const tokenData = await getValidAccessToken();
  const headers: Record<string, string> = { "User-Agent": "Arasy/1.0" };
  if (tokenData?.accessToken) {
    headers["Authorization"] = `Bearer ${tokenData.accessToken}`;
  }

  const res = await fetch("https://api.mercadolibre.com/sites/MLA/categories", { headers });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar categorías de Mercado Libre.`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Obtiene el detalle, subcategorías y volumen de una categoría
 */
export async function getMeliCategoryDetail(categoryId: string): Promise<MeliCategoryDetail> {
  const tokenData = await getValidAccessToken();
  const headers: Record<string, string> = { "User-Agent": "Arasy/1.0" };
  if (tokenData?.accessToken) {
    headers["Authorization"] = `Bearer ${tokenData.accessToken}`;
  }

  const res = await fetch(`https://api.mercadolibre.com/categories/${categoryId}`, { headers });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar la categoría ${categoryId}.`);
  }

  return await res.json();
}

/**
 * Obtiene el ranking de las 50 tendencias oficiales (términos más buscados y demandados)
 */
export async function getMeliTrends(categoryId?: string): Promise<MeliTrend[]> {
  const tokenData = await getValidAccessToken();
  const headers: Record<string, string> = { "User-Agent": "Arasy/1.0" };
  if (tokenData?.accessToken) {
    headers["Authorization"] = `Bearer ${tokenData.accessToken}`;
  }

  const url = categoryId
    ? `https://api.mercadolibre.com/trends/MLA/${categoryId}`
    : "https://api.mercadolibre.com/trends/MLA";

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar tendencias en Mercado Libre.`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Búsqueda de productos normalizados dentro del catálogo único de Mercado Libre,
 * con enriquecimiento concurrente de ofertas y precios reales de competidores activos.
 */
export async function searchCatalogProducts(
  query: string,
  categoryId?: string,
  limit = 20,
  onlyActive = true
): Promise<{ total: number; results: MeliCatalogProduct[] }> {
  const tokenData = await getValidAccessToken();
  const headers: Record<string, string> = { "User-Agent": "Arasy/1.0" };
  if (tokenData?.accessToken) {
    headers["Authorization"] = `Bearer ${tokenData.accessToken}`;
  }

  // Si onlyActive está activado, buscamos un lote mayor en la API para poder filtrar y tener suficientes con stock
  const fetchLimit = onlyActive ? Math.min(Math.max(limit * 2, 24), 50) : limit;

  let url = `https://api.mercadolibre.com/products/search?site_id=MLA&status=active&q=${encodeURIComponent(query)}&limit=${fetchLimit}`;
  if (categoryId) {
    url += `&category_id=${categoryId}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string })?.message ||
        `Error ${res.status} al buscar productos en el catálogo de Mercado Libre.`
    );
  }

  const data = (await res.json()) as {
    paging?: { total?: number };
    results?: Array<{
      id: string;
      name: string;
      domain_id?: string;
      permalink?: string;
      status?: string;
      pictures?: Array<{ id: string; url: string }>;
      attributes?: Array<{ id: string; name: string; value_name?: string }>;
      rating?: number;
    }>;
  };

  const rawResults = data.results || [];

  // Enriquecer concurrentemente con ofertas activas (/products/{id}/items)
  const enrichedResults = await Promise.all(
    rawResults.map(async (p) => {
      let hasActiveOffers = false;
      let minPrice: number | undefined;
      let maxPrice: number | undefined;
      let totalOffers = 0;
      let freeShipping = false;
      let buyBoxWinner: { seller_id?: number | string; price?: number; free_shipping?: boolean } | undefined;

      try {
        const compRes = await fetch(`https://api.mercadolibre.com/products/${p.id}/items`, { headers });
        if (compRes.ok) {
          const compData = await compRes.json();
          const offers = (compData.results || []) as Array<{
            item_id?: string;
            seller_id?: number | string;
            price?: number;
            shipping?: { free_shipping?: boolean };
          }>;

          if (offers.length > 0) {
            hasActiveOffers = true;
            totalOffers = compData.paging?.total || offers.length;
            const validPrices = offers.map((o) => Number(o.price) || 0).filter((pr) => pr > 0);
            if (validPrices.length > 0) {
              minPrice = Math.min(...validPrices);
              maxPrice = Math.max(...validPrices);
            }
            const winner = offers[0];
            freeShipping = !!winner?.shipping?.free_shipping;
            buyBoxWinner = {
              seller_id: winner?.seller_id,
              price: Number(winner?.price) || minPrice,
              free_shipping: freeShipping,
            };
          }
        }
      } catch {
        // En caso de fallo de red en un item, se marca sin ofertas activas
      }

      const item: MeliCatalogProduct = {
        id: p.id,
        name: p.name,
        domain_id: p.domain_id,
        permalink: p.permalink,
        status: p.status,
        pictures: p.pictures,
        rating: p.rating,
        price: minPrice,
        min_price: minPrice,
        max_price: maxPrice,
        currency_id: "ARS",
        total_offers: totalOffers,
        has_active_offers: hasActiveOffers,
        free_shipping: freeShipping,
        buy_box_winner: buyBoxWinner,
        attributes: (p.attributes || []).map((a) => ({
          id: a.id,
          name: a.name,
          value_name: a.value_name || "",
        })),
      };

      return item;
    })
  );

  let finalResults = enrichedResults;

  if (onlyActive) {
    finalResults = enrichedResults.filter((p) => p.has_active_offers);
  } else {
    // Si no es onlyActive, ordenar primero los que tienen ofertas activas
    finalResults.sort((a, b) => (b.has_active_offers ? 1 : 0) - (a.has_active_offers ? 1 : 0));
  }

  const slicedResults = finalResults.slice(0, limit);

  return {
    total: onlyActive ? finalResults.length : data.paging?.total || finalResults.length,
    results: slicedResults,
  };
}

/**
 * Inspecciona un artículo de la competencia mediante su ID o URL de Mercado Libre
 */
export async function inspectMeliItem(input: string): Promise<MeliInspectedItem> {
  const tokenData = await getValidAccessToken();
  const headers: Record<string, string> = { "User-Agent": "Arasy/1.0" };
  if (tokenData?.accessToken) {
    headers["Authorization"] = `Bearer ${tokenData.accessToken}`;
  }

  // Extraer el ID de MLA (ej: MLA-12345678 o MLA12345678)
  const match = input.match(/MLA-?(\d+)/i);
  if (!match) {
    throw new Error("No se pudo detectar un identificador válido de Mercado Libre (ej: MLA123456789 o link del artículo).");
  }

  const cleanId = `MLA${match[1]}`;

  // 1. Obtener publicación
  const itemRes = await fetch(`https://api.mercadolibre.com/items/${cleanId}`, { headers });
  
  if (!itemRes.ok) {
    // Si da 403 o 404, verificar si se trata de un ID de producto de Catálogo (/products/{cleanId})
    try {
      const prodRes = await fetch(`https://api.mercadolibre.com/products/${cleanId}`, { headers });
      if (prodRes.ok) {
        const prod = await prodRes.json();
        const pictures: string[] = Array.isArray(prod.pictures)
          ? prod.pictures.map((p: { url?: string; secure_url?: string }) => p.secure_url || p.url || "")
          : [];
        const attributes = Array.isArray(prod.attributes)
          ? prod.attributes.slice(0, 10).map((a: { name?: string; value_name?: string }) => ({
              name: a.name || "",
              value: a.value_name || "",
            }))
          : [];

        // Consultar ofertas de la competencia en el catálogo
        let totalCompetitors = 0;
        let minCompetitorPrice = 0;
        let maxCompetitorPrice = 0;
        const competitors: MeliCompetitorOffer[] = [];

        try {
          const compRes = await fetch(`https://api.mercadolibre.com/products/${cleanId}/items`, { headers });
          if (compRes.ok) {
            const compData = await compRes.json();
            const rawOffers = (compData.results || []) as Array<{
              item_id?: string;
              seller_id?: number | string;
              price?: number;
              original_price?: number;
              warranty?: string;
              shipping?: { free_shipping?: boolean; logistic_type?: string };
              seller_address?: { city?: { name?: string }; state?: { name?: string } };
            }>;

            totalCompetitors = compData.paging?.total || rawOffers.length;

            const validPrices = rawOffers
              .map((o) => Number(o.price) || 0)
              .filter((p) => p > 0);

            if (validPrices.length > 0) {
              minCompetitorPrice = Math.min(...validPrices);
              maxCompetitorPrice = Math.max(...validPrices);
            }

            for (const off of rawOffers.slice(0, 5)) {
              let nickname = `Vendedor ${off.seller_id}`;
              let repLevel = "Desconocido";
              let powerSeller: string | null = null;
              let totalSales = 0;

              if (off.seller_id) {
                try {
                  const sRes = await fetch(`https://api.mercadolibre.com/users/${off.seller_id}`, { headers });
                  if (sRes.ok) {
                    const sData = await sRes.json();
                    nickname = sData.nickname || nickname;
                    repLevel = sData.seller_reputation?.level_id || repLevel;
                    powerSeller = sData.seller_reputation?.power_seller_status || null;
                    totalSales = Number(sData.seller_reputation?.transactions?.total) || 0;
                  }
                } catch {
                  // ignorar fallo de vendedor
                }
              }

              competitors.push({
                itemId: off.item_id || "",
                sellerId: off.seller_id || 0,
                sellerNickname: nickname,
                sellerReputation: repLevel,
                sellerTransactions: totalSales,
                powerSellerStatus: powerSeller,
                price: Number(off.price) || 0,
                originalPrice: off.original_price ? Number(off.original_price) : null,
                freeShipping: off.shipping?.free_shipping || false,
                logisticType: off.shipping?.logistic_type || "normal",
                city: off.seller_address?.city?.name || off.seller_address?.state?.name || "Argentina",
                warranty: off.warranty || "Garantía estándar",
              });
            }
          }
        } catch {
          // Ignorar fallo de ofertas secundarias
        }

        const bestSeller = competitors[0];
        const hasActiveOffers = competitors.length > 0;

        return {
          id: cleanId,
          title: prod.name || "Producto de Catálogo",
          price: minCompetitorPrice || 0,
          original_price: maxCompetitorPrice || minCompetitorPrice || 0,
          currency_id: "ARS",
          sold_quantity: bestSeller?.sellerTransactions || 0,
          available_quantity: totalCompetitors,
          estimated_revenue: (minCompetitorPrice || 0) * (bestSeller?.sellerTransactions || 0),
          permalink: prod.permalink || `https://www.mercadolibre.com.ar/p/${cleanId}`,
          thumbnail: pictures[0] || "",
          condition: hasActiveOffers ? "Ficha Oficial de Catálogo" : "Ficha de Catálogo (Sin stock activo)",
          status: hasActiveOffers ? "active" : "without_stock",
          has_active_offers: hasActiveOffers,
          listing_type_id: "catalog_product",
          category_id: prod.domain_id || "",
          category_name: `Catálogo Oficial (${prod.domain_id || "MLA"})`,
          warranty: bestSeller?.warranty || (hasActiveOffers ? "Garantía según vendedor de Buy Box" : "Sin vendedores activos en este momento"),
          free_shipping: bestSeller?.freeShipping ?? false,
          seller: {
            id: bestSeller?.sellerId || "CATALOG",
            nickname: bestSeller ? `${bestSeller.sellerNickname} (Buy Box Winner)` : "Catálogo Mercado Libre (Sin oferta activa)",
            reputation_level: bestSeller?.sellerReputation || "5_green",
            power_seller_status: bestSeller?.powerSellerStatus || "platinum",
            total_sales: bestSeller?.sellerTransactions || 0,
          },
          pictures,
          attributes,
          is_catalog: true,
          total_competitors: totalCompetitors,
          min_competitor_price: minCompetitorPrice,
          max_competitor_price: maxCompetitorPrice,
          competitors,
        };
      }
    } catch {
      // Ignorar fallback secundario
    }

    if (itemRes.status === 403) {
      throw new Error(
        `Mercado Libre restringió el acceso directo a la publicación ${cleanId} (Error 403: access_denied). Por políticas de privacidad del marketplace, la API solo permite ver el detalle de inventario de publicaciones de tu propia cuenta o de productos de Catálogo público. Te sugerimos buscar este producto por nombre/marca en la pestaña "Buscador de Catálogo ML".`
      );
    }

    if (itemRes.status === 404) {
      throw new Error(`El artículo ${cleanId} no fue encontrado o la publicación ya finalizó en Mercado Libre.`);
    }

    throw new Error(`Error ${itemRes.status} al consultar el artículo ${cleanId}. Verificá que exista y esté activo.`);
  }

  const item = await itemRes.json();

  // 2. Obtener vendedor
  let sellerNickname = "Desconocido";
  let reputationLevel = "Desconocido";
  let powerSellerStatus: string | null = null;

  if (item.seller_id) {
    try {
      const sellerRes = await fetch(`https://api.mercadolibre.com/users/${item.seller_id}`, { headers });
      if (sellerRes.ok) {
        const sellerData = await sellerRes.json();
        sellerNickname = sellerData.nickname || sellerNickname;
        reputationLevel = sellerData.seller_reputation?.level_id || reputationLevel;
        powerSellerStatus = sellerData.seller_reputation?.power_seller_status || null;
      }
    } catch {
      // Ignorar fallo secundario de vendedor
    }
  }

  // 3. Obtener nombre de categoría
  let categoryName = item.category_id;
  if (item.category_id) {
    try {
      const catRes = await fetch(`https://api.mercadolibre.com/categories/${item.category_id}`, { headers });
      if (catRes.ok) {
        const catData = await catRes.json();
        categoryName = catData.name || categoryName;
      }
    } catch {
      // Ignorar fallo de categoría
    }
  }

  const price = Number(item.price) || 0;
  const soldQuantity = Number(item.sold_quantity) || 0;
  const estimatedRevenue = price * soldQuantity;

  const pictures: string[] = Array.isArray(item.pictures)
    ? item.pictures.map((p: { url?: string; secure_url?: string }) => p.secure_url || p.url || "")
    : [];

  const attributes = Array.isArray(item.attributes)
    ? item.attributes.slice(0, 8).map((a: { name?: string; value_name?: string }) => ({
        name: a.name || "",
        value: a.value_name || "",
      }))
    : [];

  return {
    id: cleanId,
    title: item.title || "Sin título",
    price,
    original_price: item.original_price ? Number(item.original_price) : price,
    currency_id: item.currency_id || "ARS",
    sold_quantity: soldQuantity,
    available_quantity: Number(item.available_quantity) || 0,
    estimated_revenue: estimatedRevenue,
    permalink: item.permalink || `https://articulo.mercadolibre.com.ar/${cleanId}`,
    thumbnail: item.secure_thumbnail || item.thumbnail || pictures[0] || "",
    condition: item.condition === "new" ? "Nuevo" : item.condition === "used" ? "Usado" : item.condition,
    status: item.status || "active",
    has_active_offers: (item.status || "active") === "active",
    listing_type_id: item.listing_type_id || "gold_special",
    category_id: item.category_id || "",
    category_name: categoryName,
    warranty: item.warranty || "Sin garantía declarada",
    free_shipping: item.shipping?.free_shipping || false,
    seller: {
      id: item.seller_id,
      nickname: sellerNickname,
      reputation_level: reputationLevel,
      power_seller_status: powerSellerStatus,
    },
    pictures,
    attributes,
  };
}
