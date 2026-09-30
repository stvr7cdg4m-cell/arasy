import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import LiveDemoBanner from "@/components/demo/LiveDemoBanner";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full flex bg-ice text-midnight font-sans overflow-hidden">
      {/* Navigation Sidebar */}
      <Suspense fallback={<aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-midnight border-r border-white/10" />}>
        <Sidebar />
      </Suspense>

      {/* Work Area Shell */}
      <div className="flex-1 lg:pl-sidebar-width h-screen max-h-screen flex flex-col overflow-hidden relative">
        <Suspense fallback={<header className="sticky top-0 right-0 w-full h-16 bg-[#EAF2FF]/80 border-b border-slate-muted/20" />}>
          <Header />
        </Suspense>
        
        {/* Interactive Bar for Live Demonstrations */}
        <LiveDemoBanner />

        <main className="flex-1 overflow-y-auto custom-scrollbar control-tower-line">
          {children}
        </main>
      </div>
    </div>
  );
}
