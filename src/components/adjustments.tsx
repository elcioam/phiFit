"use client"

import * as React from "react"
import PlotlyManager from "@/lib/plotly-manager"
import { linearFit, polynomialFit } from "@/lib/fits"
import { Button } from "@/components/ui/button"

export function Adjustments({ tableId }: { tableId: number }) {
  const [method, setMethod] = React.useState<"linear" | "polynomial">("linear")
  const [polyDegree, setPolyDegree] = React.useState<number>(2)
  const [running, setRunning] = React.useState(false)
  const [lastFit, setLastFit] = React.useState<null | {
    name: string
    coeffs: number[]
    stats: { r2: number; rmse: number; sse: number; sst: number }
  }>(null)

  async function runFit() {
    setRunning(true)
    try {
      const pointsName = `Tabela ${tableId} - pontos`
      const trace = PlotlyManager.getTraceByName(pointsName)
      if (!trace || !trace.x || !trace.y) {
        alert("Nenhum conjunto de pontos encontrado para esta tabela. Importe primeiro.")
        return
      }

      const xs = (trace.x as any[]).map((v) => Number(v))
      const ys = (trace.y as any[]).map((v) => Number(v))
      if (xs.length === 0 || ys.length === 0 || xs.length !== ys.length) {
        alert("Dados inválidos para ajuste.")
        return
      }

      // sort by x
      const pairs = xs.map((x, i) => ({ x, y: ys[i] })).sort((a, b) => a.x - b.x)
      const xsSorted = pairs.map((p) => p.x)
      const ysSorted = pairs.map((p) => p.y)

      let fitObj: { coeffs: number[]; evaluate: (x: number) => number }
      if (method === "linear") {
        fitObj = linearFit(xsSorted, ysSorted)
      } else {
        fitObj = polynomialFit(xsSorted, ysSorted, Math.max(1, Math.floor(polyDegree)))
      }

      // sample curve across a much extended domain so the fitted function is
      // continuous and visible well beyond the original data range.
      const minX = xsSorted[0]
      const maxX = xsSorted[xsSorted.length - 1]
      const span = maxX - minX
      // Use a large padding (100% on each side) for a long continuous curve.
      const padFactor = span === 0 ? 1.0 : 1.0
      const extMinX = minX - span * padFactor
      const extMaxX = maxX + span * padFactor
      const domainMin = span === 0 ? minX - padFactor : extMinX
      const domainMax = span === 0 ? maxX + padFactor : extMaxX
      const samples = 600
      const step = (domainMax - domainMin) / Math.max(1, samples - 1)
      const curveX: number[] = []
      const curveY: number[] = []
      for (let i = 0; i < samples; i++) {
        const xv = domainMin + step * i
        curveX.push(xv)
        curveY.push(fitObj.evaluate(xv))
      }

      const fitName = `Ajuste Tabela ${tableId} - ${method}${method === 'polynomial' ? ` (deg ${polyDegree})` : ''}`

      // Remove any existing fit traces/annotations for this table so only one fit
      // is present at a time (avoid linear + polynomial simultaneamente).
      const fitPrefix = `Ajuste Tabela ${tableId}`
      PlotlyManager.getAllTraceNames().forEach((n) => {
        if (n && n.startsWith(fitPrefix)) PlotlyManager.removeTraceByName(n)
      })

      // add the new fit curve
      PlotlyManager.addCurve(fitName, curveX, curveY)

      // build equation string from coeffs
      const coeffs = (fitObj as any).coeffs as number[]
      const stats = (fitObj as any).stats as { r2: number; rmse: number; sse: number; sst: number }
      const eqParts: string[] = []
      for (let i = 0; i < coeffs.length; i++) {
        const c = Number(coeffs[i])
        if (i === 0) eqParts.push(c.toFixed(4))
        else eqParts.push(`${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(4)} x${i === 1 ? '' : '^' + i}`)
      }
      const equation = `y = ${eqParts.join(' ')}`

      // add annotation near top-right of extended range
      const annotName = `${fitName} - eq`
      const maxCurveY = Math.max(...curveY)
      const annotX = domainMax
      const annotY = maxCurveY
      PlotlyManager.removeTraceByName(annotName)
      PlotlyManager.addAnnotation(annotName, equation, annotX, annotY)

      setLastFit({ name: fitName, coeffs, stats })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
      alert('Erro ao executar ajuste: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setRunning(false)
    }
  }

  function clearFits() {
    const prefix = `Ajuste Tabela ${tableId}`
    const names = PlotlyManager.getAllTraceNames()
    names.forEach((n) => {
      if (n && n.startsWith(prefix)) PlotlyManager.removeTraceByName(n)
    })
    setLastFit(null)
  }

  return (
    <div className="max-w-6xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Ajustes — Tabela {tableId}</h2>
        <div className="flex items-center gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value as any)} className="rounded border px-2 py-1">
            <option value="linear">Linear (OLS)</option>
            <option value="polynomial">Polinomial</option>
          </select>
          {method === 'polynomial' && (
            <input type="number" min={1} value={polyDegree} onChange={(e) => setPolyDegree(Number(e.target.value))} className="border rounded px-2 py-1 w-20" />
          )}
          <Button size="sm" onClick={runFit} disabled={running}>
            {running ? "Executando..." : "Executar ajuste"}
          </Button>
          <Button variant="outline" size="sm" onClick={clearFits}>
            Limpar ajustes
          </Button>
        </div>
      </div>

      <div className="rounded border p-4 bg-white">
        <p className="text-sm text-muted-foreground">Use "Executar ajuste" para calcular a curva a partir dos pontos da tabela.</p>
        {lastFit && (
          <div className="mt-4 text-sm">
            <div className="font-medium">Parâmetros do ajuste ({lastFit.name}):</div>
            <div className="mt-2">
              <div><strong>Coeficientes:</strong></div>
              <ul className="list-disc ml-6">
                {lastFit.coeffs.map((c, i) => (
                  <li key={i}>c{i} = {Number(c).toFixed(6)}</li>
                ))}
              </ul>
              <div className="mt-2"><strong>R²:</strong> {lastFit.stats.r2.toFixed(6)} &nbsp; <strong>RMSE:</strong> {lastFit.stats.rmse.toFixed(6)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Adjustments
