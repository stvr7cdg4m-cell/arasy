"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";

interface CategoryBasic {
  id: string;
  name: string;
}

interface CategoryDetail extends CategoryBasic {
  picture?: string;
  total_items_in_this_category?: number;
  children_categories?: Array<{
    id: string;
    name: string;
    total_items_in_this_category?: number;
  }>;
}

interface TrendItem {
  keyword: string;
  url: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  domain_id?: string;
  permalink?: string;
  status?: string;
  pictures?: Array<{ id: string; url: string }>;
  attributes?: Array<{ id: string; name: string; value_name: string }>;
  rating?: number;
}

interface InspectedItem {
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
  };
  pictures: string[];
  attributes: Array<{ name: string; value: string }>;
  is_catalog?: boolean;
  total_competitors?: number;
  min_competitor_price?: number;
  max_competitor_price?: number;
  competitors?: Array<{
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
  }>;
}

interface WatchlistItem {
  id: string;
  itemId: string;
  title: string;
  price: number;
  currencyId: string;
  soldQuantity: number;
  stock: number;
  permalink: string;
  thumbnail?: string | null;
  sellerId?: string | null;
  sellerNickname?: string | null;
  categoryName?: string | null;
  notes?: string | null;
  updatedAt: string;
}

export default function ClientMarketRadar() {
  const [, startTransition] = useTransition();

  // Tabs
  const [activeTab, setActiveTab] = useState<"trends" | "catalog" | "inspector" | "watchlist">("trends");

  // State: Categories
  const [categories, setCategories] = useState<CategoryBasic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("MLA1055"); // Celulares por defecto o primera
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryDetail | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // State: Trends
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [trendsLoading, setTrendsLoading] = useState<boolean>(false);
  const [trendSearchFilter, setTrendSearchFilter] = useState<string>("");

  // State: Catalog
  const [catalogQuery, setCatalogQuery] = useState<string>("");
  const [catalogResults, setCatalogResults] = useState<CatalogProduct[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number>(0);
  const [catalogLoading, setCatalogLoading] = useState<boolean>(false);

  // State: Inspector
  const [inspectQuery, setInspectQuery] = useState<string>("MLA59925307");
  const [inspectedItem, setInspectedItem] = useState<InspectedItem | null>(null);
  const [activePicture, setActivePicture] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const formatImgUrl = (url?: string | null) => {
    if (!url) return "";
    return url.replace(/^http:\/\//i, "https://");
  };

  // State: Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Notification / Alert
  const [globalError, setGlobalError] = useState<string | null>(null);

  // 1. Initial Load: Categories & Watchlist
  useEffect(() => {
    async function loadInitial() {
      setWatchlistLoading(true);
      try {
        const [catsRes, watchRes] = await Promise.all([
          fetch("/api/market/categories"),
          fetch("/api/market/watchlist"),
        ]);

        if (catsRes.ok) {
          const data = await catsRes.json();
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }

        if (watchRes.ok) {
          const data = await watchRes.json();
          if (data.items) {
            setWatchlist(data.items);
          }
        }
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setWatchlistLoading(false);
      }
    }
    loadInitial();
  }, []);

  // 2. Load Category Detail & Trends when selectedCategory changes
  useEffect(() => {
    if (!selectedCategory) return;

    let isMounted = true;
    async function fetchCatData() {
      setTrendsLoading(true);
      setGlobalError(null);
      try {
        const catRes = await fetch(`/api/market/category?id=${selectedCategory}`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (isMounted) setSelectedCategoryDetail(catData.category);
        }

        const targetCatId = selectedSubcategory || selectedCategory;
        const trendRes = await fetch(`/api/market/trends?category=${targetCatId}`);
        if (trendRes.ok) {
          const trendData = await trendRes.json();
          if (isMounted) setTrends(trendData.trends || []);
        } else {
          const errData = await trendRes.json().catch(() => ({}));
          if (isMounted) setGlobalError(errData.error || "No se pudieron cargar las tendencias.");
        }
      } catch (err: unknown) {
        if (isMounted) {
          setGlobalError(err instanceof Error ? err.message : "Error de conexión");
        }
      } finally {
        if (isMounted) setTrendsLoading(false);
      }
    }

    fetchCatData();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedSubcategory]);

  // Handle Catalog Search
  const handleCatalogSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!catalogQuery.trim()) return;

    setCatalogLoading(true);
    setGlobalError(null);
    try {
      const res = await fetch(`/api/market/catalog?q=${encodeURIComponent(catalogQuery.trim())}&limit=24`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCatalogResults(data.results || []);
        setCatalogTotal(data.total || 0);
      } else {
        setGlobalError(data.error || "Error al buscar en catálogo.");
      }
    } catch (err: unknown) {
      setGlobalError(err instanceof Error ? err.message : "Error en búsqueda de catálogo");
    } finally {
      setCatalogLoading(false);
    }
  };

  // Handle Item Inspection
  const handleInspect = async (queryToInspect?: string) => {
    const q = (queryToInspect || inspectQuery).trim();
    if (!q) return;

    setInspectLoading(true);
    setInspectError(null);
    try {
      const res = await fetch("/api/market/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInspectedItem(data.item);
        setActivePicture(data.item?.thumbnail || data.item?.pictures?.[0] || null);
        if (queryToInspect) setInspectQuery(queryToInspect);
      } else {
        setInspectError(data.error || "No se pudo inspeccionar el artículo.");
      }
    } catch (err: unknown) {
      setInspectError(err instanceof Error ? err.message : "Error al conectar con Mercado Libre");
    } finally {
      setInspectLoading(false);
    }
  };

  // Add Item to Watchlist
  const handleAddToWatchlist = async (item: InspectedItem) => {
    try {
      const res = await fetch("/api/market/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          title: item.title,
          price: item.price,
          currencyId: item.currency_id,
          soldQuantity: item.sold_quantity,
          stock: item.available_quantity,
          permalink: item.permalink,
          thumbnail: item.thumbnail,
          sellerId: String(item.seller.id),
          sellerNickname: item.seller.nickname,
          categoryName: item.category_name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMessage("¡Artículo guardado en tu Radar de Competidores!");
        // Refresh watchlist
        const wRes = await fetch("/api/market/watchlist");
        if (wRes.ok) {
          const wData = await wRes.json();
          setWatchlist(wData.items || []);
        }
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error saving to watchlist:", err);
    }
  };

  // Remove from Watchlist
  const handleRemoveFromWatchlist = async (id: string) => {
    try {
      const res = await fetch(`/api/market/watchlist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setWatchlist((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error removing from watchlist:", err);
    }
  };

  // Helper formatters
  const formatCurrency = (val: number, currency = "ARS") => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("es-AR").format(val);
  };

  // Filtered trends
  const filteredTrends = trends.filter((t) =>
    t.keyword.toLowerCase().includes(trendSearchFilter.toLowerCase().trim())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-muted/20 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-midnight shadow-md">
              <span className="material-symbols-outlined text-2xl">trending_up</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-midnight tracking-tight flex items-center gap-2">
                Radar de Mercado & Tendencias ML
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Inteligencia Competitiva
                </span>
              </h1>
              <p className="text-sm text-slate-muted mt-0.5">
                Descubrí qué productos y búsquedas mueven la aguja en Mercado Libre Argentina, analizá la competencia y explorá el catálogo oficial.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mercado Libre Conectado</span>
            <span className="text-emerald-900/60 font-normal">| RMD TECH (MLA)</span>
          </div>

          <Link
            href="/integraciones"
            className="px-3 py-2 text-xs font-medium text-slate-muted hover:text-midnight hover:bg-slate-100 rounded-xl transition border border-slate-200"
          >
            Ajustes de API
          </Link>
        </div>
      </div>

      {/* Global alert error if any */}
      {globalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-rose-500">warning</span>
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="ml-auto text-xs underline text-rose-600 hover:text-rose-800"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 2. Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-slate-muted/20 pb-3">
        <button
          onClick={() => setActiveTab("trends")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "trends"
              ? "bg-midnight text-white shadow-sm"
              : "text-slate-muted hover:text-midnight hover:bg-white/60"
          }`}
        >
          <span className="material-symbols-outlined text-lg">local_fire_department</span>
          <span>Ranking de Tendencias (Top 50)</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-midnight font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "catalog"
              ? "bg-midnight text-white shadow-sm"
              : "text-slate-muted hover:text-midnight hover:bg-white/60"
          }`}
        >
          <span className="material-symbols-outlined text-lg">category</span>
          <span>Buscador de Catálogo ML</span>
        </button>

        <button
          onClick={() => setActiveTab("inspector")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "inspector"
              ? "bg-midnight text-white shadow-sm"
              : "text-slate-muted hover:text-midnight hover:bg-white/60"
          }`}
        >
          <span className="material-symbols-outlined text-lg">troubleshoot</span>
          <span>Espía de Publicaciones</span>
        </button>

        <button
          onClick={() => setActiveTab("watchlist")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "watchlist"
              ? "bg-midnight text-white shadow-sm"
              : "text-slate-muted hover:text-midnight hover:bg-white/60"
          }`}
        >
          <span className="material-symbols-outlined text-lg">bookmark</span>
          <span>Radar Guardado</span>
          {watchlist.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
              {watchlist.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RANKING DE TENDENCIAS (TOP 50)                                    */}
      {/* ========================================================================= */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Category Bar & Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-muted/20 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Category Select */}
              <div className="relative min-w-[240px]">
                <label className="text-xs font-semibold text-slate-muted block mb-1">
                  Categoría Principal:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-midnight focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Select if available */}
              {selectedCategoryDetail?.children_categories &&
                selectedCategoryDetail.children_categories.length > 0 && (
                  <div className="relative min-w-[220px]">
                    <label className="text-xs font-semibold text-slate-muted block mb-1">
                      Subcategoría:
                    </label>
                    <select
                      value={selectedSubcategory}
                      onChange={(e) => setSelectedSubcategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-midnight focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Todas las subcategorías</option>
                      {selectedCategoryDetail.children_categories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              {/* Market Volume Badge */}
              {selectedCategoryDetail?.total_items_in_this_category !== undefined && (
                <div className="sm:self-end pb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-amber-600 text-sm">inventory</span>
                  <span>
                    Volumen activo:{" "}
                    <strong className="text-midnight font-bold">
                      {formatNumber(selectedCategoryDetail.total_items_in_this_category)}
                    </strong>{" "}
                    publicaciones
                  </span>
                </div>
              )}
            </div>

            {/* In-table search filter */}
            <div className="relative sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Filtrar por término..."
                value={trendSearchFilter}
                onChange={(e) => setTrendSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Ranking Table Card */}
          <div className="bg-white rounded-2xl border border-slate-muted/20 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-muted/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-midnight flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">local_fire_department</span>
                  Ranking de Mayor Crecimiento y Demanda
                </h3>
                <p className="text-xs text-slate-muted mt-0.5">
                  Los 50 términos y productos más buscados con mayor tracción en la categoría seleccionada.
                </p>
              </div>

              <span className="text-xs text-slate-muted font-medium">
                {trendsLoading ? "Actualizando..." : `${filteredTrends.length} tendencias detectadas`}
              </span>
            </div>

            {trendsLoading ? (
              <div className="p-12 text-center text-slate-muted space-y-3">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">Consultando las tendencias oficiales de Mercado Libre...</p>
              </div>
            ) : filteredTrends.length === 0 ? (
              <div className="p-12 text-center text-slate-muted">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                <p className="text-sm">No se encontraron tendencias con ese filtro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-muted/10 text-xs font-semibold text-slate-muted uppercase tracking-wider">
                      <th className="py-3 px-5 w-16 text-center">Puesto</th>
                      <th className="py-3 px-5">Término / Producto en Tendencia</th>
                      <th className="py-3 px-5 text-center">Nivel de Demanda</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-muted/10">
                    {filteredTrends.map((trend, index) => {
                      const rank = index + 1;
                      const isTop3 = rank <= 3;
                      const isTop10 = rank <= 10;

                      return (
                        <tr
                          key={trend.keyword}
                          className="hover:bg-slate-50/60 transition group"
                        >
                          <td className="py-3.5 px-5 text-center">
                            {rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-midnight font-black text-xs shadow-sm">
                                🥇 1
                              </span>
                            ) : rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-sm">
                                🥈 2
                              </span>
                            ) : rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                                🥉 3
                              </span>
                            ) : (
                              <span className="font-semibold text-xs text-slate-400">
                                #{rank}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-5 font-semibold text-midnight capitalize">
                            <div className="flex items-center gap-2">
                              <span>{trend.keyword}</span>
                              {isTop3 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                  Mega Tracción
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                                isTop3
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : isTop10
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              }`}
                            >
                              <span className="material-symbols-outlined text-xs">
                                {isTop3 ? "whatshot" : isTop10 ? "trending_up" : "insights"}
                              </span>
                              {isTop3 ? "Muy Alta" : isTop10 ? "Alta" : "Moderada"}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setCatalogQuery(trend.keyword);
                                  startTransition(() => {
                                    setActiveTab("catalog");
                                  });
                                  setTimeout(() => {
                                    const submitBtn = document.getElementById("catalog-search-btn");
                                    if (submitBtn) submitBtn.click();
                                  }, 100);
                                }}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-midnight hover:bg-slate-100 rounded-lg transition border border-slate-200 flex items-center gap-1"
                                title="Buscar en catálogo oficial"
                              >
                                <span className="material-symbols-outlined text-sm">category</span>
                                <span>Catálogo</span>
                              </button>

                              <a
                                href={trend.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200 flex items-center gap-1"
                                title="Ver búsqueda oficial en Mercado Libre"
                              >
                                <span>Ver en ML</span>
                                <span className="material-symbols-outlined text-xs">open_in_new</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BUSCADOR DE CATÁLOGO (CATALOG PRODUCTS)                           */}
      {/* ========================================================================= */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-muted/20 shadow-sm">
            <h3 className="text-base font-bold text-midnight mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">category</span>
              Buscador Oficial de Fichas de Catálogo de Mercado Libre
            </h3>
            <p className="text-xs text-slate-muted mb-4">
              Consultá los productos universales estandarizados del catálogo de Mercado Libre (marcas, modelos y fichas técnicas globales) sin restricciones de scraping.
            </p>

            <form onSubmit={handleCatalogSearch} className="flex gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Ingresá nombre, marca o modelo (ej: iPhone 13, Taladro Inalámbrico Bosch, Smart TV 50)..."
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <button
                id="catalog-search-btn"
                type="submit"
                disabled={catalogLoading || !catalogQuery.trim()}
                className="px-6 py-2.5 bg-midnight text-white text-sm font-semibold rounded-xl hover:bg-midnight/90 disabled:opacity-50 transition flex items-center gap-2"
              >
                {catalogLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">search</span>
                    <span>Buscar Catálogo</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Grid */}
          {catalogLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-muted/20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-muted">Explorando el catálogo oficial de Mercado Libre...</p>
            </div>
          ) : catalogResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">
                  Resultados encontrados ({catalogTotal} productos en catálogo)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogResults.map((product) => {
                  const image = product.pictures?.[0]?.url || "";
                  return (
                    <div
                      key={product.id}
                      className="bg-white p-5 rounded-2xl border border-slate-muted/20 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="h-44 w-full bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                          {image ? (
                            <Image
                              src={formatImgUrl(image)}
                              alt={product.name}
                              fill
                              unoptimized
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-contain p-2"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-4xl text-slate-300">
                              image_not_supported
                            </span>
                          )}
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-midnight/80 text-white backdrop-blur-sm">
                            {product.domain_id?.replace("MLA-", "") || "CATÁLOGO"}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-midnight line-clamp-2" title={product.name}>
                            {product.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 font-mono">ID: {product.id}</p>
                        </div>

                        {product.attributes && product.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {product.attributes.slice(0, 3).map((attr) => (
                              <span
                                key={attr.id}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                              >
                                {attr.name}: {attr.value_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-muted/10 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setInspectQuery(product.id);
                            setActiveTab("inspector");
                            handleInspect(product.id);
                          }}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">troubleshoot</span>
                          <span>Inspeccionar Ficha</span>
                        </button>

                        {product.permalink && (
                          <a
                            href={product.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-slate-400 hover:text-midnight flex items-center gap-1"
                          >
                            <span>Ficha ML</span>
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-muted/20 text-center text-slate-muted">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">manage_search</span>
              <p className="text-sm">Realizá una búsqueda para explorar productos normalizados del catálogo.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ESPÍA DE PUBLICACIONES (ITEM INSPECTOR)                             */}
      {/* ========================================================================= */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          {/* Input Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-muted/20 shadow-sm">
            <h3 className="text-base font-bold text-midnight mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">troubleshoot</span>
              Analizador & Espía de Publicaciones de la Competencia
            </h3>
            <p className="text-xs text-slate-muted mb-4">
              Pegá el enlace de Mercado Libre o el código identificador (ej: <code className="bg-slate-100 px-1 py-0.5 rounded text-midnight font-bold">MLA3868538946</code>) para extraer ventas históricas, facturación estimada, stock actual y reputación del vendedor en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-3 text-slate-400">link</span>
                <input
                  type="text"
                  placeholder="https://articulo.mercadolibre.com.ar/MLA-123456789... o MLA123456789"
                  value={inspectQuery}
                  onChange={(e) => setInspectQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleInspect();
                  }}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => handleInspect()}
                disabled={inspectLoading || !inspectQuery.trim()}
                className="px-6 py-2.5 bg-midnight text-white text-sm font-semibold rounded-xl hover:bg-midnight/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {inspectLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>Espiar Publicación</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick sample chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
              <span>Probar ejemplos reales:</span>
              <button
                type="button"
                onClick={() => {
                  setInspectQuery("MLA15542577");
                  handleInspect("MLA15542577");
                }}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded font-semibold border border-amber-200"
              >
                MLA15542577 (Termo Stanley - 53 competidores)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectQuery("MLA18648076");
                  handleInspect("MLA18648076");
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
              >
                MLA18648076 (Licuadora Peabody)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectQuery("MLA3868538946");
                  handleInspect("MLA3868538946");
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
              >
                MLA3868538946 (Publicación propia)
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {inspectError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <span className="material-symbols-outlined text-rose-500 mt-0.5 sm:mt-0 flex-shrink-0">
                  shield_locked
                </span>
                <span className="leading-relaxed">{inspectError}</span>
              </div>
              <button
                onClick={() => {
                  let kw = inspectQuery;
                  const slugMatch = inspectQuery.match(/MLA-?\d+-?([a-zA-Z0-9-]+)/);
                  if (slugMatch && slugMatch[1]) {
                    kw = slugMatch[1].replace(/-/g, " ");
                  }
                  setCatalogQuery(kw);
                  startTransition(() => {
                    setActiveTab("catalog");
                  });
                }}
                className="px-3.5 py-2 bg-midnight text-white text-xs font-semibold rounded-lg hover:bg-midnight/90 transition flex-shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-sm">category</span>
                <span>Explorar en Catálogo ML</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-3 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Inspected Item Card */}
          {inspectedItem && (
            <div className="bg-white rounded-2xl border border-slate-muted/20 shadow-sm p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Photo & Condition */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="h-64 w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center p-3 border border-slate-100 relative">
                    {(activePicture || inspectedItem.thumbnail) ? (
                      <Image
                        src={formatImgUrl(activePicture || inspectedItem.thumbnail)}
                        alt={inspectedItem.title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-5xl text-slate-300">
                        image_not_supported
                      </span>
                    )}
                    <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-midnight text-white shadow">
                      {inspectedItem.condition}
                    </span>
                  </div>

                  {inspectedItem.pictures && inspectedItem.pictures.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {inspectedItem.pictures.slice(0, 6).map((pic, idx) => {
                        const isCurrent = (activePicture || inspectedItem.thumbnail) === pic;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePicture(pic)}
                            className={`w-14 h-14 relative flex-shrink-0 rounded-lg border-2 overflow-hidden bg-slate-50 transition cursor-pointer ${
                              isCurrent ? "border-amber-500 shadow-sm" : "border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            <Image
                              src={formatImgUrl(pic)}
                              alt=""
                              fill
                              unoptimized
                              sizes="56px"
                              className="object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Details & KPIs */}
                <div className="lg:col-span-8 space-y-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {inspectedItem.id}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        {inspectedItem.category_name || "Categoría ML"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-midnight tracking-tight">
                      {inspectedItem.title}
                    </h2>
                  </div>

                  {/* KPI Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs text-slate-400 font-semibold block">Precio Actual</span>
                      <p className="text-lg font-black text-midnight mt-0.5">
                        {formatCurrency(inspectedItem.price, inspectedItem.currency_id)}
                      </p>
                      {inspectedItem.original_price && inspectedItem.original_price > inspectedItem.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(inspectedItem.original_price, inspectedItem.currency_id)}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100">
                      <span className="text-xs text-amber-700 font-semibold block">Ventas Acumuladas</span>
                      <p className="text-lg font-black text-amber-900 mt-0.5">
                        +{formatNumber(inspectedItem.sold_quantity)} u.
                      </p>
                      <span className="text-[10px] text-amber-700/80 font-medium">Total histórico</span>
                    </div>

                    <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                      <span className="text-xs text-emerald-700 font-semibold block">Facturación Estimada</span>
                      <p className="text-lg font-black text-emerald-900 mt-0.5">
                        {formatCurrency(inspectedItem.estimated_revenue, inspectedItem.currency_id)}
                      </p>
                      <span className="text-[10px] text-emerald-700/80 font-medium">Ventas × Precio</span>
                    </div>

                    <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
                      <span className="text-xs text-blue-700 font-semibold block">Stock Disponible</span>
                      <p className="text-lg font-black text-blue-900 mt-0.5">
                        {formatNumber(inspectedItem.available_quantity)} u.
                      </p>
                      <span className="text-[10px] text-blue-700/80 font-medium">En almacén</span>
                    </div>
                  </div>

                  {/* Seller & Shipping Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-lg">storefront</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Vendedor</span>
                        <strong className="text-sm font-bold text-midnight block">
                          {inspectedItem.seller.nickname}
                        </strong>
                        {inspectedItem.seller.power_seller_status && (
                          <span className="text-[10px] text-emerald-600 font-bold capitalize">
                            MercadoLíder {inspectedItem.seller.power_seller_status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-lg">local_shipping</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Logística & Envío</span>
                        <strong className="text-sm font-bold text-midnight block">
                          {inspectedItem.free_shipping ? "Envío Gratis Incluido" : "Envío a cargo del comprador"}
                        </strong>
                        <span className="text-[10px] text-slate-400">{inspectedItem.warranty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Attributes Chips */}
                  {inspectedItem.attributes && inspectedItem.attributes.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Ficha Técnica & Atributos Clave
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {inspectedItem.attributes.map((attr, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                          >
                            <strong>{attr.name}:</strong> {attr.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Competitor Benchmark Table if available */}
                  {inspectedItem.competitors && inspectedItem.competitors.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-midnight flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-base">groups</span>
                            Benchmark de Vendedores y Ofertas de la Competencia
                          </h4>
                          <p className="text-xs text-slate-400">
                            {inspectedItem.total_competitors} vendedores compitiendo por este producto en Mercado Libre.
                          </p>
                        </div>
                        {inspectedItem.min_competitor_price && inspectedItem.max_competitor_price && (
                          <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium self-start sm:self-auto">
                            Rango: <strong>{formatCurrency(inspectedItem.min_competitor_price)}</strong> - <strong>{formatCurrency(inspectedItem.max_competitor_price)}</strong>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <th className="py-2.5 px-3">Vendedor Competidor</th>
                              <th className="py-2.5 px-3">Ventas Totales</th>
                              <th className="py-2.5 px-3 text-right">Precio de Venta</th>
                              <th className="py-2.5 px-3">Logística / Envío</th>
                              <th className="py-2.5 px-3">Ubicación</th>
                              <th className="py-2.5 px-3 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {inspectedItem.competitors.map((comp, cIdx) => (
                              <tr key={cIdx} className="hover:bg-slate-50/80 transition">
                                <td className="py-2.5 px-3 font-bold text-midnight">
                                  <div className="flex items-center gap-1.5">
                                    {cIdx === 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-midnight">
                                        🏆 Buy Box
                                      </span>
                                    )}
                                    <span>{comp.sellerNickname}</span>
                                    {comp.powerSellerStatus && (
                                      <span className="text-[10px] font-bold text-emerald-600 capitalize">
                                        • {comp.powerSellerStatus}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-semibold">
                                  {comp.sellerTransactions ? `+${formatNumber(comp.sellerTransactions)} ventas` : "Nuevo"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-midnight">
                                  {formatCurrency(comp.price)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${comp.freeShipping ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                    {comp.freeShipping ? "Gratis" : "Con costo"} • {comp.logisticType}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">
                                  {comp.city}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <a
                                    href={`https://articulo.mercadolibre.com.ar/${comp.itemId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-amber-600 hover:text-amber-800 font-semibold inline-flex items-center gap-0.5"
                                  >
                                    <span>Ver</span>
                                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleAddToWatchlist(inspectedItem)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-midnight font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">bookmark_add</span>
                      <span>Guardar en Radar de Competidores</span>
                    </button>

                    <a
                      href={inspectedItem.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-midnight font-semibold rounded-xl text-sm transition flex items-center gap-2"
                    >
                      <span>Abrir en Mercado Libre</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LISTA DE SEGUIMIENTO (WATCHLIST)                                    */}
      {/* ========================================================================= */}
      {activeTab === "watchlist" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-muted/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-midnight flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">bookmark</span>
                Publicaciones de la Competencia en Seguimiento
              </h3>
              <p className="text-xs text-slate-muted mt-0.5">
                Mantené un benchmark persistente de las publicaciones clave de tus competidores para comparar precios y stock.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("inspector")}
              className="px-4 py-2 bg-midnight text-white text-xs font-semibold rounded-xl hover:bg-midnight/90 transition flex items-center gap-1.5 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Monitorear Nuevo Producto</span>
            </button>
          </div>

          {watchlistLoading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-muted/20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-muted">Cargando publicaciones monitoreadas...</p>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-muted/20 text-center text-slate-muted space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">bookmark_border</span>
              <p className="text-sm font-medium">Todavía no guardaste ningún producto de la competencia en el Radar.</p>
              <p className="text-xs text-slate-400">
                Usá el <strong>Espía de Publicaciones</strong> para inspeccionar un artículo de Mercado Libre y hacer clic en &quot;Guardar en Radar&quot;.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-muted/20 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-muted/10 text-xs font-semibold text-slate-muted uppercase tracking-wider">
                      <th className="py-3 px-5">Producto / Publicación</th>
                      <th className="py-3 px-5">Vendedor</th>
                      <th className="py-3 px-5 text-right">Precio Actual</th>
                      <th className="py-3 px-5 text-center">Ventas Acumuladas</th>
                      <th className="py-3 px-5 text-center">Stock</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-muted/10">
                    {watchlist.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3 max-w-md">
                            {item.thumbnail ? (
                              <div className="w-12 h-12 relative flex-shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                <Image
                                  src={formatImgUrl(item.thumbnail)}
                                  alt=""
                                  fill
                                  unoptimized
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-lg">image</span>
                              </div>
                            )}
                            <div>
                              <strong className="text-xs font-bold text-midnight block line-clamp-1">
                                {item.title}
                              </strong>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.itemId} {item.categoryName ? `• ${item.categoryName}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="text-xs font-semibold text-slate-700">
                            {item.sellerNickname || "Desconocido"}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right font-bold text-midnight">
                          {formatCurrency(item.price, item.currencyId)}
                        </td>

                        <td className="py-3.5 px-5 text-center">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            +{formatNumber(item.soldQuantity)}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-center">
                          <span className="text-xs font-medium text-slate-600">
                            {formatNumber(item.stock)} u.
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setInspectQuery(item.itemId);
                                setActiveTab("inspector");
                                handleInspect(item.itemId);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition"
                              title="Re-inspeccionar en vivo"
                            >
                              <span className="material-symbols-outlined text-base">refresh</span>
                            </button>

                            <a
                              href={item.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-midnight hover:bg-slate-100 rounded-lg transition"
                              title="Ver en Mercado Libre"
                            >
                              <span className="material-symbols-outlined text-base">open_in_new</span>
                            </a>

                            <button
                              onClick={() => handleRemoveFromWatchlist(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar de seguimiento"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
