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

interface MeliAccountState {
  userId: string;
  nickname: string | null;
  email: string | null;
  siteId: string | null;
  expiresAt: string;
  syncedProductsCount: number;
  syncedSalesCount: number;
}

export default function ClientIntegrations() {
  // 1. Estados de Conexión
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    {
      id: "meli",
      name: "Mercado Libre",
      type: "CHANNEL",
      status: "DISCONNECTED",
      lastSync: "Consultando...",
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

  // Estado de cuenta real de Mercado Libre
  const [meliAccount, setMeliAccount] = useState<MeliAccountState | null>(null);
  const [isMeliModalOpen, setIsMeliModalOpen] = useState(false);
  const [meliAuthUrl, setMeliAuthUrl] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [isSubmittingMeliCode, setIsSubmittingMeliCode] = useState(false);
  const [meliConnectError, setMeliConnectError] = useState<string | null>(null);

  // 2. Formularios de Credenciales
  const [credentials, setCredentials] = useState({
    meliClientId: "299384065701270",
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
      text: "Sincronizador automático preparado.",
    },
  ]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll en consola de logs
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLogEntry = (type: LogEntry["type"], text: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      text,
    };
    setLogs((prev) => [...prev, entry]);
  };

  // Consultar estado real de conexión con Mercado Libre
  const checkMeliStatus = async () => {
    try {
      const res = await fetch("/api/integrations/mercadolibre/status");
      const data = await res.json();
      if (data.connected && data.account) {
        setMeliAccount(data.account);
        setIntegrations((prev) =>
          prev.map((it) =>
            it.id === "meli"
              ? {
                  ...it,
                  status: "CONNECTED",
                  lastSync: data.account.nickname
                    ? `Vendedor: ${data.account.nickname}`
                    : `ID: ${data.account.userId}`,
                }
              : it
          )
        );
      } else {
        setMeliAccount(null);
        setIntegrations((prev) =>
          prev.map((it) =>
            it.id === "meli"
              ? {
                  ...it,
                  status: "DISCONNECTED",
                  lastSync: "No vinculado",
                }
              : it
          )
        );
      }
    } catch (err: unknown) {
      console.error("Error al consultar estado de Mercado Libre:", err);
    }
  };

  const loadCustomLogs = () => {
    const savedMeli = localStorage.getItem("arasy_sim_meli_error") === "true";
    const savedErp = localStorage.getItem("arasy_sim_erp_error") === "true";

    setSimulateMeliRateLimit(savedMeli);
    setSimulateErpTimeout(savedErp);

    checkMeliStatus();
  };

  // Cargar al montar y chequear query params
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomLogs();

      // Revisar si venimos de la redirección OAuth
      const params = new URLSearchParams(window.location.search);
      const success = params.get("success");
      const seller = params.get("seller");
      const error = params.get("error");

      if (success === "meli_connected") {
        addLogEntry("success", `¡Mercado Libre conectado exitosamente! Vendedor: ${seller || "Autorizado"}.`);
        window.history.replaceState({}, document.title, window.location.pathname);
        checkMeliStatus();
      } else if (error) {
        addLogEntry("error", `Error en autorización con Mercado Libre: ${decodeURIComponent(error)}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);


  // Abrir modal de conexión con Mercado Libre y obtener la URL de OAuth
  const handleOpenMeliAuth = async () => {
    setMeliConnectError(null);
    setIsMeliModalOpen(true);
    try {
      const res = await fetch("/api/integrations/mercadolibre/auth");
      const data = await res.json();
      if (data.success && data.url) {
        setMeliAuthUrl(data.url);
      } else {
        setMeliConnectError(data.error || "No se pudo generar el enlace de autorización.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setMeliConnectError(msg);
    }
  };

  // Canjear código pegado manualmente
  const handleConnectWithCode = async () => {
    if (!manualCode.trim()) {
      setMeliConnectError("Por favor, ingresá el código de autorización o la URL de redirección.");
      return;
    }

    let codeToExchange = manualCode.trim();

    // Extraer code si el usuario pegó la URL completa
    if (codeToExchange.includes("code=")) {
      try {
        const urlObj = new URL(codeToExchange.startsWith("http") ? codeToExchange : `https://${codeToExchange}`);
        const extracted = urlObj.searchParams.get("code");
        if (extracted) codeToExchange = extracted;
      } catch {
        const match = codeToExchange.match(/[?&]code=([^&]+)/);
        if (match && match[1]) codeToExchange = match[1];
      }
    }

    setIsSubmittingMeliCode(true);
    setMeliConnectError(null);

    try {
      const res = await fetch("/api/integrations/mercadolibre/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToExchange }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo vincular la cuenta.");
      }

      addLogEntry("success", `¡Cuenta de Mercado Libre vinculada con éxito como ${data.account.nickname || data.account.userId}!`);
      setIsMeliModalOpen(false);
      setManualCode("");
      await checkMeliStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar la cuenta.";
      setMeliConnectError(msg);
      addLogEntry("error", `Fallo al vincular Mercado Libre: ${msg}`);
    } finally {
      setIsSubmittingMeliCode(false);
    }
  };

  // Desconectar cuenta de Mercado Libre
  const handleDisconnectMeli = async () => {
    try {
      const res = await fetch("/api/integrations/mercadolibre/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        addLogEntry("warn", "Mercado Libre: Cuenta desconectada de Arasy.");
        await checkMeliStatus();
      }
    } catch (err: unknown) {
      console.error("Error al desconectar:", err);
    }
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

  // Acción: Activar/Desactivar Conexión
  const handleToggleConnection = (id: string) => {
    if (id === "meli") {
      if (meliAccount) {
        handleDisconnectMeli();
      } else {
        handleOpenMeliAuth();
      }
      return;
    }

    const updated = integrations.map((it) => {
      if (it.id === id) {
        const isConnected = it.status === "CONNECTED" || it.status === "WARNING";
        const newStatus = isConnected ? ("DISCONNECTED" as const) : ("CONNECTED" as const);
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
    setIntegrations(updated);
  };

  // Acción: Sincronizar manual con conexión en vivo
  const handleForceSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(10);
    setLogs([]);

    addLogEntry("info", "Iniciando proceso de sincronización global...");

    // 1. Verificación de conexiones
    await new Promise((r) => setTimeout(r, 600));
    setSyncProgress(25);
    addLogEntry("info", "Verificando tokens y autenticando con canales...");

    // 2. Sincronización Mercado Libre (Real)
    await new Promise((r) => setTimeout(r, 600));
    setSyncProgress(50);

    const meli = integrations.find((it) => it.id === "meli");
    if (!meli || meli.status === "DISCONNECTED") {
      addLogEntry("warn", "Mercado Libre está desconectado. Saltando sincronización de este canal.");
    } else if (simulateMeliRateLimit) {
      addLogEntry("error", "Error [ML-429]: Too Many Requests. Límite de llamadas API simulado en Mercado Libre.");
    } else {
      addLogEntry("info", "Mercado Libre: Conexión API activa. Consultando publicaciones y órdenes en vivo...");
      try {
        const syncRes = await fetch("/api/integrations/mercadolibre/sync", { method: "POST" });
        const syncData = await syncRes.json();
        if (syncData.success) {
          addLogEntry(
            "success",
            `Mercado Libre: ¡Sincronizados ${syncData.syncedProducts} productos y ${syncData.syncedSales} ventas del vendedor ${syncData.seller}!`
          );
          window.dispatchEvent(new Event("arasy_alerts_updated"));
          await checkMeliStatus();
        } else {
          addLogEntry("error", `Mercado Libre API Error: ${syncData.error}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error de conexión";
        addLogEntry("error", `Mercado Libre: Fallo en la llamada: ${msg}`);
      }
    }

    // 3. Shopify
    await new Promise((r) => setTimeout(r, 600));
    setSyncProgress(75);
    const shopify = integrations.find((it) => it.id === "shopify");
    if (!shopify || shopify.status === "DISCONNECTED") {
      addLogEntry("warn", "Shopify Store está desconectado. Saltando sincronización de este canal.");
    } else {
      addLogEntry("success", "Shopify: Conexión exitosa. Sincronizando catálogo y precios. 12 órdenes sincronizadas.");
    }

    // 4. ERP SAP
    await new Promise((r) => setTimeout(r, 600));
    setSyncProgress(90);
    const erp = integrations.find((it) => it.id === "erp");
    if (!erp || erp.status === "DISCONNECTED") {
      addLogEntry("warn", "SAP ERP está desconectado. Saltando descarga de facturación y costos logísticos.");
    } else if (simulateErpTimeout) {
      addLogEntry("error", "Error [ERP-504]: Gateway Timeout. El servidor SAP ERP (192.168.1.150) no responde.");
    } else {
      addLogEntry("success", "SAP ERP: Conexión activa. Costos de adquisición netos actualizados para 50 SKUs.");
    }

    await new Promise((r) => setTimeout(r, 400));
    setSyncProgress(100);
    setIsSyncing(false);
    addLogEntry("success", "¡Sincronización global completada con éxito!");
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
              className={`bg-white p-6 rounded-2xl border transition-all duration-300 card-shadow flex flex-col justify-between min-h-[380px] ${it.colorClass}`}
            >
              <div>
                {/* Header Integración */}
                <div className="flex justify-between items-start mb-5">
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
                  <span
                    className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold tracking-wider font-sans uppercase ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-600 border-emerald-500/20"
                        : isWarning
                        ? "bg-amber-50 text-amber-600 border-amber-500/20"
                        : "bg-slate-50 text-slate-muted border-slate-muted/20"
                    }`}
                  >
                    {isConnected ? "Activo" : isWarning ? "Error API" : "Inactivo"}
                  </span>
                </div>

                {/* Formulario / Configuración de Conexión */}
                <div className="space-y-3 pt-1">
                  {it.id === "meli" && (
                    <>
                      {meliAccount ? (
                        <div className="space-y-2 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                              Cuenta Vinculada en Vivo
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          </div>
                          <div className="text-xs font-bold text-midnight font-display flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[17px] text-amber-600">storefront</span>
                            {meliAccount.nickname || "Vendedor Conectado"}
                          </div>
                          <div className="text-[10px] text-slate-muted font-mono flex items-center justify-between pt-1 border-t border-amber-500/10">
                            <span>User ID:</span>
                            <span className="font-bold text-midnight">{meliAccount.userId}</span>
                          </div>
                          <div className="text-[10px] text-slate-muted font-sans flex items-center justify-between">
                            <span>Publicaciones en DB:</span>
                            <span className="font-bold text-midnight">{meliAccount.syncedProductsCount} SKUs</span>
                          </div>
                          <div className="text-[10px] text-slate-muted font-sans flex items-center justify-between">
                            <span>Ventas ML registradas:</span>
                            <span className="font-bold text-midnight">{meliAccount.syncedSalesCount} órdenes</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                              App ID (Client ID)
                            </label>
                            <input
                              type="text"
                              value={credentials.meliClientId}
                              onChange={(e) => handleInputChange("meliClientId", e.target.value)}
                              className="w-full bg-slate-50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-mono text-midnight focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                              Redirect URI Configurada
                            </label>
                            <input
                              type="text"
                              readOnly
                              value="https://arasy.app/api/integrations/mercadolibre/callback"
                              className="w-full bg-slate-50/70 border border-slate-muted/15 rounded-lg py-1.5 px-3 text-[10.5px] font-mono text-slate-600 focus:outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenMeliAuth}
                            className="w-full mt-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">link</span>
                            Conectar con Mercado Libre
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {it.id === "shopify" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                          Tienda Shopify URL
                        </label>
                        <input
                          type="text"
                          value={credentials.shopifyUrl}
                          disabled={!isDisconnected}
                          onChange={(e) => handleInputChange("shopifyUrl", e.target.value)}
                          className="w-full bg-slate-50 disabled:bg-slate-50/50 border border-slate-muted/15 rounded-lg py-2 px-3 text-xs font-sans text-midnight focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                          Admin API Token
                        </label>
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
                        <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                          Host Servidor ERP
                        </label>
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
                          <label className="text-[9px] font-bold text-slate-muted uppercase font-sans">
                            Esquema BD
                          </label>
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
              <div className="mt-5 pt-3.5 border-t border-slate-muted/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold text-slate-muted uppercase block">Estado</span>
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
            <span>MODO: LIVE DATA HUB (MERCADO LIBRE API)</span>
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

      {/* MODAL CONEXIÓN MERCADO LIBRE */}
      {isMeliModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-muted/15 relative space-y-5">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b border-slate-muted/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-midnight">
                    Conectar cuenta de Mercado Libre
                  </h3>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                    OAuth 2.0 Server-Side
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMeliModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-muted flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Pasos */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-muted/15 space-y-2">
                <div className="flex items-center gap-2 text-midnight font-bold">
                  <span className="w-5 h-5 rounded-full bg-primary-blue text-white text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <span>Autorizá la aplicación en Mercado Libre</span>
                </div>
                <p className="text-[11px] text-slate-muted pl-7">
                  Hacé clic en el botón siguiente para iniciar sesión con tu cuenta de vendedor y otorgar los permisos.
                </p>
                <div className="pl-7 pt-1">
                  {meliAuthUrl ? (
                    <a
                      href={meliAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 cursor-pointer active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Abrir ventana de autorización de Mercado Libre ↗
                    </a>
                  ) : (
                    <div className="text-[11px] text-slate-muted italic">Generando enlace seguro...</div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-muted/15 space-y-2">
                <div className="flex items-center gap-2 text-midnight font-bold">
                  <span className="w-5 h-5 rounded-full bg-primary-blue text-white text-[10px] flex items-center justify-center">
                    2
                  </span>
                  <span>Confirmá el código o URL recibida</span>
                </div>
                <p className="text-[11px] text-slate-muted pl-7 leading-relaxed">
                  Una vez que hagas clic en &quot;Permitir&quot;, Mercado Libre te redirigirá a{" "}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] text-midnight font-mono">
                    https://arasy.app/api/integrations/mercadolibre/callback?code=...
                  </code>
                  . Copiá el <strong>código</strong> (o pegá toda la URL completa de tu barra de direcciones):
                </p>
                <div className="pl-7 pt-1 space-y-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Pegá aquí el código (ej: TG-64a...) o la URL completa"
                    className="w-full bg-white border border-slate-muted/25 rounded-xl py-2 px-3 text-xs font-mono text-midnight focus:outline-none focus:border-primary-blue"
                  />
                  {meliConnectError && (
                    <p className="text-rose-600 text-[11px] font-bold">{meliConnectError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-muted/10">
              <button
                type="button"
                onClick={() => setIsMeliModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-muted hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConnectWithCode}
                disabled={isSubmittingMeliCode}
                className="px-5 py-2 bg-primary-blue hover:bg-primary-blue/90 disabled:bg-slate-200 disabled:text-slate-muted text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 duration-100 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingMeliCode ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                    Vinculando cuenta...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Completar Conexión
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
