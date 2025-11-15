"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Table,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Gráfico",
      url: "grafico",
      icon: PieChart,
      isActive: true,
      
    },
    {
      title: "Tabelas",
      url: "tabelas",
      icon: Table,
      items: [
        {
          title: "Tabela 1",
          url: "tabelas/tabela-1",
        },
        {
          title: "Tabela 2",
          url: "tabelas/tabela-2",
        },
        {
          title: "Tabela 3",
          url: "tabelas/tabela-3",
        },
      ],
    },
    
    {
      title: "Ajuste de Curva",
      url: "ajuste",
      icon: Settings2,
      items: [
        {
          title: "Ajuste 1",
          url: "ajuste/1",
        },
        {
          title: "Ajuste 2",
          url: "ajuste/2",
        },
        {
          title: "Ajuste 3",
          url: "ajuste/3",
        },

      ],
    },
  ],
 
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        COLOCAR LOGO OU ALGO ASSIM
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        CEFET - MG BLABLA
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
