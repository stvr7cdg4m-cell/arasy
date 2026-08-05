"use client";

import React from "react";
import dynamic from "next/dynamic";

const PerformanceChart = dynamic(() => import("./PerformanceChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center border border-slate-100">
      <span className="text-xs text-slate-400 font-sans">
        Cargando Gráfico Interactivo...
      </span>
    </div>
  ),
});

interface MonthlyDataItem {
  monthName: string;
  revenue: number;
  goal: number;
  forecast: number;
  isFuture: boolean;
}

interface PerformanceChartWrapperProps {
  data: MonthlyDataItem[];
}

export default function PerformanceChartWrapper({ data }: PerformanceChartWrapperProps) {
  return <PerformanceChart data={data} />;
}
