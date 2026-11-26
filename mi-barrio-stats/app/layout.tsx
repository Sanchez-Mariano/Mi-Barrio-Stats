import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";

// Serif con carácter para títulos: evoca los informes impresos del INDEC,
// no un dashboard de SaaS.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

// Sans institucional (nació para formularios de gobierno de EE.UU.) para
// texto, etiquetas y datos. Reemplaza a la monoespaciada para los números.
const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mi Barrio Stats · Partido de Tigre y GBA Norte",
  description:
    "Dashboard interactivo con indicadores sociodemográficos del Partido de Tigre y el GBA Norte, basado en el Censo 2022 de INDEC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${fraunces.variable} ${publicSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}