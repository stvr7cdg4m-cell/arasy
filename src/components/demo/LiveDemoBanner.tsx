"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveDemoBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const router = useRouter();

  async function handleSimulate(action: "sale" | "alert" | "reset") {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/demo/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        router.refresh();
      } else {
        setStatusMsg(data.error || "Error al simular");
      }
    } catch {
      setStatusMsg("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <div className="bg-midnight/95 text-white border-b border-primary-blue/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold tracking-wide text-emerald-400 uppercase text-[10px]">
          Modo Presentación Demo
        </span>
        <span className="text-slate-400 hidden sm:inline">|</span>
        <span className="text-slate-300 hidden sm:inline">
          Datos de demostración interactiva
        </span>
      </div>

      <div className="flex items-center gap-2">
        {statusMsg && (
          <span className="bg-primary-blue/20 text-sky-300 px-2 py-1 rounded border border-primary-blue/40 text-[11px] font-medium animate-fade-in">
            {statusMsg}
          </span>
        )}

        <button
          onClick={() => handleSimulate("sale")}
          disabled={loading}
          className="bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
          title="Simular nueva venta ingresada hoy"
        >
          <span className="material-symbols-outlined text-[14px]">bolt</span>
          <span>+ Venta en Vivo</span>
        </button>

        <button
          onClick={() => handleSimulate("alert")}
          disabled={loading}
          className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
          title="Simular alerta de quiebre de stock"
        >
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>+ Alerta</span>
        </button>

        <button
          onClick={handleLogout}
          className="bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-medium ml-2"
          title="Salir del modo demostración"
        >
          <span className="material-symbols-outlined text-[14px]">logout</span>
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}
