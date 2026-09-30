import type { Metadata } from "next";
import { Montserrat, Manrope } from "next/font/google";
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
  title: "Arasy | Consultoría en Optimización de Inventario & Ecommerce Intelligence",
  description: "Consultoría estratégica para Retail y E-commerce. Maximiza tu margen bruto, elimina el sobrestock y evita quiebres de ventas con análisis avanzado de datos.",
  keywords: ["Consultoría Ecommerce", "Retail Analytics", "Optimización de Inventario", "Margen Bruto", "Control de Stock", "Arasy"],
  authors: [{ name: "Arasy Consulting" }],
  openGraph: {
    title: "Arasy | Consultoría en Optimización de Inventario & Ecommerce",
    description: "Claridad para decidir. Transformamos tus datos de inventario y ventas en rentabilidad.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${manrope.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-midnight text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
