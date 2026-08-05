"use client";

import React, { useState, useEffect, useRef } from "react";

interface IntegrationState {
  id: string;
  name: string;
  type: "CHANNEL" | "ERP";
  status: "CONNECTED" | "DISCONNECTED" | "WARNING" | "SYNCING";
  lastSync: string;
  logoIcon: string;
  colorClass: string;
  badgeClass: string;
}

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error" | "warn";
  text: string;
}

export default function ClientIntegrations() {
  // 1. Estados de Conexión (Cargados de localStorage si existen)
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    {
      id: "meli",
      name: "Mercado Libre",
      type: "CHANNEL",
      status: "CONNECTED",
      lastSync: "Hace 10 minutos",
      logoIcon: "shopping_bag",
      colorClass: "border-amber-500/20 hover:border-amber-500/40",
      badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/25",
    },
    {
      id: "shopify",
      name: "Shopify Store",
      type: "CHANNEL",
      status: "CONNECTED",
      lastSync: "Hace 12 minutos",
      logoIcon: "storefront",
      colorClass: "border-emerald-500/20 hover:border-emerald-500/40",
      badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25",
    },
    {
      id: "erp",
      name: "SAP ERP Business One",
      type: "ERP",
      status: "CONNECTED",
      lastSync: "Hace 15 minutos",
      logoIcon: "database",
      colorClass: "border-primary-blue/20 hover:border-primary-blue/40",
      badgeClass: "bg-primary-blue/10 text-primary-blue border-primary-blue/25",
    },
  ]);

  // 2. Formularios de Credenciales
  const [credentials, setCredentials] = useState({
    meliClientId: "7832941092",
    meliClientSecret: "••••••••••••••••••••••••",
    shopifyUrl: "arasy-technology.myshopify.com",
    shopifyToken: "••••••••••••••••••••••••",
    erpHost: "192.168.1.150",
    erpSchema: "PRD_ARASY_DB",
    erpPort: "1433",
  });

  // 3. Simulador de Fallos
  const [simulateMeliRateLimit, setSimulateMeliRateLimit] = useState(false);
  const [simulateErpTimeout, setSimulateErpTimeout] = useState(false);

  // 4. Consola de Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      text: "Consola de Integraciones inicializada. Canal de comunicación seguro activo.",
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "success",
      text: "Sincronizador automático ejecutándose cada 15 min.",
    },
  ]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en consola de logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const loadCustomLogs = () => {
    const savedMeli = localStorage.getItem("arasy_sim_meli_error") === "true";
    const savedErp = localStorage.getItem("arasy_sim_erp_error") === "true";
    
    setSimulateMeliRateLimit(savedMeli);
    setSimulateErpTimeout(savedErp);

    const savedStatus = localStorage.getItem("arasy_integrations_status");
    if (savedStatus) {
      try {
        setIntegrations(JSON.parse(savedStatus));
      } catch (e) {
        console.error(e);
      }
    }

    const savedLogs = localStorage.getItem("arasy_custom_logs");
    const initialLogs: LogEntry[] = [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: "info",
        text: "Consola de Integraciones inicializada. Canal de comunicación seguro activo.",
      },
      {
        timestamp: new Date().toLocaleTimeString(),
        type: "success",
        text: "Sincronizador automático ejecutándose cada 15 min.",
      },
    ];

    if (savedLogs) {
      try {
        const parsed = JSON.parse(savedLogs) as LogEntry[];
        setLogs([...initialLogs, ...parsed]);
      } catch (e) {
        console.error(e);
        setLogs(initialLogs);
      }
    } else {
      setLogs(initialLogs);
    }
  };

  // Cargar configuraciones de simulación desde localStorage si existen
  useEffect(() => {
    // Evitar llamada síncrona que dispare renderizado en cascada
    const timer = setTimeout(() => {
      loadCustomLogs();
    }, 0);

    window.addEventListener("arasy_integrations_changed", loadCustomLogs);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("arasy_integrations_changed", loadCustomLogs);
    };
  }, []);

  // Guardar estados en localStorage para compartir con otros componentes/vistas
  const saveIntegrationsState = (updatedList: IntegrationState[]) => {
    setIntegrations(updatedList);
    localStorage.setItem("arasy_integrations_status", JSON.stringify(updatedList));
    // Disparar evento global para que componentes como Header puedan enterarse
    window.dispatchEvent(new Event("arasy_integrations_changed"));
  };

  const handleClearLogs = () => {
    localStorage.removeItem("arasy_custom_logs");
    setLogs([]);
  };

  const handleToggleSimulateMeli = (val: boolean) => {
    setSimulateMeliRateLimit(val);
    localStorage.setItem("arasy_sim_meli_error", String(val));
    addLogEntry("info", `Simulador de error Mercado Libre ${val ? "ACTIVADO" : "DESACTIVADO"}.`);
  };

  const handleToggleSimulateErp = (val: boolean) => {
    setSimulateErpTimeout(val);
    localStorage.setItem("arasy_sim_erp_error", String(val));
    addLogEntry("info", `Simulador de error SAP ERP ${val ? "ACTIVADO" : "DESACTIVADO"}.`);
  };

  const addLogEntry = (type: LogEntry["type"], text: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      text,
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Acción: Activar/Desactivar Conexión
  const handleToggleConnection = (id: string) => {
    const updated = integrations.map((it) => {
      if (it.id === id) {
        const isConnected = it.status === "CONNECTED" || it.status === "WARNING";
        const newStatus = isConnected ? "DISCONNECTED" as const : "CONNECTED" as const;
        addLogEntry(
          isConnected ? "warn" : "success",
          `${it.name} ha sido ${isConnected ? "DESCONECTADO" : "CONECTADO"} manualmente.`
        );
        return {
          ...it,
          status: newStatus,
          lastSync: isConnected ? "Nunca" : "Hace unos instantes",
        };
      }
      return it;
    });
    saveIntegrationsState(updated);
  };

  // Acción: Sincronizar manual con flujo simulado paso a paso
  const handleForceSync = () => {
    if (isSyncing) return;

    // Verificar si hay al menos una conexión activa
    const activeIntegrations = integrations.filter((it) => it.status !== "DISCONNECTED");
    if (activeIntegrations.length === 0) {
      addLogEntry("error", "Error de Sincronización: No hay canales ni ERPs conectados.");
      return;
    }

    setIsSyncing(true);
    setSyncProgress(5);
    setLogs([]); // Limpiar consola para la sincronización activa

    addLogEntry("info", "Iniciando proceso de sincronización manual forzado...");

    const steps = [
      {
        progress: 15,
        fn: () => addLogEntry("info", "Verificando firmas de API y autenticando con canales..."),
      },
      {
        progress: 30,
        fn: () => {
          // Evaluar estado Mercado Libre
          const meli = integrations.find((it) => it.id === "meli");
          if (!meli || meli.status === "DISCONNECTED") {
            addLogEntry("warn", "Mercado Libre está desconectado. Saltando sincronización de este canal.");
          } else if (simulateMeliRateLimit) {
            addLogEntry("error", "Error [ML-429]: Too Many Requests. Límite de llamadas API superado en Mercado Libre.");
            // Cambiar estado a WARNING en la lista temporal
          } else {
            addLogEntry("success", "Mercado Libre: Conexión exitosa. Sincronizando stock e importando 18 órdenes nuevas MTD.");
          }
        },
      },
      {
        progress: 55,
        fn: () => {
          // Evaluar estado Shopify
          const shopify = integrations.find((it) => it.id === "shopify");
          if (!shopify || shopify.status === "DISCONNECTED") {
            addLogEntry("warn", "Shopify Store está desconectado. Saltando sincronización de este canal.");
          } else {
            addLogEntry("success", "Shopify: Conexión exitosa. Sincronizando catálogo y precios. 12 órdenes sincronizadas.");
          }
        },
      },
      {
        progress: 75,
        fn: () => {
          // Evaluar estado ERP SAP
          const erp = integrations.find((it) => it.id === "erp");
          if (!erp || erp.status === "DISCONNECTED") {
            addLogEntry("warn", "SAP ERP está desconectado. Saltando descarga de facturación y costos logísticos.");
          } else if (simulateErpTimeout) {
            addLogEntry("error", "Error [ERP-504]: Gateway Timeout. El servidor SAP ERP (192.168.1.150) no responde.");
          } else {
            addLogEntry("success", "SAP ERP: Conexión activa. Costos de adquisición netos actualizados para 50 SKUs.");
          }
        },
      },
      {
        progress: 100,
        fn: () => {
          setIsSyncing(false);
          
          // Actualizar estados reales en la app
          const hasMeliError = simulateMeliRateLimit && integrations.find(it => it.id === "meli")?.status !== "DISCONNECTED";
          const hasErpError = simulateErpTimeout && integrations.find(it => it.id === "erp")?.status !== "DISCONNECTED";

          const updated = integrations.map((it) => {
            if (it.status === "DISCONNECTED") return it;
            
            let status: "CONNECTED" | "DISCONNECTED" | "WARNING" | "SYNCING" = "CONNECTED";
            if (it.id === "meli" && hasMeliError) status = "WARNING";
            if (it.id === "erp" && hasErpError) status = "WARNING";

            return {
              ...it,
              status,
              lastSync: "Hace unos instantes",
            };
          });

          saveIntegrationsState(updated);

          if (hasMeliError || hasErpError) {
            addLogEntry("warn", "Sincronización finalizada con advertencias operativas en algunos canales.");
          } else {
            addLogEntry("success", "¡Sincronización global finalizada con éxito! Todos los canales y el ERP están actualizados.");
            // Lanzar evento global para actualizar notificaciones y alertas
            window.dispatchEvent(new Event("arasy_alerts_updated"));
          }
        },
      },
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSyncProgress(step.progress);
        step.fn();
      }, (idx + 1) * 800);
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-gutter space-y-gutter overflow-y-auto max-h-[calc(100vh-64px)] custom-scrollbar">
      
      {/* Encabezado */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-muted/10 pb-4">
        <div>
          <h2 className="font-display font-bold text-lg text-midnight">Centro de Integraciones (Data Hub)</h2>
          <p className="text-xs text-slate-muted font-sans mt-0.5">
            Sincroniza y monitorea la conexión entre tu ERP y canales digitales de venta.
          </p>
        </div>
        <button
          onClick={handleForceSync}
          disabled={isSyncing}
          className="px-4 py-2.5 bg-primary-blue hover:bg-primary-blue/90 disabled:bg-slate-100 disabled:text-slate-muted text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 duration-100 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <span className={`material-symbols-outlined text-[16px] ${isSyncing ? "animate-spin" : ""}`}>
            sync
          </span>
          {isSyncing ? `Sincronizando (${syncProgress}%)` : "Forzar Sincronización"}
        </button>
      </header>

      {/* Grid de Integraciones */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {integrations.map((it) => {
          const isConnected = it.status === "CONNECTED";
          const isWarning = it.status === "WARNING";
          const isDisconnected = it.status === "DISCONNECTED";

          return (
            <div
              key={it.id}
              className={`bg-white p-6 rounded-2xl border transition-all duration-300 card-shadow flex flex-col justify-between min-h-[360px] ${it.colorClass}`}
            >
              <div>
                {/* Header Integración */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-muted/10 flex items-center justify-center text-midnight font-bold">
                      <span className="material-symbols-outlined text-[22px]">{it.logoIcon}</span>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm text-midnight">{it.name}</h4>
                      <span className="text-[9px] text-slate-muted font-sans font-bold uppercase tracking-wider block">
                        {it.type}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Estado */}
                  <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold tracking-wider font-sans uppercase ${
                    isConnected 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-500/20"
                      : isWarning
                      ? "bg-amber-50 text-amber-600 border-amber-500/20"
                      : "bg-slate-50 text-slate-muted border-slate-muted/20"
                  }`}>
                    {isConnected ? "Activo" : isWarning ? "Error API" : "Inactivo"}
                  </span>
                </div>

                {/* Formulario / Configuración de Conexión */}
                <div className="space-y-3 pt-2">
                  {it.id === "meli" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Client ID</label>
                        <input
                          type="text"
                          value={credentials.meliClientId}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("meliClientId", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-mono text-midnight focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Client Secret Token</label>
                        <input
                          type="password"
                          value={credentials.meliClientSecret}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("meliClientSecret", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-mono text-midnight focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {it.id === "shopify" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Tienda Shopify URL</label>
                        <input
                          type="text"
                          value={credentials.shopifyUrl}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("shopifyUrl", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-sans text-midnight focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Admin API Token</label>
                        <input
                          type="password"
                          value={credentials.shopifyToken}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("shopifyToken", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-mono text-midnight focus:outline-none"
                        />
                      </div>
                    </>
                  )}

                  {it.id === "erp" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Host Servidor ERP</label>
                        <input
                          type="text"
                          value={credentials.erpHost}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("erpHost", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-sans text-midnight focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Esquema BD</label>
                          <input
                            type="text"
                            value={credentials.erpSchema}
                            disabled={!isDisconnected}
                            onChange={(e) => handleInputChange("erpSchema", e.target.value)}
                            className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-sans text-midnight focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">Puerto</label>
                          <input
                            type="text"
                            value={credentials.erpPort}
                            disabled={!isDisconnected}
                            onChange={(e) => handleInputChange("erpPort", e.target.value)}
                            className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-sans text-midnight focus:outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer e Historial */}
              <div className="mt-6 pt-4 border-t border-slate-muted/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-muted uppercase block">Última Sincronización</span>
                  <span className="text-[10px] font-bold text-midnight">{it.lastSync}</span>
                </div>
                <button
                  onClick={() => handleToggleConnection(it.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 duration-100 cursor-pointer ${
                    isDisconnected 
                      ? "bg-primary-blue/10 text-primary-blue hover:bg-primary-blue/20" 
                      : "bg-rose-50 text-rose-600 border border-rose-500/20 hover:bg-rose-100"
                  }`}
                >
                  {isDisconnected ? "Conectar" : "Desconectar"}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Consola de Logs & Simulador de Fallos */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Consola de Logs */}
        <div className="lg:col-span-8 bg-midnight text-[#00FF66] p-6 rounded-2xl shadow-xl flex flex-col justify-between overflow-hidden min-h-[300px] border border-white/5 relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-4xl text-white font-bold">terminal</span>
          </div>
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="font-display text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CONSOLA DE EVENTOS EN VIVO
              </h3>
              <button 
                onClick={handleClearLogs}
                className="text-[9px] font-bold text-white/50 hover:text-white transition-colors cursor-pointer border border-white/15 px-2 py-0.5 rounded uppercase"
              >
                Limpiar Consola
              </button>
            </div>

            {/* Listado de Logs */}
            <div className="h-44 overflow-y-auto space-y-1.5 font-mono text-[10px] custom-scrollbar pr-2 leading-relaxed">
              {logs.length === 0 ? (
                <p className="text-white/40 italic">Consola vacía. Inicie una sincronización para ver el flujo en vivo.</p>
              ) : (
                logs.map((log, idx) => {
                  let colorClass = "text-white/90";
                  if (log.type === "success") colorClass = "text-emerald-400 font-bold";
                  if (log.type === "error") colorClass = "text-rose-500 font-bold";
                  if (log.type === "warn") colorClass = "text-amber-400 font-semibold";

                  return (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <span className="text-white/45 shrink-0 select-none font-sans font-bold">[{log.timestamp}]</span>
                      <span className={colorClass}>{log.text}</span>
                    </div>
                  );
                })
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-white/40 text-[9px] flex justify-between font-mono">
            <span>MODO: DEMO INTEGRADA ONLINE</span>
            <span>ENCRIPTACIÓN: AES-256</span>
          </div>
        </div>

        {/* Simulador de Fallos Operativos (Demo Admin) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl card-shadow border border-slate-muted/10 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-display text-sm font-bold text-midnight flex items-center gap-1">
                  <span className="material-symbols-outlined text-coral-liquidate font-bold text-[18px]">rule</span>
                  Consola del Simulador
                </h3>
                <p className="text-[10px] text-slate-muted font-sans mt-0.5">
                  Fuerza condiciones de error para auditar alertas.
                </p>
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-midnight font-sans">Simular Caída de ML</h5>
                  <p className="text-[9.5px] text-slate-muted leading-relaxed font-sans mt-0.5">
                    Genera error 429 (Rate Limit) al sincronizar inventarios de Mercado Libre.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulateMeliRateLimit}
                  onChange={(e) => handleToggleSimulateMeli(e.target.checked)}
                  className="w-8 h-4 bg-slate-200 checked:bg-primary-blue rounded-full appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:w-4 before:h-4 before:bg-white before:rounded-full before:absolute before:left-0 checked:before:left-4 before:transition-all before:shadow-sm"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h5 className="text-xs font-bold text-midnight font-sans">Simular Caída de ERP</h5>
                  <p className="text-[9.5px] text-slate-muted leading-relaxed font-sans mt-0.5">
                    Gatilla un error de red y timeout (504) al intentar conectar con SAP.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={simulateErpTimeout}
                  onChange={(e) => handleToggleSimulateErp(e.target.checked)}
                  className="w-8 h-4 bg-slate-200 checked:bg-primary-blue rounded-full appearance-none relative cursor-pointer outline-none transition-colors before:content-[''] before:w-4 before:h-4 before:bg-white before:rounded-full before:absolute before:left-0 checked:before:left-4 before:transition-all before:shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#EAF2FF]/40 border border-slate-muted/15 rounded-xl p-4 mt-6 text-[10px] leading-relaxed text-slate-muted font-sans">
            <span className="font-bold text-primary-blue block mb-1">Guía del Simulador:</span>
            Activa una de las caídas, haz clic en <strong>Forzar Sincronización</strong> arriba y observa cómo se registran los errores en la consola y se dispara el estado de advertencia ⚠️ en los canales de datos.
          </div>
        </div>
      </section>
    </div>
  );
}
