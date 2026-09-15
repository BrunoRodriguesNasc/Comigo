import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], display: "swap", variable: "--font-nunito" });
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-fraunces", axes: ["SOFT", "opsz"] });

export const metadata: Metadata = {
  title: { default: "COMIGO — o cosmético que combina com você", template: "%s · COMIGO" },
  description: "Analise um cosmético e descubra se ele combina com a sua pele e as suas preferências — com os motivos explicados.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, title: "COMIGO", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fdf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
