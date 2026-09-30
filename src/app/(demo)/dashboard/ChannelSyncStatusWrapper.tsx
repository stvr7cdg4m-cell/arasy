"use client";

import React from "react";
import dynamic from "next/dynamic";

const ChannelSyncStatus = dynamic(() => import("./ChannelSyncStatus"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center border border-slate-100">
      <span className="text-xs text-slate-400 font-sans">
        Cargando Estado de Sincronización...
      </span>
    </div>
  ),
});

export default function ChannelSyncStatusWrapper() {
  return <ChannelSyncStatus />;
}
