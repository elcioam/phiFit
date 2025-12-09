"use client"

import React, { useEffect, useRef, useState } from "react"
import PlotlyManager from "@/lib/plotly-manager"
import { Button } from "@/components/ui/button"
import { useSidebarNav } from "@/components/sidebar-nav"

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
	const { setSelected } = useSidebarNav()

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
		<div className="px-4 py-6">
			<h1 className="text-2xl text-center font-bold mb-4">Gráfico Gerado</h1>

			<div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
				{/* Main plot area (uses more columns to give the plot more space) */}
				<div className="col-span-1 md:col-span-9 lg:col-span-10 rounded border bg-white shadow-sm">
					<div
						ref={plotRef}
						role="region"
						aria-label="plotly-plot"
						className="mt-0 rounded bg-gray-50 w-full h-full"
						style={{ height: '70vh', minHeight: 420 }}
					>
						{loading && (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								Carregando plot...
							</div>
						)}
					</div>
				</div>

				{/* Right panel: summary, controls, trace list (narrower to give plot more space) */}
				<div className="col-span-1 md:col-span-3 lg:col-span-2 rounded border bg-white p-6 shadow-sm space-y-6 md:sticky md:top-6">
					<div>
						<div className="text-sm text-muted-foreground">Resumo</div>
						<div className="mt-2 grid grid-cols-2 gap-2">
							<div className="p-2 bg-gray-50 rounded">
								<div className="text-xs text-muted-foreground">Traces</div>
								<div className="font-medium" data-testid="traces-count">{PlotlyManager.getAllTraceNames().length}</div>
							</div>
							<div className="p-2 bg-gray-50 rounded">
								<div className="text-xs text-muted-foreground">Pontos totais</div>
								<div className="font-medium" data-testid="points-count">{(() => {
									const names = PlotlyManager.getAllTraceNames()
									let total = 0
									// count only traces whose stored trace has mode 'markers'
									names.forEach((n) => {
										if (typeof n !== 'string') return
										const obj = PlotlyManager.getTraceObject(n)
										if (!obj) return
										const mode = (obj.mode || '').toString().toLowerCase()
										if (mode.includes('marker') || mode.includes('markers')) {
											const t = PlotlyManager.getTraceByName(n)
											if (t && t.x) total += (t.x as any[]).length
										}
									})
									return total
								})()}</div>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<div className="text-sm text-muted-foreground">Ações</div>
						<div className="flex flex-col gap-2 mt-2">
							<Button onClick={() => {
								// clear plot
								PlotlyManager.clearPlot()
							}}>Limpar gráfico</Button>
							<Button variant="ghost" onClick={async () => {
								const gd = document.querySelector('[aria-label="plotly-plot"]') as any
								const Plotly = (window as any).Plotly
								if (!gd || !Plotly || !Plotly.toImage) {
									alert('Plotly não disponível para exportar imagem.')
									return
								}
								try {
									const dataUrl = await Plotly.toImage(gd, { format: 'png', width: 1600, height: 900 })
									const a = document.createElement('a')
									a.href = dataUrl
									a.download = 'plot.png'
									a.click()
								} catch (e) {
									// eslint-disable-next-line no-console
									console.error(e)
									alert('Erro ao exportar imagem')
								}
							}}>Exportar PNG</Button>
						</div>
					</div>

					<div>
						<div className="text-sm text-muted-foreground">Traces</div>
						<div className="mt-2 overflow-auto space-y-3" style={{ maxHeight: '50vh' }}>
							{PlotlyManager.getAllTraceNames().map((name) => {
								const obj = PlotlyManager.getTraceObject(name)
								const mode = obj?.mode ? obj.mode.toString().toLowerCase() : ''
								const isPoints = mode.includes('marker') || mode.includes('markers')
								const samples = obj?.x ? (obj.x as any[]).length : 0
								return (
									<div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
										<div className="flex-1">
											<div className="font-medium text-sm">{name}</div>
											<div className="text-xs text-muted-foreground">{isPoints ? `${samples} pontos` : `${mode || 'trace'}`}</div>
										</div>
										<div className="flex flex-col items-end gap-2 ml-2">
											<div className="flex gap-2">
												{(() => {
													const m = /Tabela (\d+) - pontos/.exec(name || '')
													if (m) {
														const id = m[1]
														return (
															<>
																<button className="text-xs text-blue-600" onClick={() => setSelected(`tabelas/tabela-${id}`)}>Ir para Tabela</button>
																<button className="text-xs text-gray-700" onClick={() => setSelected(`ajuste/${id}`)}>Ir para Ajuste</button>
															</>
														)
													}
													return null
												})()}
											</div>
											<div className="flex gap-2">
												<button className="text-xs text-blue-600" onClick={() => {
													const gd = document.querySelector('[aria-label="plotly-plot"]') as any
													const Plotly = (window as any).Plotly
													if (gd && Plotly) {
														const idx = (gd.data || []).findIndex((d: any) => d.name === name)
														if (idx >= 0) {
															const newVis = (gd.data[idx].visible === false || gd.data[idx].visible === 'legendonly') ? true : 'legendonly'
															Plotly.restyle(gd, { visible: newVis }, [idx])
														}
													}
												}}>Toggle</button>
												<button className="text-xs text-gray-700" onClick={() => {
													const t = PlotlyManager.getTraceByName(name)
													if (!t || !t.x) return
													const xs = t.x as any[]
													const ys = t.y as any[]
													let csv = 'x,y\n'
													for (let i = 0; i < xs.length; i++) csv += `${xs[i]},${ys[i]}\n`
													const blob = new Blob([csv], { type: 'text/csv' })
													const url = URL.createObjectURL(blob)
													const a = document.createElement('a')
													a.href = url
													a.download = `${name.replace(/\s+/g, '_')}.csv`
													a.click()
													URL.revokeObjectURL(url)
												}}>CSV</button>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			</div>

		</div>
	)
}
