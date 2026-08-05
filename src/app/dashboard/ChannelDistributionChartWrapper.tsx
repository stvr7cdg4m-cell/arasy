"use client";

import React from "react";
import dynamic from "next/dynamic";

const ChannelDistributionChart = dynamic(() => import("./ChannelDistributionChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center border border-slate-100">
      <span className="text-xs text-slate-400 font-sans">
        Cargando Participación por Canal...
      </span>
    </div>
  ),
});

interface ChannelItem {
  name: string;
  value: number;
  color: string;
}

interface ChannelDistributionChartWrapperProps {
  data: ChannelItem[];
}

export default function ChannelDistributionChartWrapper({ data }: ChannelDistributionChartWrapperProps) {
  return <ChannelDistributionChart data={data} />;
}
