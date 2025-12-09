"use client"

import { useCallback, type MouseEvent } from "react"
import { useSidebarNav } from "./sidebar-nav"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { selected, setSelected } = useSidebarNav()

  const handleSelect = useCallback(
    (key: string) => (e?: MouseEvent) => {
      e?.preventDefault()
      if (key) setSelected(key)
    },
    [setSelected]
  )

  const handleParentClick = useCallback(
    (parentUrl: string, defaultChild?: string) => (e?: MouseEvent) => {
      e?.preventDefault()
      try {
        const key = `sidebar:last:${parentUrl}`
        const last = (typeof window !== 'undefined' && window.localStorage.getItem(key)) || defaultChild
        if (last) setSelected(last)
      } catch (err) {
        if (defaultChild) setSelected(defaultChild)
      }
    },
    [setSelected]
  )

  const rememberChild = useCallback((parentUrl: string, childUrl: string) => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`sidebar:last:${parentUrl}`, childUrl)
      }
    } catch (_) {
      // ignore
    }
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>FERRAMENTAS</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasSub = Array.isArray(item.items) && item.items.length > 0
          // consider parent active if selected matches parent or any child
          const childSelected = hasSub && item.items!.some((s) => s.url === selected)
          const isActive = selected === item.url || childSelected

          return (
            <SidebarMenuItem key={item.title}>
              {/* Main button or label (if has children we render a non-clickable label) */}
              <SidebarMenuButton tooltip={item.title} asChild data-active={isActive}>
                {hasSub ? (
                  <button onClick={handleParentClick(item.url, item.items?.[0]?.url)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <button onClick={handleSelect(item.url)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </button>
                )}
              </SidebarMenuButton>

              {/* Subitems */}
              {hasSub && (
                <SidebarMenuSub>
                  {item.items!.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild data-active={selected === subItem.url}>
                        <button
                          onClick={(e) => {
                            handleSelect(subItem.url)(e)
                            rememberChild(item.url, subItem.url)
                          }}
                        >
                          <span>{subItem.title}</span>
                        </button>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
