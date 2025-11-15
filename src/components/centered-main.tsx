"use client"

import * as React from "react"
import { useSidebar } from "@/components/ui/sidebar"

export function CenteredMain({ children, trigger }: { children: React.ReactNode; trigger?: React.ReactNode }) {
  // The sidebar wrapper already reserves horizontal space (a gap element)
  // so we should not add an extra margin-left. Instead rely on the parent
  // `.group/sidebar-wrapper` being `display:flex` and make this main a
  // flexible item that fills the remaining space (`flex: 1`). That keeps
  // the content aligned to the true available area and avoids double-offset.
  const style: React.CSSProperties = {
    flex: 1,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 180ms ease",
    boxSizing: "border-box",
    padding: "1rem",
    position: "relative",
  }

  return (
    <main style={style}>
      {/*
        Position the trigger at the left edge of the main area. Because the
        main already starts after the sidebar gap, `left: 0` places the
        trigger exactly on that boundary. We translateX(-50%) so the
        trigger visually overlaps the boundary from the middle.
      */}
      {trigger && (
        <div
          // Use Tailwind utility classes for consistent theming and make the
          // trigger visually overlap the sidebar boundary. We vertically
          // center the trigger with top:50% and translateY(-50%).
          className="absolute left-0 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2"
          style={{ pointerEvents: "none" }}
        >
          {/* Allow the trigger itself to be interactive while the wrapper
              doesn't capture pointer events. */}
          <div className="pointer-events-auto rounded-md bg-white/90 shadow-md border border-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
            {trigger}
          </div>
        </div>
      )}

      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </main>
  )
}
