"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { calculateMixMetrics, SkuMixItem } from "@/lib/business-logic/mixEngine";

export interface ExtendedSkuMixItem extends SkuMixItem {
  id: string;
  originalCost: number;
  originalPrice: number;
  originalTargetUnits: number;
  classification: string;
  decision: string;
  agingInDays: number;
}

interface ClientMixOptimizerProps {
  initialItems: ExtendedSkuMixItem[];
  targetRevenue: number;
  targetMargin: number;
}

export default function ClientMixOptimizer({
  initialItems,
  targetRevenue,
  targetMargin,
}: ClientMixOptimizerProps) {
  // Estado principal de la simulación
  const [items, setItems] = useState<ExtendedSkuMixItem[]>(initialItems);
  
  // Filtros y búsquedas
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("TODAS");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  
  interface SavedScenario {
    id: string;
    name: string;
    weightedMargin: number;
    targetMargin: number;
    totalRevenue: number;
    totalCost: number;
    itemsJson: string;
    createdAt?: string;
    date?: string;
  }

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Obtener opciones únicas de filtros
  const brands = useMemo(() => {
    const list = new Set(initialItems.map((item) => item.brand));
    return ["TODAS", ...Array.from(list)];
  }, [initialItems]);

  const categories = useMemo(() => {
    const list = new Set(initialItems.map((item) => item.category));
    return ["TODAS", ...Array.from(list)];
  }, [initialItems]);

  const getElasticityCoefficient = (brand: string, category: string): number => {
    const brandLower = brand.toLowerCase();
    const catLower = category.toLowerCase();
    
    if (brandLower.includes("apple") || brandLower.includes("samsung")) {
      return -0.8; // Más inelástico
    }
    if (catLower.includes("notebook") || catLower.includes("monitor")) {
      return -1.5; // Elástico estándar
    }
    if (catLower.includes("perif") || catLower.includes("audio") || brandLower.includes("logitech")) {
      return -2.0; // Muy elástico
    }
    return -1.5;
  };

  // Manejar cambios en inputs de la tabla
  const handleInputChange = (
    id: string,
    field: "price" | "cost" | "targetUnits",
    value: number
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          // Asegurarse de que no sea negativo
          const cleanValue = Math.max(0, value);
          const updatedFields: Partial<ExtendedSkuMixItem> = {
            [field]: cleanValue,
          };

          // Aplicar elasticidad precio-demanda (Fase C)
          if (field === "price" && item.originalPrice > 0) {
            const priceDeltaPercent = (cleanValue - item.originalPrice) / item.originalPrice;
            const elasticity = getElasticityCoefficient(item.brand, item.category);
            const quantityDeltaPercent = elasticity * priceDeltaPercent;
            // Calcular nuevas unidades objetivo redondeadas, sin bajar de cero
            updatedFields.targetUnits = Math.max(
              0,
              Math.round(item.originalTargetUnits * (1 + quantityDeltaPercent))
            );
          }

          return {
            ...item,
            ...updatedFields,
          };
        }
        return item;
      })
    );
  };

  // Restaurar una fila a su estado original
  const handleResetRow = (id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            cost: item.originalCost,
            price: item.originalPrice,
            targetUnits: item.originalTargetUnits,
          };
        }
        return item;
      })
    );
  };

  // Restaurar todos los productos
  const handleResetAll = () => {
    setItems(
      initialItems.map((item) => ({
        ...item,
        cost: item.originalCost,
        price: item.originalPrice,
        targetUnits: item.originalTargetUnits,
      }))
    );
  };

  // Cálculos dinámicos utilizando el motor de negocio
  const currentMetrics = useMemo(() => {
    return calculateMixMetrics(items, targetRevenue, targetMargin);
  }, [items, targetRevenue, targetMargin]);

  // Métricas del estado original (para comparar)
  const originalMetrics = useMemo(() => {
    const mappedOriginals = items.map((item) => ({
      ...item,
      cost: item.originalCost,
      price: item.originalPrice,
      targetUnits: item.originalTargetUnits,
    }));
    return calculateMixMetrics(mappedOriginals, targetRevenue, targetMargin);
  }, [items, targetRevenue, targetMargin]);

  // Filtrar ítems para mostrar en la tabla
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchesBrand = selectedBrand === "TODAS" || item.brand === selectedBrand;
    const matchesCategory =
      selectedCategory === "TODAS" || item.category === selectedCategory;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  // Guardar el escenario de mix optimizado en BD
  const handleSaveScenario = async () => {
    if (!scenarioName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/mixes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: scenarioName,
          weightedMargin: currentMetrics.weightedMargin,
          targetMargin: targetMargin,
          totalRevenue: currentMetrics.totalRevenue,
          totalCost: currentMetrics.totalCost,
          items: items.map((it) => ({
            sku: it.sku,
            name: it.name,
            cost: it.cost,
            price: it.price,
            targetUnits: it.targetUnits,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedScenarios((prev) => [data.mix, ...prev]);
        setSaveSuccess(true);
        setScenarioName("");
        setTimeout(() => {
          setSaveSuccess(false);
          setIsSaveModalOpen(false);
        }, 2000);
      } else {
        console.error("Error al guardar el escenario");
      }
    } catch (err) {
      console.error("Fallo de red al guardar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener clases para el badge de clasificación
  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "ANCLA":
        return "bg-teal-push/10 text-teal-push border-teal-push/20";
      case "LASTRE":
        return "bg-coral-liquidate/10 text-coral-liquidate border-coral-liquidate/20";
      default:
        return "bg-gold-maintain/10 text-gold-maintain border-gold-maintain/20";
    }
  };

  return (
    <div className="space-y-gutter">
      {/* 1. MÓDULO RESUMEN / METRICAS GIGANTES */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-gutter">
        {/* Venta Total Proyectada */}
        <div className="bg-midnight text-white p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="z-10">
            <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider">Facturación Simulación</span>
            <h3 className="text-3xl font-display font-bold text-white mt-1">
              {formatCurrency(currentMetrics.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-muted">Meta:</span>
              <span className="text-xs font-semibold text-white/90">{formatCurrency(targetRevenue)}</span>
            </div>
          </div>
          {/* Barra de Progreso a Meta */}
          <div className="mt-4 z-10 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-muted">
              <span>Progreso de Meta</span>
              <span className="font-bold text-white">
                {Math.round((currentMetrics.totalRevenue / targetRevenue) * 100)}%
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary-blue h-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentMetrics.totalRevenue / targetRevenue) * 100)}%` }}
              ></div>
            </div>
          </div>
          <span className="material-symbols-outlined text-[80px] absolute -right-4 -bottom-4 opacity-5 text-white pointer-events-none select-none">
            payments
          </span>
        </div>

        {/* Margen Ponderado del Mix */}
        <div className={`p-6 rounded-2xl border shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
          currentMetrics.isMarginTargetMet
            ? "bg-white border-teal-push/20"
            : "bg-white border-coral-liquidate/20"
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider">Margen Ponderado (Mix)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-3xl font-display font-bold ${
                currentMetrics.isMarginTargetMet ? "text-teal-push" : "text-coral-liquidate"
              }`}>
                {formatPercent(currentMetrics.weightedMargin)}
              </h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                currentMetrics.isMarginTargetMet ? "bg-teal-push/10 text-teal-push" : "bg-coral-liquidate/10 text-coral-liquidate"
              }`}>
                {currentMetrics.isMarginTargetMet ? "META CUMPLIDA" : "BAJO META"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-muted">Margen Meta:</span>
              <span className="text-xs font-semibold text-midnight">{formatPercent(targetMargin)}</span>
            </div>
          </div>
          
          {/* Comparación original */}
          <div className="mt-4 pt-2 border-t border-slate-muted/10 flex items-center justify-between text-[11px] text-slate-muted">
            <span>Margen Original:</span>
            <span className="font-bold text-midnight">{formatPercent(originalMetrics.weightedMargin)}</span>
          </div>
        </div>

        {/* Brecha / Gap Financiero */}
        <div className="bg-white p-6 rounded-2xl border border-slate-muted/10 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider">Brecha Restante (GAP)</span>
            <h3 className={`text-3xl font-display font-bold mt-1 ${
              currentMetrics.gapRemaining > 0 ? "text-coral-liquidate" : "text-teal-push"
            }`}>
              {currentMetrics.gapRemaining > 0 ? `-${formatCurrency(currentMetrics.gapRemaining)}` : "$0 (Brecha Cubierta)"}
            </h3>
            <p className="text-[10px] text-slate-muted mt-2 leading-relaxed">
              {currentMetrics.gapRemaining > 0 
                ? "Incremente precios o agregue unidades de SKUs con alta rentabilidad para cubrir el gap."
                : "¡Felicitaciones! Las unidades estimadas cubren la meta de facturación mensual."
              }
            </p>
          </div>
          <span className="material-symbols-outlined text-[80px] absolute -right-4 -bottom-4 opacity-5 text-midnight pointer-events-none select-none">
            track_changes
          </span>
        </div>

        {/* Ganancia Proyectada */}
        <div className="bg-white p-6 rounded-2xl border border-slate-muted/10 shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div>
            <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider">Ganancia Total Est.</span>
            <h3 className="text-3xl font-display font-bold text-midnight mt-1">
              {formatCurrency(currentMetrics.totalProfit)}
            </h3>
            <div className="flex items-center justify-between text-[11px] text-slate-muted mt-2">
              <span>Costo Total:</span>
              <span className="font-semibold text-midnight">{formatCurrency(currentMetrics.totalCost)}</span>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-muted/10 flex items-center justify-between text-[11px] text-slate-muted">
            <span>Ganancia Original:</span>
            <span className="font-bold text-midnight">{formatCurrency(originalMetrics.totalProfit)}</span>
          </div>
        </div>
      </section>

      {/* 2. ALERTA DE REGLA DE NEGOCIO */}
      {!currentMetrics.isMarginTargetMet && (
        <div className="bg-coral-liquidate/10 border border-coral-liquidate/20 text-midnight p-4 rounded-xl flex gap-3 items-center">
          <span className="material-symbols-outlined text-coral-liquidate text-[24px]">warning</span>
          <div className="text-xs font-sans leading-relaxed">
            <strong className="text-coral-liquidate font-bold">Conflicto de Margen:</strong> El margen ponderado proyectado actual (<strong className="font-bold">{formatPercent(currentMetrics.weightedMargin)}</strong>) se encuentra por debajo del objetivo corporativo de <strong className="font-bold">{formatPercent(targetMargin)}</strong>. Ajuste los precios de venta o priorice el volumen de unidades de productos clasificados como <span className="bg-teal-push/10 text-teal-push px-1.5 py-0.5 rounded font-bold">ANCLA</span>.
          </div>
        </div>
      )}

      {/* 3. BARRA DE FILTROS & ACCIONES */}
      <section className="bg-white p-4 rounded-2xl card-shadow border border-slate-muted/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Buscador e Inputs de Filtro */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full lg:w-60">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted/80 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#EAF2FF]/50 border border-slate-muted/20 rounded-xl py-2 pl-9 pr-4 text-xs font-sans text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-slate-muted"
              placeholder="Buscar SKU o producto..."
            />
          </div>

          {/* Filtro Marca */}
          <div className="flex items-center gap-1 bg-[#EAF2FF]/40 border border-slate-muted/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[9px] font-bold text-slate-muted uppercase">Marca</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-transparent text-xs font-bold text-midnight focus:outline-none cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b} value={b} className="text-midnight bg-white">
                  {b === "TODAS" ? "Todas" : b}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoría */}
          <div className="flex items-center gap-1 bg-[#EAF2FF]/40 border border-slate-muted/10 rounded-xl px-2.5 py-1.5">
            <span className="text-[9px] font-bold text-slate-muted uppercase">Rubro</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-midnight focus:outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="text-midnight bg-white">
                  {c === "TODAS" ? "Todos" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="flex gap-2 w-full lg:w-auto shrink-0 justify-end">
          <button
            onClick={handleResetAll}
            className="px-4 py-2 border border-slate-muted/20 hover:border-slate-muted/50 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-muted hover:text-midnight transition-all cursor-pointer active:scale-95 duration-100 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Restablecer Valores
          </button>
          <button
            onClick={() => setIsSaveModalOpen(true)}
            className="px-4 py-2 bg-primary-blue hover:bg-primary-blue/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-blue/20 transition-all cursor-pointer active:scale-95 duration-100 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Guardar Escenario
          </button>
        </div>
      </section>

      {/* 4. TABLA EDITABLE REACTIVA */}
      <section className="bg-white rounded-2xl border border-slate-muted/10 card-shadow overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1100px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-muted/10 text-slate-muted text-[10px] uppercase font-bold tracking-wider">
                <th className="py-4 px-6 whitespace-nowrap">SKU / Producto</th>
                <th className="py-4 px-4 whitespace-nowrap">Clasif.</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Costo ($)</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Precio ($)</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Margen %</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Unids Objetivo</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Venta Est.</th>
                <th className="py-4 px-4 text-right whitespace-nowrap">Ganancia Est.</th>
                <th className="py-4 px-4 whitespace-nowrap">Acción Sugerida</th>
                <th className="py-4 px-4 text-center whitespace-nowrap">Reset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-muted/10">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-muted text-sm font-sans">
                    Ningún SKU coincide con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const skuRevenue = item.targetUnits * item.price;
                  const skuCost = item.targetUnits * item.cost;
                  const skuProfit = skuRevenue - skuCost;
                  const skuMargin = item.price > 0 ? (item.price - item.cost) / item.price : 0;
                  
                  const isModified =
                    item.cost !== item.originalCost ||
                    item.price !== item.originalPrice ||
                    item.targetUnits !== item.originalTargetUnits;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#EAF2FF]/20 transition-all duration-200 group text-xs ${
                        isModified ? "bg-[#EAF2FF]/10" : ""
                      }`}
                    >
                      {/* SKU / Nombre */}
                      <td className="py-3.5 px-6">
                        <div className="max-w-[180px]">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-muted bg-ice px-1.5 py-0.5 rounded">
                              {item.sku}
                            </span>
                            {isModified && (
                              <span className="w-1.5 h-1.5 bg-primary-blue rounded-full" title="Modificado"></span>
                            )}
                          </div>
                          <div className="font-display font-bold text-midnight truncate mt-1" title={item.name}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-muted mt-0.5">
                            {item.brand} • {item.subCategory}
                          </div>
                        </div>
                      </td>

                      {/* Clasificación SKU */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          getClassificationBadge(item.classification)
                        }`}>
                          {item.classification}
                        </span>
                      </td>

                      {/* Costo (Input) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-muted">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.cost || 0}
                            onChange={(e) => handleInputChange(item.id, "cost", parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-50 border border-slate-muted/20 rounded px-1.5 py-1 text-right text-xs font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:bg-white"
                          />
                        </div>
                        {item.cost !== item.originalCost && (
                          <div className="text-[9px] text-slate-muted mt-0.5">
                            Orig: ${item.originalCost.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Precio (Input) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-muted">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price || 0}
                            onChange={(e) => handleInputChange(item.id, "price", parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-50 border border-slate-muted/20 rounded px-1.5 py-1 text-right text-xs font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:bg-white"
                          />
                        </div>
                        {item.price !== item.originalPrice && (
                          <div className="text-[9px] text-slate-muted mt-0.5">
                            Orig: ${item.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Margen SKU % */}
                      <td className={`py-3.5 px-4 text-right font-semibold font-mono ${
                        skuMargin >= targetMargin ? "text-teal-push" : "text-coral-liquidate"
                      }`}>
                        {formatPercent(skuMargin)}
                      </td>

                      {/* Unidades Objetivo (Input) */}
                      <td className="py-3.5 px-4">
                        <div className="flex justify-center items-center gap-1.5">
                          <input
                            type="number"
                            value={item.targetUnits || 0}
                            onChange={(e) => handleInputChange(item.id, "targetUnits", parseInt(e.target.value) || 0)}
                            className="w-20 bg-slate-50 border border-slate-muted/20 rounded px-1.5 py-1 text-center text-xs font-bold text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:bg-white"
                          />
                        </div>
                        <div className="text-[9px] text-center text-slate-muted mt-0.5 flex justify-center gap-1.5 items-center font-sans font-medium">
                          <span>Stock: {item.stock}</span>
                          <span className="text-slate-200">|</span>
                          <span className="text-primary-blue font-bold" title={`Elasticidad precio-demanda estimada: E = ${getElasticityCoefficient(item.brand, item.category).toFixed(1)}`}>
                            E: {getElasticityCoefficient(item.brand, item.category).toFixed(1)}
                          </span>
                        </div>
                      </td>

                      {/* Venta Estimada */}
                      <td className="py-3.5 px-4 text-right font-semibold text-midnight">
                        {formatCurrency(skuRevenue)}
                      </td>

                      {/* Ganancia Estimada */}
                      <td className="py-3.5 px-4 text-right font-semibold text-midnight">
                        {formatCurrency(skuProfit)}
                      </td>

                      {/* Decisión Recomendada */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`material-symbols-outlined text-[16px] ${
                            item.decision === "EMPUJAR"
                              ? "text-teal-push"
                              : item.decision === "LIQUIDAR"
                              ? "text-coral-liquidate"
                              : item.decision === "EXCLUIR"
                              ? "text-slate-muted"
                              : "text-gold-maintain"
                          }`}>
                            {item.decision === "EMPUJAR" ? "bolt" : item.decision === "LIQUIDAR" ? "trending_down" : item.decision === "EXCLUIR" ? "block" : "drag_handle"}
                          </span>
                          <span className="font-sans font-medium text-[10px] text-midnight uppercase tracking-wider">
                            {item.decision}
                          </span>
                        </div>
                      </td>

                      {/* Reset individual */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          disabled={!isModified}
                          onClick={() => handleResetRow(item.id)}
                          className={`material-symbols-outlined text-[18px] cursor-pointer p-1 rounded-lg transition-colors ${
                            isModified
                              ? "text-primary-blue hover:bg-primary-blue/10"
                              : "text-slate-muted/25 cursor-not-allowed"
                          }`}
                          title="Restablecer Fila"
                        >
                          undo
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. HISTORIAL DE ESCENARIOS SIMULADOS GUARDADOS */}
      {savedScenarios.length > 0 && (
        <section className="bg-white p-6 rounded-2xl border border-slate-muted/10 card-shadow space-y-4">
          <h4 className="font-display text-sm font-bold text-midnight flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary-blue">history</span>
            Escenarios Guardados en esta Sesión
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedScenarios.map((sc, idx) => (
              <div key={idx} className="border border-slate-muted/10 rounded-xl p-4 flex flex-col justify-between bg-slate-50 hover:bg-white transition-colors duration-200">
                <div>
                  <h5 className="font-display font-bold text-xs text-midnight">{sc.name}</h5>
                  <p className="text-[10px] text-slate-muted mt-1">
                    Guardado: {sc.createdAt || sc.date ? new Date(sc.createdAt || sc.date || "").toLocaleTimeString() : "Recién guardado"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-muted/5">
                  <div>
                    <span className="text-[9px] text-slate-muted uppercase font-bold block">Venta Mix</span>
                    <span className="text-xs font-semibold text-midnight">{formatCurrency(sc.totalRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-muted uppercase font-bold block">Margen Ponderado</span>
                    <span className={`text-xs font-semibold ${
                      sc.weightedMargin >= sc.targetMargin ? "text-teal-push" : "text-coral-liquidate"
                    }`}>
                      {formatPercent(sc.weightedMargin)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. MODAL PARA GUARDAR ESCENARIO */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-muted/10 transform transition-all">
            <div className="bg-midnight p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm">Guardar Escenario de Mix</h3>
                <p className="text-[10px] text-slate-muted mt-0.5">Nombre su simulación para guardarla en base de datos</p>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer material-symbols-outlined"
              >
                close
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {saveSuccess ? (
                <div className="py-6 text-center space-y-3">
                  <span className="material-symbols-outlined text-teal-push text-5xl animate-bounce">check_circle</span>
                  <h4 className="font-display font-bold text-sm text-midnight">¡Escenario guardado con éxito!</h4>
                  <p className="text-xs text-slate-muted">Se ha persistido en la base de datos de simulación local.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-muted uppercase tracking-wider block">
                      Nombre del Escenario
                    </label>
                    <input
                      type="text"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder="Ej. Optimización Q2 - Ajuste Alpha"
                      className="w-full bg-[#EAF2FF]/50 border border-slate-muted/20 rounded-xl py-2.5 px-4 text-xs font-sans text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/30 focus:bg-white transition-all placeholder:text-slate-muted"
                    />
                  </div>

                  {/* Resumen de Métricas a Guardar */}
                  <div className="bg-[#EAF2FF]/20 border border-slate-muted/5 rounded-xl p-4 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-muted uppercase tracking-wider">
                      Resumen del Escenario
                    </h4>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-muted">Facturación Proyectada</span>
                        <p className="text-xs font-bold text-midnight">
                          {formatCurrency(currentMetrics.totalRevenue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-muted">Margen Ponderado</span>
                        <p className={`text-xs font-bold ${
                          currentMetrics.isMarginTargetMet ? "text-teal-push" : "text-coral-liquidate"
                        }`}>
                          {formatPercent(currentMetrics.weightedMargin)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setIsSaveModalOpen(false)}
                      className="flex-1 py-2.5 border border-slate-muted/20 hover:bg-slate-50 text-slate-muted hover:text-midnight font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveScenario}
                      disabled={isSaving || !scenarioName.trim()}
                      className="flex-1 py-2.5 bg-primary-blue hover:bg-primary-blue/90 disabled:bg-primary-blue/50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSaving ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">save</span>
                          Guardar Escenario
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
