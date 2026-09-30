"use client";

import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChannelItem {
  name: string;
  value: number;
  color: string;
}

interface ChannelDistributionChartProps {
  data: ChannelItem[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChannelItem;
    value: number;
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
          {data.name}
        </p>
        <div className="space-y-1 font-medium">
          <p className="flex justify-between gap-6">
            <span className="text-slate-400">Ingresos:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatARS(data.value)}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ChannelDistributionChart({ data }: ChannelDistributionChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Evitar setState sincrónico dentro del cuerpo del efecto
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);

  // Mapear los datos para agregar el porcentaje y formato
  const chartData = data.map((item) => ({
    ...item,
    percentage: totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0,
  }));

  const formatLegendValue = (value: string) => {
    const item = chartData.find((d) => d.name === value);
    if (!item) return value;
    return (
      <span className="text-xs font-semibold text-midnight font-sans">
        {value} ({item.percentage.toFixed(1)}%)
      </span>
    );
  };

  if (!isMounted) {
    return (
      <div className="w-full h-56 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center border border-slate-100">
        <span className="text-xs text-slate-400 font-sans">
          Cargando Distribución por Canal...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-56 font-sans">
      {totalRevenue === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-slate-muted text-xs italic">
          Sin datos de facturación para este período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="40%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              iconSize={8}
              formatter={formatLegendValue}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
