import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNavProvider, SidebarNavOutlet } from "@/components/sidebar-nav"
import { AppSidebar } from "@/components/app-sidebar"
import GraficoPage from "@/app/grafico"
import { CenteredMain } from "@/components/centered-main"
import TableManager from "@/components/table-manager"
import Adjustments from "@/components/adjustments"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fisfit",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider>
          <SidebarNavProvider defaultSelected={"grafico"}>
            <AppSidebar />

            <CenteredMain trigger={<SidebarTrigger />}>
              {/*
                SidebarNavOutlet is a slot: place your pages as children here
                and give them `data-key` attributes that match the `url` keys
                used in the sidebar data (for example: "grafico", "tabelas",
                "tabelas/tabela-1", "ajuste/1", ...).

                The outlet will render only the child whose `data-key` equals
                the currently selected sidebar item. Replace the placeholders
                below with your real pages or components.
              */}
              <SidebarNavOutlet>
                {/* Default content (renders when selected === "grafico") */}
                  <div data-key="grafico">
                    <GraficoPage />
                  </div>

                {/* Replace these placeholders with your pages/components */}
                <div data-key="tabelas">{/* Sua página de tabelas (padrão) */}</div>
                <div data-key="tabelas/tabela-1">
                  {/* Tabela 1 */}
                  <TableManager tableId={1} />
                </div>
                <div data-key="tabelas/tabela-2">
                  {/* Tabela 2 */}
                  <TableManager tableId={2} />
                </div>
                <div data-key="tabelas/tabela-3">
                  {/* Tabela 3 */}
                  <TableManager tableId={3} />
                </div>
                <div data-key="ajuste">{/* Ajuste de Curva (padrão) */}</div>
                <div data-key="ajuste/1">
                  {/* Ajuste 1 */}
                  <Adjustments tableId={1} />
                </div>
                <div data-key="ajuste/2">
                  {/* Ajuste 2 */}
                  <Adjustments tableId={2} />
                </div>
                <div data-key="ajuste/3">
                  {/* Ajuste 3 */}
                  <Adjustments tableId={3} />
                </div>
              </SidebarNavOutlet>
            </CenteredMain>
          </SidebarNavProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
