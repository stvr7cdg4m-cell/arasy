"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Financials } from "@/lib/business-logic/financials";

export interface PlanningItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  cost: number;
  price: number;
  stock: number;
  agingInDays: number;
  coverageInDays: number;
  classification: string;
  decision: string;
  aiInsight: string;
  impactValue: number;
  suggestedUnits: number;
  m1Sales: number;
  m2Sales: number;
  m3Sales: number;
}

interface ClientPlanningViewProps {
  initialItems: PlanningItem[];
  targetRevenue: number;
  selectedMonth: string;
  historyLabels: [string, string, string];
}

export default function ClientPlanningView({ initialItems, targetRevenue, selectedMonth, historyLabels }: ClientPlanningViewProps) {
  const [items, setItems] = useState<PlanningItem[]>(initialItems);
  const [filter, setFilter] = useState<string>("TODOS");
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados para Modal de Liquidación
  const [selectedItemForLiquidationModal, setSelectedItemForLiquidationModal] = useState<PlanningItem | null>(null);
  const [liquidationDiscount, setLiquidationDiscount] = useState<number>(15);
  const [syncShopify, setSyncShopify] = useState<boolean>(true);
  const [syncMeli, setSyncMeli] = useState<boolean>(true);

  // Estados para Modal de Revisión General (Fase C+)
  const [selectedItemForReviewModal, setSelectedItemForReviewModal] = useState<PlanningItem | null>(null);
  const [reviewQuantity, setReviewQuantity] = useState<number>(0);

  const handleReview = (item: PlanningItem) => {
    if (item.decision === "LIQUIDAR") {
      setSelectedItemForLiquidationModal(item);
      setLiquidationDiscount(15);
      setSyncShopify(true);
      setSyncMeli(true);
    } else {
      setSelectedItemForReviewModal(item);
      const currentQty = manualQuantities[item.id] !== undefined ? manualQuantities[item.id] : item.suggestedUnits;
      setReviewQuantity(currentQty);
    }
  };

  const handleSaveReview = () => {
    if (!selectedItemForReviewModal) return;
    const id = selectedItemForReviewModal.id;
    setManualQuantities(prev => ({
      ...prev,
      [id]: reviewQuantity
    }));
    handleExecute(id, reviewQuantity);
    setSelectedItemForReviewModal(null);
  };

  const showToast = (message: string) => {
    setToast({ message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Guardar Plan Comercial llamando a la API persistente
  const handleSavePlan = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/planning/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month: selectedMonth,
          targetRevenue: manualRevenue,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast("¡Plan comercial guardado! La meta del Dashboard ha sido actualizada.");
      } else {
        showToast(`Error al guardar: ${data.error || "desconocido"}`);
      }
    } catch {
      showToast("Error de conexión al guardar objetivos comerciales.");
    } finally {
      setSaving(false);
    }
  };

  // Ajustar todos los PLAN Q en base a porcentaje
  const handleBulkAdjust = (percent: number) => {
    setManualQuantities((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        const base = prev[item.id] !== undefined ? prev[item.id] : item.suggestedUnits;
        next[item.id] = Math.round(base * (1 + percent));
      });
      return next;
    });
    showToast(`Se ajustaron los objetivos de venta en un ${percent > 0 ? "+" : ""}${percent * 100}%`);
  };

  // Restablecer todo a la sugerencia sugerida por AI en base al historial
  const handleResetToAI = () => {
    setManualQuantities((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[item.id] = item.suggestedUnits;
      });
      return next;
    });
    showToast("Se restablecieron todos los PLAN Q a la sugerencia AI.");
  };

  // Estado para las cantidades de venta manuales planificadas (PLAN Q), inicializado con el sugerido AI
  const [manualQuantities, setManualQuantities] = useState<Record<string, number>>(() => {
    return initialItems.reduce((acc, item) => {
      acc[item.id] = item.suggestedUnits || 0;
      return acc;
    }, {} as Record<string, number>);
  });

  // Calcular métricas de ingresos agregadas reactivamente en base a las cantidades
  const suggestedRevenue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.suggestedUnits || 0) * item.price, 0);
  }, [items]);

  const manualRevenue = items.reduce((sum, item) => {
    const q = manualQuantities[item.id] !== undefined ? manualQuantities[item.id] : item.suggestedUnits;
    return sum + q * item.price;
  }, 0);

  const financialGap = manualRevenue - targetRevenue;

  // Estados para filtros de jerarquía
  const [selectedBrand, setSelectedBrand] = useState<string>("TODAS");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("TODAS");

  // Obtener opciones únicas de filtros dinámicamente
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

  // Filtrar ítems según filtros de jerarquía y botón de decisión
  const filteredItems = items.filter((item) => {
    const matchesDecision = filter === "TODOS" || item.decision === filter;
    const matchesBrand = selectedBrand === "TODAS" || item.brand === selectedBrand;
    const matchesCategory = selectedCategory === "TODAS" || item.category === selectedCategory;
    const matchesSubCategory = selectedSubCategory === "TODAS" || item.subCategory === selectedSubCategory;
    
    return matchesDecision && matchesBrand && matchesCategory && matchesSubCategory;
  });

  // Descargar Orden de Compra en formato CSV y guardar log en ERP
  const downloadPurchaseOrderCSV = (item: PlanningItem, quantity: number) => {
    const brandProviders: Record<string, string> = {
      ASUS: "ASUS Global Latam",
      LOGITECH: "Logitech Distributor Sur",
      LENOVO: "Lenovo Argentina S.A.",
      APPLE: "Apple Authorized Supplier",
      SAMSUNG: "Samsung Electronics Ar",
    };
    const provider = brandProviders[item.brand.toUpperCase()] || "Proveedor General ARASY";
    const dateStr = new Date().toLocaleDateString("es-AR");
    const total = quantity * item.cost;

    const rows = [
      ["Campo", "Valor"],
      ["Documento", `Orden de Compra (ARASY-OC-${item.sku})`],
      ["Fecha Emision", dateStr],
      ["Proveedor", provider],
      ["SKU", item.sku],
      ["Producto", item.name],
      ["Cantidad Solicitada", quantity.toString()],
      ["Costo Unitario (ARS)", item.cost.toString()],
      ["Total de la Orden (ARS)", total.toString()],
      ["Estado ERP", "REGISTRADO_EN_SAP"],
    ];

    const csvContent = "\uFEFF" + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `OC_${item.sku}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Guardar log personalizado en localStorage
    try {
      const customLogs = localStorage.getItem("arasy_custom_logs") || "[]";
      const parsed = JSON.parse(customLogs);
      parsed.push({
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        text: `ERP: Documento de Orden de Compra ARASY-OC-${item.sku} descargado en formato CSV.`,
      });
      localStorage.setItem("arasy_custom_logs", JSON.stringify(parsed));
      window.dispatchEvent(new Event("arasy_integrations_changed"));
    } catch (e) {
      console.error(e);
    }
    showToast(`¡CSV de Orden de Compra descargado para ${item.sku}!`);
  };

  // Confirmar la liquidación de stock desde el modal interactivo
  const handleConfirmLiquidation = async () => {
    if (!selectedItemForLiquidationModal) return;
    const item = selectedItemForLiquidationModal;
    const id = item.id;
    const plannedQty = manualQuantities[id] !== undefined ? manualQuantities[id] : item.suggestedUnits;
    const discount = liquidationDiscount;
    const discountedPrice = Math.round(item.price * (1 - discount / 100));

    try {
      const response = await fetch("/api/planning/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          decision: item.decision,
          quantity: plannedQty,
        }),
      });

      if (!response.ok) {
        showToast("Error al registrar decisión en la base de datos.");
        return;
      }

      window.dispatchEvent(new Event("arasy_alerts_updated"));
    } catch {
      showToast("Error de conexión al ejecutar decisión.");
      return;
    }

    setItems(prevItems => prevItems.map(prevItem => {
      if (prevItem.id === id) {
        const sellOff = Math.min(prevItem.stock, plannedQty);
        const updatedStock = prevItem.stock - sellOff;
        const dailyVelocity = (prevItem.suggestedUnits) / 30 || 1;
        const updatedCoverage = updatedStock / dailyVelocity;
        const updatedDecision = "MANTENER";
        const updatedAging = Math.max(0, prevItem.agingInDays - 60);
        const updatedInsight = `Liquidación confirmada. Se vendieron ${sellOff} uds de stock excedente en campaña de descuento (-${discount}%). Stock remanente: ${updatedStock} uds.`;

        return {
          ...prevItem,
          stock: updatedStock,
          decision: updatedDecision,
          coverageInDays: updatedCoverage,
          agingInDays: updatedAging,
          aiInsight: updatedInsight,
        };
      }
      return prevItem;
    }));

    setExecutedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Guardar log de liquidación en localStorage
    try {
      const customLogs = localStorage.getItem("arasy_custom_logs") || "[]";
      const parsed = JSON.parse(customLogs);
      const targetChannels = [];
      if (syncShopify) targetChannels.push("Shopify");
      if (syncMeli) targetChannels.push("Mercado Libre");
      
      parsed.push({
        timestamp: new Date().toLocaleTimeString(),
        type: "success",
        text: `Shopify/ML: Campaña de descuento (-${discount}%) sincronizada para ${item.sku} en ${targetChannels.join(" y ")}. Precio final: $${discountedPrice.toLocaleString("es-AR")}.`,
      });
      localStorage.setItem("arasy_custom_logs", JSON.stringify(parsed));
      window.dispatchEvent(new Event("arasy_integrations_changed"));
    } catch (e) {
      console.error(e);
    }

    setSelectedItemForLiquidationModal(null);
    showToast(`¡Liquidación activada para ${item.name}!`);
  };

  // Manejar ejecución de una decisión individual simulando el impacto operativo inmediato en el stock
  const handleExecute = async (id: string, overrideQty?: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const isCurrentlyExecuted = executedIds.has(id);

    if (isCurrentlyExecuted) {
      // Revertir a valores originales de stock, decisión e insight
      setItems(prevItems => prevItems.map(prevItem => {
        if (prevItem.id === id) {
          const original = initialItems.find(o => o.id === id);
          return original ? { ...original } : prevItem;
        }
        return prevItem;
      }));
      setExecutedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast(`Se revirtió la ejecución para ${item.sku} localmente.`);
      return;
    }

    // Interrumpir si es una decisión de tipo LIQUIDAR para abrir el modal interactivo
    if (item.decision === "LIQUIDAR") {
      setSelectedItemForLiquidationModal(item);
      setLiquidationDiscount(15);
      setSyncShopify(true);
      setSyncMeli(true);
      return;
    }

    // Ejecutar simulando reabastecimiento, liquidación o exclusión
    const plannedQty = overrideQty !== undefined 
      ? overrideQty 
      : (manualQuantities[id] !== undefined ? manualQuantities[id] : item.suggestedUnits);

    // Llamar al backend para persistir la decisión y resolver alertas
    try {
      const response = await fetch("/api/planning/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: id,
          decision: item.decision,
          quantity: plannedQty,
        }),
      });

      if (!response.ok) {
        showToast("Error al registrar decisión en la base de datos.");
        return;
      }

      // Disparar evento global para recargar alertas del Header
      window.dispatchEvent(new Event("arasy_alerts_updated"));
    } catch {
      showToast("Error de conexión al ejecutar decisión.");
      return;
    }

    setItems(prevItems => prevItems.map(prevItem => {
      if (prevItem.id === id) {
        let updatedStock = prevItem.stock;
        let updatedDecision = prevItem.decision;
        let updatedCoverage = prevItem.coverageInDays;
        const updatedAging = prevItem.agingInDays;
        let updatedInsight = prevItem.aiInsight;

        if (prevItem.decision === "EMPUJAR") {
          updatedStock = prevItem.stock + plannedQty;
          const dailyVelocity = (prevItem.suggestedUnits) / 30 || 1;
          updatedCoverage = updatedStock / dailyVelocity;
          updatedDecision = "MANTENER";
          updatedInsight = `Reposición simulada. Se generó Orden de Compra por ${plannedQty} uds. Stock incrementado a ${updatedStock} uds. Cobertura: ${Math.round(updatedCoverage)} días.`;
        } else if (prevItem.decision === "EXCLUIR") {
          updatedDecision = "EXCLUIDO";
          updatedInsight = `SKU Excluido de catálogos y campañas activas. Presupuesto optimizado.`;
        }

        return {
          ...prevItem,
          stock: updatedStock,
          decision: updatedDecision,
          coverageInDays: updatedCoverage,
          agingInDays: updatedAging,
          aiInsight: updatedInsight,
        };
      }
      return prevItem;
    }));

    setExecutedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Guardar log personalizado en localStorage para la decisión de reposición
    if (item.decision === "EMPUJAR") {
      try {
        const customLogs = localStorage.getItem("arasy_custom_logs") || "[]";
        const parsed = JSON.parse(customLogs);
        parsed.push({
          timestamp: new Date().toLocaleTimeString(),
          type: "success",
          text: `ERP: Orden de Compra ARASY-OC-${item.sku} enviada y registrada en SAP ERP (${plannedQty} unidades de ${item.name}).`,
        });
        localStorage.setItem("arasy_custom_logs", JSON.stringify(parsed));
        window.dispatchEvent(new Event("arasy_integrations_changed"));
      } catch (e) {
        console.error(e);
      }
    }

    let actionMessage = `¡Decisión para ${item.sku} ejecutada!`;
    if (item.decision === "EMPUJAR") {
      actionMessage = `¡Orden de compra enviada! +${plannedQty} uds de ${item.name}.`;
    } else if (item.decision === "EXCLUIR") {
      actionMessage = `¡Producto ${item.sku} excluido!`;
    }
    showToast(actionMessage);
  };

  // Manejar aprobación masiva de decisiones filtradas
  const handleExecuteAll = () => {
    const toExecute = filteredItems.filter(item => !executedIds.has(item.id));
    if (toExecute.length === 0) {
      showToast("No hay decisiones nuevas para ejecutar en los filtros seleccionados.");
      return;
    }

    toExecute.forEach(item => {
      handleExecute(item.id);
    });
    showToast(`Se ejecutaron ${toExecute.length} decisiones comerciales simultáneamente.`);
  };

  // Obtener estilo CSS de borde e icono según decisión
  const getDecisionStyles = (decision: string) => {
    switch (decision) {
      case "EMPUJAR":
        return {
          border: "border-l-4 border-l-teal-push",
          bg: "bg-teal-push/10 text-teal-push border-teal-push/20",
          label: "Empujar (Push)",
          icon: "bolt",
        };
      case "LIQUIDAR":
        return {
          border: "border-l-4 border-l-coral-liquidate",
          bg: "bg-coral-liquidate/10 text-coral-liquidate border-coral-liquidate/20",
          label: "Liquidar",
          icon: "trending_down",
        };
      case "EXCLUIR":
        return {
          border: "border-l-4 border-l-slate-muted",
          bg: "bg-slate-muted/10 text-slate-muted border-slate-muted/20",
          label: "Excluir",
          icon: "block",
        };
      default:
        return {
          border: "border-l-4 border-l-gold-maintain",
          bg: "bg-gold-maintain/10 text-gold-maintain border-gold-maintain/20",
          label: "Mantener",
          icon: "drag_handle",
        };
    }
  };

  return (
    <div className="space-y-gutter">
      {/* Barra de Filtros de Jerarquía Superior Dinámica */}
      <section className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0 w-full">
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

      {/* Grid de Planificación Financiera y Objetivos */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Meta Global Período</p>
          <h3 className="text-2xl font-display font-bold text-midnight">{formatCurrency(targetRevenue)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Presupuesto del período</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Sugerido AI de Ventas</p>
          <h3 className="text-2xl font-display font-bold text-primary-blue">{formatCurrency(suggestedRevenue)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Basado en velocidad de venta 90d</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 border-l-4 border-l-primary-blue">
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Plan Manual Acumulado</p>
          <h3 className="text-2xl font-display font-bold text-midnight">{formatCurrency(manualRevenue)}</h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">Suma de PLAN Q x Precio</p>
        </div>
        <div className={`bg-white p-6 rounded-2xl card-shadow border ${financialGap >= 0 ? "border-l-4 border-l-teal-push" : "border-l-4 border-l-coral-liquidate"}`}>
          <p className="text-[10px] font-bold text-slate-muted uppercase tracking-wider mb-2">Brecha / GAP Financiero</p>
          <h3 className={`text-2xl font-display font-bold ${financialGap >= 0 ? "text-teal-push" : "text-coral-liquidate"}`}>
            {financialGap >= 0 ? `+${formatCurrency(financialGap)}` : formatCurrency(financialGap)}
          </h3>
          <p className="text-[10px] text-slate-muted font-semibold mt-1">
            {financialGap >= 0 ? "¡Meta mensual superada!" : "Falta para alcanzar la meta"}
          </p>
        </div>
      </section>

      {/* Filtro y Acciones Rápidas */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-2xl card-shadow border border-slate-muted/10">
        <div className="flex flex-wrap gap-2">
          {["TODOS", "EMPUJAR", "MANTENER", "LIQUIDAR", "EXCLUIR"].map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-sans font-bold cursor-pointer transition-all ${
                  isActive
                    ? "bg-midnight text-white shadow-md"
                    : "bg-ice text-slate-muted hover:bg-slate-muted/10"
                }`}
              >
                {f === "TODOS" ? "Todos" : f}
              </button>
            );
          })}
        </div>

        {/* Acciones de Lote y Guardado */}
        <div className="flex flex-wrap gap-2 items-center w-full xl:w-auto">
          {/* Ajuste Rápido de Objetivos */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-ice rounded-xl border border-slate-muted/20 text-xs font-bold text-midnight">
            <span className="text-[10px] text-slate-muted uppercase font-sans">Ajustar Todo:</span>
            <button
              onClick={() => handleBulkAdjust(0.10)}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 rounded border border-slate-muted/20 cursor-pointer text-[10px] font-bold active:scale-95"
            >
              +10%
            </button>
            <button
              onClick={() => handleBulkAdjust(-0.10)}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 rounded border border-slate-muted/20 cursor-pointer text-[10px] font-bold active:scale-95"
            >
              -10%
            </button>
            <button
              onClick={handleResetToAI}
              className="px-2 py-0.5 bg-white hover:bg-slate-100 rounded border border-slate-muted/20 cursor-pointer text-[10px] font-bold active:scale-95"
            >
              Reset AI
            </button>
          </div>

          <button
            onClick={handleExecuteAll}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-midnight hover:bg-midnight/90 text-white rounded-xl font-bold text-xs cursor-pointer active:scale-95 duration-100 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            Ejecutar Decisiones
          </button>

          <button
            onClick={handleSavePlan}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl font-bold text-xs shadow-md shadow-primary-blue/15 cursor-pointer active:scale-95 duration-100 disabled:bg-primary-blue/50"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            {saving ? "Guardando..." : "Guardar Plan Comercial"}
          </button>
        </div>
      </div>

      {/* Lista de Decisiones */}
      <div className="space-y-4">
        <h3 className="font-display text-sm font-bold text-midnight pl-1">
          Pipeline de Decisiones ({filteredItems.length} SKUs)
        </h3>

        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-muted/10 card-shadow">
            <span className="material-symbols-outlined text-slate-muted text-4xl mb-2">
              inbox
            </span>
            <p className="text-slate-muted text-sm font-sans">
              No hay decisiones pendientes para esta categoría.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const styles = getDecisionStyles(item.decision);
            const isExecuted = executedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all duration-300 group border border-slate-muted/5 ${
                  styles.border
                } ${isExecuted ? "opacity-60 bg-slate-50" : ""}`}
              >
                {/* Contenido Izquierdo */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles.bg}`}
                    >
                      {styles.label}
                    </span>
                    <span className="text-[10px] text-slate-muted font-mono bg-ice px-2 py-0.5 rounded">
                      SKU: {item.sku}
                    </span>
                    <span className="text-[10px] text-slate-muted font-sans font-medium">
                      {item.brand} • {item.category} • {item.subCategory}
                    </span>
                  </div>
                  <h4 className="font-display text-sm font-bold text-midnight group-hover:text-primary-blue transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-slate-muted text-xs font-sans leading-relaxed">
                    {item.aiInsight}
                  </p>

                  {/* Historial de Ventas de los últimos 3 meses */}
                  <div className="mt-3 pt-2.5 border-t border-slate-muted/15 flex items-center gap-4 text-[10px] text-slate-muted font-sans font-medium">
                    <span className="font-bold uppercase tracking-wider text-[8px] bg-ice px-1.5 py-0.5 rounded text-midnight">Historial Ventas:</span>
                    <span>{historyLabels[2] || "M-3"}: <strong className="font-mono text-midnight">{item.m3Sales || 0}</strong> u.</span>
                    <span className="text-slate-muted/20">•</span>
                    <span>{historyLabels[1] || "M-2"}: <strong className="font-mono text-midnight">{item.m2Sales || 0}</strong> u.</span>
                    <span className="text-slate-muted/20">•</span>
                    <span>{historyLabels[0] || "M-1"}: <strong className="font-mono text-midnight">{item.m1Sales || 0}</strong> u.</span>
                  </div>
                </div>

                {/* Planificación de Unidades (Sugerido vs Manual) */}
                <div className="flex flex-col justify-center gap-2.5 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-muted/10 pt-4 md:pt-0 md:px-6 font-sans text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-muted font-medium">Sugerido AI (90d):</span>
                    <span className="font-bold font-mono text-midnight">{item.suggestedUnits} uds.</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-muted text-[11px]">
                    <span>Valuación AI:</span>
                    <span>{formatCurrency(item.suggestedUnits * item.price)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-bold text-midnight">PLAN Q:</span>
                    <div className="flex items-center border border-slate-muted/30 rounded-lg overflow-hidden bg-ice">
                      <button
                        onClick={() => {
                          setManualQuantities((prev) => ({
                            ...prev,
                            [item.id]: Math.max(0, (prev[item.id] ?? item.suggestedUnits) - 1),
                          }));
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border-r border-slate-muted/30 font-bold text-midnight cursor-pointer transition-colors active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        pattern="[0-9]*"
                        value={manualQuantities[item.id] ?? item.suggestedUnits}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                          setManualQuantities((prev) => ({
                            ...prev,
                            [item.id]: isNaN(val) ? 0 : val,
                          }));
                        }}
                        className="w-12 text-center bg-transparent border-none text-xs font-bold font-mono text-midnight focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          setManualQuantities((prev) => ({
                            ...prev,
                            [item.id]: (prev[item.id] ?? item.suggestedUnits) + 1,
                          }));
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 border-l border-slate-muted/30 font-bold text-midnight cursor-pointer transition-colors active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center font-bold border-t border-dashed border-slate-muted/20 pt-1.5 mt-0.5">
                    <span className="text-midnight">Ingreso Plan:</span>
                    <span className="text-primary-blue">{formatCurrency(((manualQuantities[item.id] ?? item.suggestedUnits)) * item.price)}</span>
                  </div>
                </div>

                {/* Impacto Económico */}
                <div className="flex flex-col justify-center items-start md:items-end gap-0.5 min-w-[160px] border-t md:border-t-0 md:border-l border-slate-muted/10 pt-4 md:pt-0 md:pl-6">
                  <p className="text-[10px] font-bold text-slate-muted uppercase font-sans">
                    {item.decision === "LIQUIDAR"
                      ? "Capital a Liberar"
                      : item.decision === "EXCLUIR"
                      ? "Ahorro Estimado"
                      : "Impacto Estimado"}
                  </p>
                  <p
                    className={`font-display text-lg font-bold ${
                      item.decision === "LIQUIDAR"
                        ? "text-coral-liquidate"
                        : item.decision === "EXCLUIR"
                        ? "text-slate-muted"
                        : "text-teal-push"
                    }`}
                  >
                    {item.decision === "MANTENER"
                      ? "Estable"
                      : `+${formatCurrency(item.impactValue)}`}
                  </p>
                  <p className="text-[9px] text-slate-muted font-sans">Proyección 30 Días</p>
                </div>

                {/* Acciones */}
                <div className="flex md:flex-col gap-2 justify-center shrink-0 min-w-[130px]">
                  <button
                    onClick={() => handleExecute(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100 ${
                      isExecuted
                        ? "bg-slate-200 text-slate-500 hover:bg-slate-300"
                        : item.decision === "LIQUIDAR"
                        ? "bg-coral-liquidate text-white hover:bg-coral-liquidate/90"
                        : "bg-primary-blue text-white hover:bg-primary-blue/90"
                    }`}
                  >
                    {isExecuted ? "Deshacer" : "Ejecutar"}
                  </button>
                  {isExecuted && initialItems.find((o) => o.id === item.id)?.decision === "EMPUJAR" ? (
                    <button
                      onClick={() => downloadPurchaseOrderCSV(item, manualQuantities[item.id] !== undefined ? manualQuantities[item.id] : item.suggestedUnits)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1 font-sans"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Descargar OC
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReview(item)}
                      className="px-4 py-2 border border-slate-muted/20 hover:border-slate-muted/50 rounded-xl text-xs font-bold text-slate-muted hover:text-midnight transition-colors cursor-pointer active:scale-95 font-sans"
                    >
                      Revisar
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sugerencias Bento Adicionales */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl card-shadow border border-slate-muted/10 overflow-hidden relative">
          <div className="relative z-10 max-w-md space-y-4">
            <h3 className="font-display text-sm font-bold text-midnight">
              Proyecciones Estratégicas AI
            </h3>
            <p className="text-slate-muted text-xs font-sans leading-relaxed">
              Nuestro modelo predictivo analiza más de 2.4 millones de registros del rubro de tecnología y periféricos para determinar estas alertas. Aplica las decisiones recomendadas para optimizar el capital inmovilizado.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-blue rounded-full"></div>
                <span className="text-[10px] text-midnight font-bold font-sans">
                  Fuerza de Tendencia: 88%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-push rounded-full"></div>
                <span className="text-[10px] text-midnight font-bold font-sans">
                  Salud de Inventario: Óptima
                </span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-primary-blue/5 to-transparent flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[120px] opacity-10 text-primary-blue select-none">
              insights
            </span>
          </div>
        </div>

        <div className="bg-midnight p-8 rounded-2xl card-shadow text-white flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-teal-push flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-push text-[20px] font-bold">
                auto_awesome
              </span>
              Sugerencia de Copiloto IA
            </h3>
            <p className="text-white/80 text-xs font-sans italic leading-relaxed">
              &quot;He detectado un patrón recurrente: la marca Asus en Notebooks (Notebook Asus ROG Strix G16) tiene alta rotación pero stock crítico. Recomiendo crear un combo junto al Mouse Logitech MX Master 3S para impulsar el ticket promedio y aliviar la brecha.&quot;
            </p>
          </div>
          <button className="mt-6 w-full py-3 bg-primary-blue hover:bg-primary-blue/90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-100 shadow-lg shadow-primary-blue/20">
            Generar Combo Estratégico
          </button>
        </div>
      </section>

      {/* Modal de Liquidación Interactivo (Fase B) */}
      {selectedItemForLiquidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl card-shadow border border-slate-muted/10 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabecera */}
            <div className="px-6 py-4 bg-midnight text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-coral-liquidate text-[20px] font-bold">trending_down</span>
                <h3 className="font-display text-sm font-bold text-white">Sincronizar Campaña de Liquidación</h3>
              </div>
              <button
                onClick={() => setSelectedItemForLiquidationModal(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              <div>
                <span className="text-[10px] text-slate-muted font-mono bg-ice px-2 py-0.5 rounded">
                  SKU: {selectedItemForLiquidationModal.sku}
                </span>
                <h4 className="font-display text-base font-bold text-midnight mt-2">{selectedItemForLiquidationModal.name}</h4>
                <p className="text-slate-muted text-xs font-sans mt-1">
                  Marca: {selectedItemForLiquidationModal.brand} • Stock Físico: {selectedItemForLiquidationModal.stock} unidades
                </p>
              </div>

              {/* Slider de Descuento */}
              <div className="space-y-2">
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

              {/* Comparación de Margen y Precios */}
              <div className="grid grid-cols-2 gap-4 bg-ice p-4 rounded-xl border border-slate-muted/10 text-xs">
                <div>
                  <p className="text-slate-muted font-medium font-sans">Precio Lista:</p>
                  <p className="font-bold text-midnight font-sans">{formatCurrency(selectedItemForLiquidationModal.price)}</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium font-sans">Precio Descontado:</p>
                  <p className="font-bold text-coral-liquidate font-sans">
                    {formatCurrency(Math.round(selectedItemForLiquidationModal.price * (1 - liquidationDiscount / 100)))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium font-sans">Margen Neto Original:</p>
                  <p className="font-bold text-midnight font-mono">
                    {(Financials.calculateNetMargin(selectedItemForLiquidationModal.price, selectedItemForLiquidationModal.cost, "MERCADO_LIBRE").marginPercent * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium font-sans">Margen Neto Promo (ML):</p>
                  <p className="font-bold text-coral-liquidate font-mono">
                    {(Financials.calculateNetMargin(Math.round(selectedItemForLiquidationModal.price * (1 - liquidationDiscount / 100)), selectedItemForLiquidationModal.cost, "MERCADO_LIBRE").marginPercent * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Checkboxes de Canales */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-muted uppercase tracking-wider font-sans">Canales de Destino:</h5>
                <div className="flex gap-6 text-xs text-midnight font-medium font-sans">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncShopify}
                      onChange={(e) => setSyncShopify(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-muted/30 text-primary-blue focus:ring-primary-blue cursor-pointer"
                    />
                    Shopify Store
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncMeli}
                      onChange={(e) => setSyncMeli(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-muted/30 text-primary-blue focus:ring-primary-blue cursor-pointer"
                    />
                    Mercado Libre
                  </label>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-muted/10 flex justify-end gap-3">
              <button
                onClick={() => setSelectedItemForLiquidationModal(null)}
                className="px-4 py-2 border border-slate-muted/20 hover:border-slate-muted/50 rounded-xl text-xs font-bold text-slate-muted transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmLiquidation}
                disabled={!syncShopify && !syncMeli}
                className="px-4 py-2 bg-coral-liquidate disabled:bg-slate-200 disabled:text-slate-muted text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-coral-liquidate/15 active:scale-95 duration-100"
              >
                Sincronizar con Canales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revisión General (Fase C+) */}
      {selectedItemForReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl card-shadow border border-slate-muted/10 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Cabecera */}
            <div className="px-6 py-4 bg-midnight text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-blue text-[20px] font-bold">
                  {selectedItemForReviewModal.decision === "EMPUJAR" ? "shopping_cart" : "info"}
                </span>
                <h3 className="font-display text-sm font-bold text-white">
                  {selectedItemForReviewModal.decision === "EMPUJAR"
                    ? "Revisar Sugerencia de Reposición"
                    : selectedItemForReviewModal.decision === "EXCLUIR"
                    ? "Revisar Sugerencia de Exclusión"
                    : "Revisar Estado del SKU"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForReviewModal(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              <div>
                <span className="text-[10px] text-slate-muted font-mono bg-ice px-2 py-0.5 rounded">
                  SKU: {selectedItemForReviewModal.sku}
                </span>
                <h4 className="font-display text-base font-bold text-midnight mt-2">{selectedItemForReviewModal.name}</h4>
                <p className="text-slate-muted text-xs font-sans mt-1">
                  Marca: {selectedItemForReviewModal.brand} • Stock Físico: {selectedItemForReviewModal.stock} unidades
                </p>
              </div>

              {/* Detalle Financiero */}
              <div className="grid grid-cols-3 gap-4 bg-ice p-4 rounded-xl border border-slate-muted/10 text-xs">
                <div>
                  <p className="text-slate-muted font-medium font-sans">Costo Unitario:</p>
                  <p className="font-bold text-midnight font-sans">{formatCurrency(selectedItemForReviewModal.cost)}</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium font-sans">Precio Venta:</p>
                  <p className="font-bold text-midnight font-sans">{formatCurrency(selectedItemForReviewModal.price)}</p>
                </div>
                <div>
                  <p className="text-slate-muted font-medium font-sans">Margen Unitario:</p>
                  <p className="font-bold text-primary-blue font-mono">
                    {(((selectedItemForReviewModal.price - selectedItemForReviewModal.cost) / selectedItemForReviewModal.price) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Historial de Ventas */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-slate-muted uppercase tracking-wider font-sans">Ventas Recientes (Últimos 3 Meses):</h5>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-muted/10">
                    <p className="text-[9px] text-slate-muted uppercase font-sans">{historyLabels[2] || "M-3"}</p>
                    <p className="text-sm font-bold text-midnight font-mono">{selectedItemForReviewModal.m3Sales} uds</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-muted/10">
                    <p className="text-[9px] text-slate-muted uppercase font-sans">{historyLabels[1] || "M-2"}</p>
                    <p className="text-sm font-bold text-midnight font-mono">{selectedItemForReviewModal.m2Sales} uds</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-muted/10">
                    <p className="text-[9px] text-slate-muted uppercase font-sans">{historyLabels[0] || "M-1"}</p>
                    <p className="text-sm font-bold text-midnight font-mono">{selectedItemForReviewModal.m1Sales} uds</p>
                  </div>
                </div>
              </div>

              {/* AI Insight */}
              <div className="bg-primary-blue/5 border border-primary-blue/20 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-primary-blue font-bold text-[10px] uppercase font-sans">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  Sugerencia del Copiloto AI
                </div>
                <p className="text-slate-muted text-xs font-sans leading-relaxed">
                  {selectedItemForReviewModal.aiInsight}
                </p>
              </div>

              {/* Modificación de cantidad si es Reposición */}
              {selectedItemForReviewModal.decision === "EMPUJAR" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-muted uppercase tracking-wider font-sans block">
                    Cantidad a Reponer:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setReviewQuantity(prev => Math.max(0, prev - 1))}
                      className="w-10 h-10 bg-ice hover:bg-slate-200 border border-slate-muted/20 text-midnight rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">remove</span>
                    </button>
                    <input
                      type="number"
                      value={reviewQuantity}
                      onChange={(e) => setReviewQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full h-10 bg-slate-50 border border-slate-muted/20 rounded-xl px-4 text-center text-sm font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 font-mono"
                    />
                    <button
                      onClick={() => setReviewQuantity(prev => prev + 1)}
                      className="w-10 h-10 bg-ice hover:bg-slate-200 border border-slate-muted/20 text-midnight rounded-xl font-bold flex items-center justify-center cursor-pointer transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">add</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-muted/10 flex justify-end gap-3">
              <button
                onClick={() => setSelectedItemForReviewModal(null)}
                className="px-4 py-2 border border-slate-muted/20 hover:border-slate-muted/50 rounded-xl text-xs font-bold text-slate-muted transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={handleSaveReview}
                className="px-4 py-2 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary-blue/15 active:scale-95 duration-100"
              >
                {selectedItemForReviewModal.decision === "EMPUJAR"
                  ? "Aprobar y Ejecutar Orden"
                  : selectedItemForReviewModal.decision === "EXCLUIR"
                  ? "Confirmar Exclusión"
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-midnight/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl card-shadow border border-white/10 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <span className="material-symbols-outlined text-teal-push">check_circle</span>
          <span className="text-xs font-sans font-bold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
