"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface IntegrationState {
  id: string;
  name: string;
  type: "CHANNEL" | "ERP";
  status: "CONNECTED" | "DISCONNECTED" | "WARNING" | "SYNCING";
  lastSync: string;
  logoIcon: string;
}

export default function ChannelSyncStatus() {
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    {
      id: "meli",
      name: "Mercado Libre",
      type: "CHANNEL",
      status: "CONNECTED",
      lastSync: "Hace 10 min",
      logoIcon: "shopping_bag",
    },
    {
      id: "shopify",
      name: "Shopify Store",
      type: "CHANNEL",
      status: "CONNECTED",
      lastSync: "Hace 12 min",
      logoIcon: "storefront",
    },
    {
      id: "erp",
      name: "SAP ERP Business One",
      type: "ERP",
      status: "CONNECTED",
      lastSync: "Hace 15 min",
      logoIcon: "database",
    },
  ]);

  const loadStatus = () => {
    const saved = localStorage.getItem("arasy_integrations_status");
    if (saved) {
      try {
        setIntegrations(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    // Evitar llamada síncrona que dispare renderizado en cascada
    const timer = setTimeout(() => {
      loadStatus();
    }, 0);

    window.addEventListener("arasy_integrations_changed", loadStatus);
    window.addEventListener("arasy_alerts_updated", loadStatus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("arasy_integrations_changed", loadStatus);
      window.removeEventListener("arasy_alerts_updated", loadStatus);
    };
  }, []);

  return (
    <div className="space-y-4">
      {integrations.map((it) => {
        const isConnected = it.status === "CONNECTED";
        const isWarning = it.status === "WARNING";

        return (
          <div
            key={it.id}
            className="flex items-center justify-between border-b border-slate-muted/5 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-muted/10 flex items-center justify-center text-midnight shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  {it.logoIcon}
                </span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-midnight font-sans">
                  {it.name}
                </h5>
                <span className="text-[9px] text-slate-muted font-sans font-medium">
                  Sincronizado: {it.lastSync}
                </span>
              </div>
            </div>

            {/* Estado Badge */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-emerald-500 animate-pulse"
                    : isWarning
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-400"
                }`}
              ></span>
              <span
                className={`text-[9px] font-bold font-sans uppercase tracking-wider ${
                  isConnected
                    ? "text-emerald-600"
                    : isWarning
                    ? "text-amber-600 font-bold"
                    : "text-slate-muted"
                }`}
              >
                {isConnected ? "Conectado" : isWarning ? "Error API" : "Offline"}
              </span>
            </div>
          </div>
        );
      })}

      <div className="pt-2">
        <Link
          href="/integrations"
          className="w-full bg-ice hover:bg-primary-blue/10 text-primary-blue text-xs font-bold py-2.5 rounded-xl transition-colors font-sans flex items-center justify-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">sync</span>
          Gestionar Conexiones
        </Link>
      </div>
    </div>
  );
}
