import { Suspense } from "react";
import type { Metadata } from "next";
import { Montserrat, Manrope } from "next/font/google";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ARASY - Claridad para decidir",
  description: "Plataforma de Ecommerce Intelligence para la toma de decisiones estratégicas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex bg-ice text-midnight font-sans overflow-hidden" suppressHydrationWarning>
        {/* Navigation Sidebar */}
        <Suspense fallback={<aside className="fixed left-0 top-0 h-screen w-sidebar-width bg-midnight border-r border-white/10" />}>
          <Sidebar />
        </Suspense>

        {/* Work Area Shell */}
        <div className="flex-1 pl-sidebar-width h-screen max-h-screen flex flex-col overflow-hidden relative">
          <Suspense fallback={<header className="sticky top-0 right-0 w-full h-16 bg-[#EAF2FF]/80 border-b border-slate-muted/20" />}>
            <Header />
          </Suspense>
          <main className="flex-1 overflow-y-auto custom-scrollbar control-tower-line">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
