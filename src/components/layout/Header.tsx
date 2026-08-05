"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // States de Períodos Dinámicos (Fase C)
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [monthOptions, setMonthOptions] = useState<{ value: string; label: string }[]>([]);

  // States para Paneles Desplegables
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  // States de Configuración (Demo Backend Panel)
  const [userName, setUserName] = useState("Federico RM");
  const [userEmail, setUserEmail] = useState("federico@arasy.app");
  const [meliCommission, setMeliCommission] = useState("14.5");
  const [stockCoverage, setStockCoverage] = useState("1.5");

  // Cargar valores iniciales desde localStorage y generar opciones de meses (Fase C)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (typeof window !== "undefined") {
      setUserName(localStorage.getItem("arasy_user_name") || "Federico RM");
      setUserEmail(localStorage.getItem("arasy_user_email") || "federico@arasy.app");
      setMeliCommission(localStorage.getItem("arasy_meli_commission") || "14.5");
      setStockCoverage(localStorage.getItem("arasy_stock_coverage") || "1.5");
    }

    // Generar opciones de meses relativas al mes actual
    const options = [];
    const currentDate = new Date();
    for (let i = -12; i <= 2; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      let label = date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      if (i === 0) {
        label += " (Actual)";
      } else if (i > 0) {
        label += " (FCST)";
      }
      options.push({ value, label });
    }
    setMonthOptions(options);

    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(searchParams.get("month") || currentMonthStr);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  interface AlertItem {
    id: string;
    type: string;
    message: string;
    date: string;
    product: {
      sku: string;
      name: string;
    };
  }

  const [notifications, setNotifications] = useState<AlertItem[]>([]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.alerts || []);
        setUnreadNotifications(data.alerts && data.alerts.length > 0);
      }
    } catch (e) {
      console.error("Error fetching alerts in Header:", e);
    }
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchAlerts();

    const handleAlertsUpdate = () => {
      fetchAlerts();
    };
    /* eslint-enable react-hooks/set-state-in-effect */

    window.addEventListener("arasy_alerts_updated", handleAlertsUpdate);
    return () => {
      window.removeEventListener("arasy_alerts_updated", handleAlertsUpdate);
    };
  }, []);

  const getSeverity = (type: string) => {
    if (type === "QUIEBRE") return "critical";
    if (type === "SOBRESTOCK") return "warning";
    return "info";
  };

  const getTitle = (type: string) => {
    if (type === "QUIEBRE") return "Riesgo de Quiebre Inminente";
    if (type === "SOBRESTOCK") return "Exceso de Stock Crítico";
    return "Alerta de Operación";
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", val);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Guardar configuración del Panel Demo
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("arasy_user_name", userName);
    localStorage.setItem("arasy_user_email", userEmail);
    localStorage.setItem("arasy_meli_commission", meliCommission);
    localStorage.setItem("arasy_stock_coverage", stockCoverage);
    
    // Disparar evento para que otros componentes (como el Sidebar) se actualicen reactivamente
    window.dispatchEvent(new Event("arasy_config_changed"));
    
    setShowConfig(false);
  };

  // La lista estática ha sido reemplazada por la carga dinámica de la base de datos

  return (
    <>
      <header className="sticky top-0 right-0 w-full h-16 bg-[#EAF2FF]/80 backdrop-blur-md flex justify-between items-center px-gutter z-40 border-b border-slate-muted/20">
        {/* Search Bar / Context */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-xs group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted/80 text-[18px]">
              search
            </span>
            <input
              type="text"
              className="w-full bg-[#EAF2FF]/50 border border-slate-muted/20 rounded-xl py-2 pl-9 pr-4 text-xs font-sans text-midnight focus:outline-none focus:ring-2 focus:ring-primary-blue/20 transition-all placeholder:text-slate-muted"
              placeholder="Buscar datos operativos..."
            />
          </div>

          {/* Selector de Mes Dinámico */}
          <div className="flex items-center gap-2 bg-[#EAF2FF]/50 border border-slate-muted/20 rounded-xl px-3 py-1.5 shrink-0">
            <span className="material-symbols-outlined text-[16px] text-slate-muted">calendar_today</span>
            <span className="text-[9px] font-bold text-slate-muted uppercase tracking-wider hidden md:inline">Período</span>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-transparent text-xs font-bold text-midnight focus:outline-none cursor-pointer font-sans"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Profile & Alerts info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-slate-muted">
            {/* Campanita de Notificaciones */}
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowConfig(false);
                setUnreadNotifications(false);
              }}
              className="hover:text-primary-blue transition-all relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                notifications
              </span>
              {unreadNotifications && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-coral-liquidate rounded-full border border-[#EAF2FF]"></span>
              )}
            </button>

            {/* Icono de la Hoja (Demo Config Panel) */}
            <button 
              onClick={() => {
                setShowConfig(!showConfig);
                setShowNotifications(false);
              }}
              className="hover:text-primary-blue transition-all cursor-pointer relative"
              title="Configuración de Demo (Backend Simulator)"
            >
              <span className="material-symbols-outlined text-[22px]">
                history_edu
              </span>
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-muted/20"></div>
          <div className="font-display font-bold text-sm text-midnight tracking-tight flex items-center gap-2">
            <span>ARASY</span>
            <span className="text-xs bg-primary-blue/10 text-primary-blue px-2 py-0.5 rounded-full font-sans font-medium">
              Demo
            </span>
          </div>
        </div>
      </header>

      {/* Drawer: Campanita de Notificaciones */}
      {showNotifications && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-md border-l border-slate-muted/10 shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-muted/10 mb-4">
              <div className="flex items-center gap-2 text-midnight">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <h3 className="font-display font-bold text-sm">Notificaciones</h3>
              </div>
              <button 
                onClick={() => setShowNotifications(false)} 
                className="text-slate-muted hover:text-midnight cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar pr-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-muted font-sans font-medium">
                  No hay alertas operativas pendientes.
                </div>
              ) : (
                notifications.map((notif) => {
                  const severity = getSeverity(notif.type);
                  return (
                    <div 
                      key={notif.id} 
                      className={`p-3.5 rounded-xl border text-xs font-sans space-y-1.5 ${
                        severity === "critical" 
                          ? "bg-coral-liquidate/5 border-coral-liquidate/20"
                          : severity === "warning"
                          ? "bg-gold-maintain/5 border-gold-maintain/20"
                          : "bg-primary-blue/5 border-primary-blue/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          severity === "critical"
                            ? "bg-coral-liquidate/10 text-coral-liquidate"
                            : severity === "warning"
                            ? "bg-gold-maintain/10 text-gold-maintain"
                            : "bg-primary-blue/10 text-primary-blue"
                        }`}>
                          {notif.type}
                        </span>
                        <span className="text-[9px] text-slate-muted">
                          {new Date(notif.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <h4 className="font-bold text-midnight">{getTitle(notif.type)}</h4>
                      <p className="text-slate-muted leading-relaxed text-[11px]">{notif.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowNotifications(false)}
            className="w-full py-2.5 bg-ice hover:bg-slate-200 text-midnight text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Drawer: Configuración de Demo Backend (Icono de la Hoja) */}
      {showConfig && (
        <div className="fixed inset-y-0 right-0 w-80 bg-midnight text-white border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          <form onSubmit={handleSaveConfig} className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2 text-teal-push">
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <h3 className="font-display font-bold text-sm text-white">Consola Demo Backend</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowConfig(false)} 
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="space-y-5 text-xs">
                <p className="text-slate-muted text-[11px] leading-relaxed">
                  Utiliza este panel para emular configuraciones internas del sistema y ajustar variables en tiempo real.
                </p>

                {/* Parámetro: Nombre de Usuario */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-muted font-sans">Nombre de Usuario</label>
                  <input 
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 text-xs font-bold"
                  />
                </div>

                {/* Parámetro: Correo del Usuario */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-muted font-sans">Email Administrador</label>
                  <input 
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 text-xs"
                  />
                </div>

                {/* Parámetro: Comisión Mercado Libre */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-muted font-sans">Comisión Mercado Libre (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={meliCommission}
                    onChange={(e) => setMeliCommission(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 text-xs font-mono font-bold"
                  />
                </div>

                {/* Parámetro: Cobertura de Stock */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-muted font-sans">Cobertura Stock Objetivo (Meses)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="12"
                    value={stockCoverage}
                    onChange={(e) => setStockCoverage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-blue/30 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              <button 
                type="submit"
                className="w-full py-3 bg-primary-blue hover:bg-primary-blue/90 text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-sans shadow-lg shadow-primary-blue/25 text-center"
              >
                Guardar Configuración
              </button>
              <button 
                type="button"
                onClick={() => {
                  // Resetear valores de demo
                  setUserName("Federico RM");
                  setUserEmail("federico@arasy.app");
                  setMeliCommission("14.5");
                  setStockCoverage("1.5");
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-muted text-xs font-bold rounded-xl transition-all cursor-pointer font-sans text-center"
              >
                Restablecer Valores
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
