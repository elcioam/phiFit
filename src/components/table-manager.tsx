"use client"

import * as React from "react"
import PlotlyManager from "@/lib/plotly-manager"
import { Button } from "@/components/ui/button"

export function TableManager({ tableId }: { tableId: number }) {
  const [rows, setRows] = React.useState<{ x: number; y: number }[] | null>(null)
  const [imported, setImported] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  function onChooseFile() {
    if (imported) return
    fileInputRef.current?.click()
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return []

    // detect delimiter by counting occurrences in the first few lines
    const sample = lines.slice(0, Math.min(5, lines.length))
    const delimCandidates = [',', ';', '\t']
    const counts = delimCandidates.map((d) => sample.reduce((acc, cur) => acc + (cur.split(d).length - 1), 0))
    const best = counts.indexOf(Math.max(...counts))
    const delimiter = delimCandidates[best]

    const data: { x: number; y: number }[] = []

    // if first line looks like a header (non-numeric first two cols), skip it
    let start = 0
    const firstParts = lines[0].split(delimiter).map((p) => p.trim())
    if (firstParts.length >= 2) {
      const a = Number(firstParts[0])
      const b = Number(firstParts[1])
      if (!Number.isFinite(a) || !Number.isFinite(b)) start = 1
    }

    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim())
      if (parts.length < 2) continue
      const x = parseFloat(parts[0].replace(/\s+/g, ''))
      const y = parseFloat(parts[1].replace(/\s+/g, ''))
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      data.push({ x, y })
    }
    return data
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const text = await f.text()
    const data = parseCsv(text)
    if (!data || data.length === 0) {
      // no numeric rows found
      alert('Nenhum dado numérico encontrado no arquivo. Verifique o formato (x,y) e o separador.')
      return
    }

    // If there's already a trace for this table, replace it
    const traceName = `Tabela ${tableId} - pontos`
    if (PlotlyManager.hasTrace(traceName)) {
      PlotlyManager.removeTraceByName(traceName)
    }

    setRows(data)
    setImported(true)

    // plot points (will queue if plot not ready)
    const xs = data.map((r) => r.x)
    const ys = data.map((r) => r.y)
    PlotlyManager.addPoints(traceName, xs, ys)
  }

  function clear() {
    setRows(null)
    setImported(false)
    PlotlyManager.removeTraceByName(`Tabela ${tableId} - pontos`)
    // also reset file input value so user can re-import same file if desired
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  React.useEffect(() => {
    // Initialize from PlotlyManager: if there's already a trace, set imported and preview rows
    const traceName = `Tabela ${tableId} - pontos`
    if (PlotlyManager.hasTrace(traceName)) {
      const t = PlotlyManager.getTraceByName(traceName)
      if (t) {
        const xs = t.x as number[]
        const ys = t.y as number[]
        const combined = xs.map((x, i) => ({ x, y: ys[i] }))
        setRows(combined.slice(0, 10000))
        setImported(true)
      }
    }
  }, [tableId])

  return (
    <div className="max-w-6xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tabelas — Tabela {tableId}</h2>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={onFile} className="hidden" disabled={imported} />
          <Button variant="ghost" size="sm" onClick={onChooseFile} disabled={imported}>
            {imported ? "Importado" : "Importar CSV"}
          </Button>
          <Button variant="outline" size="sm" onClick={clear}>
            Limpar
          </Button>
        </div>
      </div>

      <div className="rounded border p-4 bg-white">
        {!rows && <p className="text-sm text-muted-foreground">Nenhum dado importado. Importe um CSV com duas colunas: x,y</p>}
        {rows && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Visualização (primeiras 20 linhas)</p>
            <div className="overflow-auto max-h-60 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">x</th>
                    <th className="p-2 text-left">y</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-2">{r.x}</td>
                      <td className="p-2">{r.y}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TableManager
