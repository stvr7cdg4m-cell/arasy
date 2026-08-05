"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MonthlyDataItem {
  monthName: string;
  revenue: number;
  goal: number;
  forecast: number;
  isFuture: boolean;
}

interface PerformanceChartProps {
  data: MonthlyDataItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MonthlyDataItem;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatARS = (val: number) =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(val);

    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl font-sans text-xs text-white">
        <p className="font-bold mb-2 border-b border-slate-800 pb-1.5 text-slate-300">
          {data.monthName}
        </p>
        <div className="space-y-1.5 font-medium">
          {data.isFuture ? (
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Forecast:</span>
              <span className="font-mono font-bold text-sky-400">
                {formatARS(data.forecast)}
              </span>
            </p>
          ) : (
            <p className="flex justify-between gap-6">
              <span className="text-slate-400">Venta Real:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatARS(data.revenue)}
              </span>
            </p>
          )}
          <p className="flex justify-between gap-6">
            <span className="text-slate-400">Meta Mensual:</span>
            <span className="font-mono font-bold text-amber-500">
              {formatARS(data.goal)}
            </span>
          </p>
          {!data.isFuture && data.goal > 0 && (
            <p className="flex justify-between gap-6 border-t border-slate-800 pt-1.5 text-[10px]">
              <span className="text-slate-400">Progreso de Meta:</span>
              <span
                className={`font-bold ${
                  data.revenue >= data.goal ? "text-emerald-400" : "text-amber-500"
                }`}
              >
                {Math.round((data.revenue / data.goal) * 100)}%
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
  // Formateador para el eje Y
  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Preparar los datos mapeados para los dos canales de barras
  const chartData = data.map((item) => ({
    ...item,
    // La primera barra muestra Venta Real si ya ocurrió, o Forecast si es futuro
    performanceValue: item.isFuture ? item.forecast : item.revenue,
  }));

  return (
    <div className="w-full h-64 font-sans mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(148, 163, 184, 0.15)"
          />
          <XAxis
            dataKey="monthName"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 9, fontWeight: 700 }}
            dy={8}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748B", fontSize: 9, fontWeight: 500 }}
            dx={-8}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
          />
          
          {/* Barra 1: Performance (Venta Real o Forecast) */}
          <Bar dataKey="performanceValue" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => {
              if (entry.isFuture) {
                // Futuro: Barra de Forecast con estilo punteado/transparente
                return (
                  <Cell
                    key={`cell-perf-${index}`}
                    fill="rgba(37, 99, 235, 0.08)"
                    stroke="#2563EB"
                    strokeWidth={1}
                    strokeDasharray="4 3"
                  />
                );
              } else {
                // Histórico: Barra de Venta Real sólida
                return (
                  <Cell
                    key={`cell-perf-${index}`}
                    fill="#2563EB"
                    className="hover:fill-primary-blue/90 transition-colors duration-150"
                  />
                );
              }
            })}
          </Bar>

          {/* Barra 2: Meta Mensual (Objetivo) */}
          <Bar dataKey="goal" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-goal-${index}`}
                fill="rgba(217, 119, 6, 0.06)"
                stroke="#D97706"
                strokeWidth={1}
                className="hover:stroke-amber-600 transition-colors duration-150"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
