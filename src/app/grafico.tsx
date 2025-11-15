"use client"

import React, { useEffect, useRef, useState } from "react"
import PlotlyManager from "@/lib/plotly-manager"

/**
 * GraficoPage — renders an empty Plotly plot area. Plotly is imported
 * dynamically from `plotly.js-dist-min` when available, with a CDN
 * fallback to `https://cdn.plot.ly/plotly-latest.min.js` so this component
 * works even if the npm package is not installed.
 *
 * The plot is initially empty (no traces). Use this container to add
 * traces/annotations later.
 */
export default function GraficoPage() {
	const plotRef = useRef<HTMLDivElement | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		async function loadPlotly() {
			try {
				// Try to dynamically import the npm package first (fast if installed).
				const Plotly = await import("plotly.js-dist-min")
				if (!mounted) return
				if (plotRef.current) {
					// Create an empty plot (no data). User will add traces later.
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					Plotly.newPlot(plotRef.current, [], { autosize: true })
					// register with the manager so other components can add traces
					try {
						PlotlyManager.register(plotRef.current, Plotly)
					} catch (_) {}
				}
			} catch (err) {
				// If import fails (package not installed), load from CDN as fallback.
				try {
					await new Promise<void>((resolve, reject) => {
						if ((window as any).Plotly) return resolve()
						const s = document.createElement("script")
						s.src = "https://cdn.plot.ly/plotly-latest.min.js"
						s.async = true
						s.onload = () => resolve()
						s.onerror = () => reject(new Error("Failed to load Plotly from CDN"))
						document.head.appendChild(s)
					})

					if (!mounted) return
					const Plotly = (window as any).Plotly
					if (plotRef.current && Plotly) {
						Plotly.newPlot(plotRef.current, [], { autosize: true })
						try {
							PlotlyManager.register(plotRef.current, Plotly)
						} catch (_) {}
					}
				} catch (e) {
					// If CDN also fails, leave the placeholder and report in console.
					// The page still renders; user can install `plotly.js-dist-min`.
					// eslint-disable-next-line no-console
					console.error("Could not load Plotly:", e)
				}
			} finally {
				if (mounted) setLoading(false)
			}
		}

		loadPlotly()

		return () => {
			mounted = false
			// If Plotly was loaded, purge the plot to avoid leaks.
			const Plotly = (window as any).Plotly
			if (Plotly && plotRef.current) {
				try {
					Plotly.purge(plotRef.current)
				} catch (_) {
					// ignore purge errors
				}
			}
		}
	}, [])

	return (
		<div className="p-6">
			<h1 className="text-2xl text-center font-bold mb-4">Gráfico Gerado</h1>

			<div className="mb-4 rounded border bg-white p-4 shadow-sm">
			
				<div
					ref={plotRef}
					role="region"
					aria-label="plotly-plot"
					className="mt-4 rounded bg-gray-50"
					style={{ width: 'min(1200px, 92vw)', height: 600 }}
				>
					{loading && (
						<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
							Carregando plot...
						</div>
					)}
				</div>
			</div>

			<div>
				
			</div>
		</div>
	)
}
