"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#070D18]/90 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center shrink-0 group">
          <Image
            src="/logo-negativo.svg"
            alt="ARASY Logo"
            width={200}
            height={60}
            className="h-12 sm:h-14 w-auto object-contain group-hover:scale-105 transition-transform"
            priority
          />
        </Link>

        {/* Desktop Navigation Links (Bold, Clean Pills) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
          <a
            href="#servicios"
            className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 tracking-wide"
          >
            Servicios
          </a>
          <a
            href="#plataformas"
            className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 tracking-wide"
          >
            Marketplaces & Canales
          </a>
          <a
            href="#metodologia"
            className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 tracking-wide"
          >
            Metodología
          </a>
          <a
            href="#tecnologia"
            className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 tracking-wide"
          >
            Tecnología Arasy
          </a>
        </nav>

        {/* Actions & CTA (Argentine voseo) */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="#contacto"
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span>Agendá una Consulta</span>
            <span className="material-symbols-outlined text-base">calendar_today</span>
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white focus:outline-none"
          aria-label="Abrir Menú"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-4 pb-6 space-y-3 animate-fade-in">
          <a
            href="#servicios"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl bg-slate-900 text-slate-100 font-bold text-base hover:bg-slate-800"
          >
            Servicios
          </a>
          <a
            href="#plataformas"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl bg-slate-900 text-slate-100 font-bold text-base hover:bg-slate-800"
          >
            Marketplaces & Canales
          </a>
          <a
            href="#metodologia"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl bg-slate-900 text-slate-100 font-bold text-base hover:bg-slate-800"
          >
            Metodología
          </a>
          <a
            href="#tecnologia"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-4 py-3 rounded-xl bg-slate-900 text-slate-100 font-bold text-base hover:bg-slate-800"
          >
            Tecnología Arasy
          </a>
          <a
            href="#contacto"
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full text-center bg-gradient-to-r from-blue-600 to-teal-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 text-base mt-2"
          >
            Agendá una Consulta
          </a>
        </div>
      )}
    </header>
  );
}
