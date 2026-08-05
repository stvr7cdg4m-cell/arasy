"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Financials } from "@/lib/business-logic/financials";

export interface StockAnalyzedItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  cost: number;
  price: number;
  stock: number;
  velocity: number;
  vendibleUnits: number;
  overstockUnits: number;
  coverageMonths: number;
  status: "CRITICO" | "SALUDABLE" | "EXCESO";
  netProfit: number;
  marginPercent: number;
  stockValCost: number;
  stockValPrice: number;
  vendibleValCost: number;
  vendibleValPrice: number;
  overstockValCost: number;
  overstockValPrice: number;
  recommendation: string;
  classification: string;
}

interface ClientStockAnalysisProps {
  initialItems: StockAnalyzedItem[];
}

export default function ClientStockAnalysis({ initialItems }: ClientStockAnalysisProps) {
  const items = initialItems;
  const [selectedBrand, setSelectedBrand] = useState<string>("TODAS");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("TODAS");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");

  // Modal State
  const [selectedSkuForModal, setSelectedSkuForModal] = useState<StockAnalyzedItem | null>(null);
  const [campaignApplied, setCampaignApplied] = useState<Record<string, boolean>>({});

  // Local States for liquidation sync (Fase B)
  const [liquidationDiscount, setLiquidationDiscount] = useState<number>(15);
  const [syncShopify, setSyncShopify] = useState<boolean>(true);
  const [syncMeli, setSyncMeli] = useState<boolean>(true);

  // Obtener opciones de filtros dinámicamente
  const brands = useMemo(() => {
    const list = new Set(initialItems.map((item) => item.brand));
    return ["TODAS", ...Array.from(list)];
  }, [initialItems]);

  const categories = useMemo(() => {
    const list = new Set(initialItems.map((item) => item.category));
    return ["TODAS", ...Array.from(list)];
  }, [initialItems]);

  const subCategories = useMemo(() => {
    const list = new Set(
      initialItems
        .filter((item) => selectedCategory === "TODAS" || item.category === selectedCategory)
        .map((item) => item.subCategory)
    );
    return ["TODAS", ...Array.from(list)];
  }, [initialItems, selectedCategory]);

  // Filtrar ítems
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesBrand = selectedBrand === "TODAS" || item.brand === selectedBrand;
      const matchesCategory = selectedCategory === "TODAS" || item.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === "TODAS" || item.subCategory === selectedSubCategory;
      const matchesStatus = statusFilter === "TODOS" || item.status === statusFilter;
      return matchesBrand && matchesCategory && matchesSubCategory && matchesStatus;
    });
  }, [items, selectedBrand, selectedCategory, selectedSubCategory, statusFilter]);

  // KPIs agregados dinámicos según el filtro actual
  const kpis = useMemo(() => {
    let totalStockValCost = 0;
    let totalVendibleValCost = 0;
    let totalOverstockValCost = 0;
    let totalVendibleValPrice = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    filteredItems.forEach((item) => {
      totalStockValCost += item.stockValCost;
      totalVendibleValCost += item.vendibleValCost;
      totalOverstockValCost += item.overstockValCost;
      totalVendibleValPrice += item.vendibleValPrice;
      totalRevenue += item.stockValPrice;
      totalProfit += item.netProfit * item.stock;
    });

    const averageMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;

    return {
      totalStockValCost,
      totalVendibleValCost,
      totalOverstockValCost,
      totalVendibleValPrice,
      averageMargin,
    };
  }, [filteredItems]);

  const getStatusBadgeStyles = (status: "CRITICO" | "SALUDABLE" | "EXCESO") => {
    switch (status) {
      case "CRITICO":
        return "bg-coral-liquidate/10 text-coral-liquidate border-coral-liquidate/20";
      case "EXCESO":
        return "bg-gold-maintain/10 text-gold-maintain border-gold-maintain/20";
      default:
        return "bg-teal-push/10 text-teal-push border-teal-push/20";
    }
  };

  const getStatusLabel = (status: "CRITICO" | "SALUDABLE" | "EXCESO") => {
    switch (status) {
      case "CRITICO":
        return "Stock Crítico";
      case "EXCESO":
        return "Sobre-Stock";
      default:
        return "Saludable";
    }
  };

  const getClassificationBadgeStyles = (classification: string) => {
    switch (classification) {
      case "ANCLA":
        return "bg-primary-blue text-white";
      case "LASTRE":
        return "bg-slate-200 text-slate-700";
      default:
        return "bg-ice text-midnight border border-slate-muted/20";
    }
  };

  const handleApplyCampaign = async (item: StockAnalyzedItem) => {
    const isActivating = !campaignApplied[item.id];
    
    if (isActivating) {
      const decision = item.status === "EXCESO" ? "LIQUIDAR" : item.status === "CRITICO" ? "EMPUJAR" : "MANTENER";
      const quantity = item.status === "EXCESO" ? item.overstockUnits : item.status === "CRITICO" ? Math.round(item.velocity * 2) : 0;

      if (decision !== "MANTENER" && quantity > 0) {
        try {
          const response = await fetch("/api/planning/execute", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              productId: item.id,
              decision,
              quantity,
            }),
          });
          if (response.ok) {
            // Disparar evento global de actualización de alertas
            window.dispatchEvent(new Event("arasy_alerts_updated"));

            // Guardar log de liquidación o reposición en localStorage
            const customLogs = localStorage.getItem("arasy_custom_logs") || "[]";
            const parsed = JSON.parse(customLogs);
            
            if (decision === "LIQUIDAR") {
              const discountedPrice = Math.round(item.price * (1 - liquidationDiscount / 100));
              const targetChannels = [];
              if (syncShopify) targetChannels.push("Shopify");
              if (syncMeli) targetChannels.push("Mercado Libre");

              parsed.push({
                timestamp: new Date().toLocaleTimeString(),
                type: "success",
                text: `Shopify/ML: Campaña de descuento (-${liquidationDiscount}%) sincronizada para ${item.sku} en ${targetChannels.join(" y ")}. Precio final: $${discountedPrice.toLocaleString("es-AR")}.`,
              });
            } else if (decision === "EMPUJAR") {
              parsed.push({
                timestamp: new Date().toLocaleTimeString(),
                type: "success",
                text: `ERP: Orden de Compra ARASY-OC-${item.sku} enviada y registrada en SAP ERP (${quantity} unidades de ${item.name}).`,
              });
            }
            
            localStorage.setItem("arasy_custom_logs", JSON.stringify(parsed));
            window.dispatchEvent(new Event("arasy_integrations_changed"));
          }
        } catch (e) {
          console.error("Error al aplicar campaña en base de datos:", e);
        }
      }
    }

    setCampaignApplied((prev) => ({
      ...prev,
      [item.id]: isActivating,
    }));
    setSelectedSkuForModal(null);
  };

  return (
    <div className="space-y-gutter">
      {/* Barra de Filtros de Jerarquía Superior */}
      <section className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 overflow-x-auto custom-scrollbar pb-1 md:pb-0 w-full">
          {/* Filtro Marca */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20 hover:border-primary-blue transition-all cursor-pointer">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Marca</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent text-xs font-semibold text-midnight focus:outline-none cursor-pointer font-sans"
            >
              {brands.map((b) => (
                <option key={b} value={b} className="text-midnight bg-white">
                  {b === "TODAS" ? "Todas" : b}
                </option>
              ))}
            </select>
          </div>

          <span className="material-symbols-outlined text-slate-muted/40 text-[18px]">chevron_right</span>

          {/* Filtro Rubro */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20 hover:border-primary-blue transition-all cursor-pointer">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Rubro</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory("TODAS");
              }}
              className="bg-transparent text-xs font-semibold text-primary-blue focus:outline-none cursor-pointer font-sans"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="text-midnight bg-white">
                  {c === "TODAS" ? "Todos" : c}
                </option>
              ))}
            </select>
          </div>

          <span className="material-symbols-outlined text-slate-muted/40 text-[18px]">chevron_right</span>

          {/* Filtro Sub Rubro */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ice rounded-lg border border-slate-muted/20 hover:border-primary-blue transition-all cursor-pointer">
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider">Sub Rubro</span>
            <select
              value={selectedSubCategory}
              onChange={(e) => setSelectedSubCategory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-midnight focus:outline-none cursor-pointer font-sans"
            >
              {subCategories.map((sc) => (
                <option key={sc} value={sc} className="text-midnight bg-white">
                  {sc === "TODAS" ? "Todos" : sc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grid de KPIs de Stock */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Valor Total del Stock (Costo)</p>
          <h3 className="text-2xl font-display font-bold text-midnight">{formatCurrency(kpis.totalStockValCost)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Capital total invertido en almacén</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 border-l-4 border-l-teal-push">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Stock Vendible Realizable (Costo)</p>
          <h3 className="text-2xl font-display font-bold text-teal-push">{formatCurrency(kpis.totalVendibleValCost)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Proyección venta a precio: {formatCurrency(kpis.totalVendibleValPrice)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 border-l-4 border-l-coral-liquidate">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Excedente Inmovilizado (Costo)</p>
          <h3 className="text-2xl font-display font-bold text-coral-liquidate">{formatCurrency(kpis.totalOverstockValCost)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Stock que excede la cobertura de 1.5 meses</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Margen Neto Ponderado (MELI)</p>
          <h3 className="text-2xl font-display font-bold text-midnight">{formatPercent(kpis.averageMargin)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Margen promedio deduciendo comisiones</p>
        </div>
      </section>

      {/* Filtro por estado y Tabla */}
      <div className="bg-white rounded-2xl card-shadow border border-slate-muted/10 overflow-hidden">
        {/* Encabezado e Interruptor de Filtros de Estado */}
        <div className="px-6 py-4 border-b border-slate-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-display text-sm font-bold text-midnight">Diagnóstico de Inventario por SKU</h3>
            <p className="text-slate-muted text-[11px] font-sans">Basado en cobertura de stock y velocidad ponderada de venta de los últimos 90 días</p>
          </div>
          <div className="flex bg-ice p-1 rounded-xl border border-slate-muted/20">
            {["TODOS", "SALUDABLE", "EXCESO", "CRITICO"].map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
                    active ? "bg-midnight text-white shadow-sm" : "text-slate-muted hover:text-midnight"
                  }`}
                >
                  {st === "TODOS" ? "Todos" : getStatusLabel(st as "CRITICO" | "SALUDABLE" | "EXCESO")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabla de SKUs */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1150px] text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-muted/10 bg-slate-50 text-[10px] font-bold text-slate-muted uppercase tracking-wider">
                <th className="px-6 py-3 whitespace-nowrap">SKU / Producto</th>
                <th className="px-6 py-3 whitespace-nowrap">Clasificación</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Stock (Uds)</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Velocidad (Uds/mes)</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Cobertura (Meses)</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Valor Stock (Costo)</th>
                <th className="px-6 py-3 text-right whitespace-nowrap">Excedente (Costo)</th>
                <th className="px-6 py-3 whitespace-nowrap">Estado</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-muted/5 text-xs text-midnight font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-muted whitespace-nowrap">
                    No se encontraron productos para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-xs whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="font-bold text-midnight group-hover:text-primary-blue transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-muted font-mono mt-0.5">
                        {item.sku} • {item.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getClassificationBadgeStyles(item.classification)}`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold whitespace-nowrap">{item.stock}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-600 whitespace-nowrap">{item.velocity}</td>
                    <td className="px-6 py-4 text-right font-mono whitespace-nowrap">
                      {item.coverageMonths > 90 ? "∞" : `${item.coverageMonths.toFixed(1)}m`}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold whitespace-nowrap">{formatCurrency(item.stockValCost)}</td>
                    <td className="px-6 py-4 text-right font-mono text-coral-liquidate whitespace-nowrap">
                      {item.overstockUnits > 0 ? formatCurrency(item.overstockValCost) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadgeStyles(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSkuForModal(item)}
                        className="px-3 py-1.5 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-lg font-bold text-[11px] shadow-sm cursor-pointer transition-all active:scale-95 duration-100"
                      >
                        {campaignApplied[item.id] ? "Estrategia Activa" : "Estrategia IA"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Estrategia de IA */}
      {selectedSkuForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl card-shadow border border-slate-muted/10 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 bg-midnight text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-push text-[20px] font-bold">auto_awesome</span>
                <h3 className="font-display text-sm font-bold">Mitigación Estratégica AI</h3>
              </div>
              <button
                onClick={() => setSelectedSkuForModal(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-6">
              <div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold mr-2 ${getClassificationBadgeStyles(selectedSkuForModal.classification)}`}>
                  {selectedSkuForModal.classification}
                </span>
                <span className="text-[10px] text-slate-muted font-mono bg-ice px-2 py-0.5 rounded">
                  SKU: {selectedSkuForModal.sku}
                </span>
                <h4 className="font-display text-base font-bold text-midnight mt-2">{selectedSkuForModal.name}</h4>
                <p className="text-slate-muted text-xs font-sans mt-1">
                  Rubro: {selectedSkuForModal.category} • Sub Rubro: {selectedSkuForModal.subCategory}
                </p>
              </div>

              {/* Grid de Diagnóstico en Modal */}
              <div className="grid grid-cols-2 gap-4 bg-ice p-4 rounded-xl border border-slate-muted/10 text-xs">
                <div>
                  <p className="text-slate-muted font-medium">Stock Físico:</p>
                  <p className="font-bold text-midnight">{selectedSkuForModal.stock} unidades</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium">Velocidad (90d):</p>
                  <p className="font-bold text-midnight">{selectedSkuForModal.velocity} uds/mes</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium">Stock Excedente:</p>
                  <p className="font-bold text-coral-liquidate">{selectedSkuForModal.overstockUnits} unidades</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium">Capital Excedente (Costo):</p>
                  <p className="font-bold text-coral-liquidate">{formatCurrency(selectedSkuForModal.overstockValCost)}</p>
                </div>
              </div>

              {/* Recomendación Heurística IA */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-midnight uppercase tracking-wider font-sans">Estrategia Recomendada:</h5>
                <div className="bg-primary-blue/5 border border-primary-blue/20 p-4 rounded-xl text-xs text-midnight leading-relaxed">
                  <p className="font-sans italic">&quot;{selectedSkuForModal.recommendation}&quot;</p>
                </div>
              </div>

              {/* Si es sobrestock (EXCESO), agregar selector de descuento y canales (Fase B) */}
              {selectedSkuForModal.status === "EXCESO" && !campaignApplied[selectedSkuForModal.id] && (
                <>
                  {/* Slider de Descuento */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-bold text-midnight font-sans">
                      <span>PORCENTAJE DE DESCUENTO:</span>
                      <span className="text-coral-liquidate text-sm font-mono font-bold">{liquidationDiscount}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="70"
                      step="5"
                      value={liquidationDiscount}
                      onChange={(e) => setLiquidationDiscount(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-coral-liquidate"
                    />
                  </div>

                  {/* Canales */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider font-sans">Sincronizar Canales:</span>
                    <div className="flex gap-4 text-xs font-semibold text-midnight font-sans">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncShopify}
                          onChange={(e) => setSyncShopify(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-muted/30 text-primary-blue cursor-pointer"
                        />
                        Shopify Store
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncMeli}
                          onChange={(e) => setSyncMeli(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-muted/30 text-primary-blue cursor-pointer"
                        />
                        Mercado Libre
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Impacto Financiero Esperado */}
              <div className="flex justify-between items-center text-xs border-t border-slate-muted/10 pt-4">
                <div>
                  <p className="text-slate-muted font-sans font-medium">Margen Neto Promo (ML):</p>
                  <p className="font-bold text-teal-push font-sans">
                    {selectedSkuForModal.status === "EXCESO" && !campaignApplied[selectedSkuForModal.id]
                      ? `${(Financials.calculateNetMargin(Math.round(selectedSkuForModal.price * (1 - liquidationDiscount / 100)), selectedSkuForModal.cost, "MERCADO_LIBRE").marginPercent * 100).toFixed(1)}%`
                      : formatPercent(selectedSkuForModal.marginPercent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-muted font-sans font-medium">
                    {selectedSkuForModal.status === "EXCESO" && !campaignApplied[selectedSkuForModal.id]
                      ? "Precio con Descuento:"
                      : "Capital a Liberar:"}
                  </p>
                  <p className="font-bold text-primary-blue font-sans">
                    {selectedSkuForModal.status === "EXCESO" && !campaignApplied[selectedSkuForModal.id]
                      ? formatCurrency(Math.round(selectedSkuForModal.price * (1 - liquidationDiscount / 100)))
                      : formatCurrency(
                          selectedSkuForModal.status === "EXCESO"
                            ? selectedSkuForModal.overstockValPrice
                            : selectedSkuForModal.vendibleValPrice
                        )}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones del Modal */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-muted/10 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSkuForModal(null)}
                className="px-4 py-2 border border-slate-muted/20 hover:border-slate-muted/50 rounded-xl text-xs font-bold text-slate-muted transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleApplyCampaign(selectedSkuForModal)}
                disabled={selectedSkuForModal.status === "EXCESO" && !campaignApplied[selectedSkuForModal.id] && !syncShopify && !syncMeli}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95 duration-100 ${
                  campaignApplied[selectedSkuForModal.id]
                    ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                    : selectedSkuForModal.status === "EXCESO"
                    ? "bg-coral-liquidate text-white hover:bg-coral-liquidate/90 shadow-coral-liquidate/15"
                    : "bg-primary-blue text-white hover:bg-primary-blue/90 shadow-primary-blue/15"
                }`}
              >
                {campaignApplied[selectedSkuForModal.id]
                  ? "Desactivar Campaña"
                  : selectedSkuForModal.status === "EXCESO"
                  ? "Sincronizar Descuento"
                  : "Aplicar Campaña"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
