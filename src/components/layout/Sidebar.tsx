"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Planning Inteligente", href: "/planning", icon: "calendar_today" },
  { name: "Mix Optimizer", href: "/mix-optimizer", icon: "analytics" },
  { name: "Análisis de Stock", href: "/stock-analysis", icon: "inventory_2" },
  { name: "Decision Center AI", href: "/decision-center", icon: "psychology" },
  { name: "Integraciones", href: "/integrations", icon: "sync" },
];

import { useState, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const [userName, setUserName] = useState("Federico RM");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setUserName(localStorage.getItem("arasy_user_name") || "Federico RM");
    
    const handleConfigChange = () => {
      setUserName(localStorage.getItem("arasy_user_name") || "Federico RM");
    };
    /* eslint-enable react-hooks/set-state-in-effect */
    window.addEventListener("arasy_config_changed", handleConfigChange);
    return () => window.removeEventListener("arasy_config_changed", handleConfigChange);
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-midnight flex flex-col py-margin-desktop z-50 border-r border-white/10">
      {/* Brand Header */}
      <div className="px-6 mb-10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-negativo.svg"
            alt="ARASY Logo"
            width={120}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const hrefWithMonth = month ? `${item.href}?month=${month}` : item.href;
          return (
            <Link
              key={item.href}
              href={hrefWithMonth}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-primary-blue text-white shadow-lg shadow-primary-blue/20 font-medium"
                  : "text-slate-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="text-sm font-sans">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="mt-auto px-6 border-t border-white/10 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-blue bg-white/5 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-[24px]">
              account_circle
            </span>
          </div>
          <div>
            <p className="text-white font-medium text-xs font-sans">{userName}</p>
            <p className="text-slate-muted text-[10px] uppercase font-bold tracking-wider font-sans">
              Exec. Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
