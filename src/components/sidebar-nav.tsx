"use client"

import * as React from "react"

type SidebarNavContextType = {
  selected: string
  setSelected: (key: string) => void
}

const SidebarNavContext = React.createContext<SidebarNavContextType | null>(null)

export function SidebarNavProvider({
  defaultSelected = "",
  children,
}: {
  defaultSelected?: string
  children: React.ReactNode
}) {
  const [selected, setSelected] = React.useState(defaultSelected)

  const value = React.useMemo(
    () => ({ selected, setSelected }),
    [selected]
  )

  return (
    <SidebarNavContext.Provider value={value}>
      {children}
    </SidebarNavContext.Provider>
  )
}

export function useSidebarNav() {
  const ctx = React.useContext(SidebarNavContext)
  if (!ctx) {
    throw new Error("useSidebarNav must be used within a SidebarNavProvider")
  }
  return ctx
}

/**
 * SidebarNavOutlet renders only the child whose `data-key` matches the
 * currently selected key from the sidebar nav context. Use this in layout
 * as a slot — place your pages as children and annotate them with
 * `data-key="your-key"` (matching the `url` or `key` you use in the nav).
 */
export function SidebarNavOutlet({ children }: { children: React.ReactNode }) {
  const { selected } = useSidebarNav()

  const items = React.Children.toArray(children) as React.ReactElement<Record<string, unknown>>[]

  // Try to find child with matching data-key prop
  const matched = items.find((child) => {
    const key = (child.props as Record<string, unknown>)?.['data-key']
    return typeof key === 'string' && key === selected
  })

  if (matched) return matched

  // If no match, render the first child as fallback (or null if none)
  return items[0] ?? null
}
