type QueuedOp = { type: 'points' | 'curve' | 'remove' | 'clear'; payload: any }

class PlotlyManagerClass {
  private plotEl: HTMLElement | null = null
  private Plotly: any = null
  private queued: QueuedOp[] = []
  private nameColor = new Map<string, string>()
  private traces: any[] = []
  private palette = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  ]
  private nextColor = 0

  register(plotEl: HTMLElement, PlotlyLib: any) {
    this.plotEl = plotEl
    this.Plotly = PlotlyLib
    // ensure there is an empty plot
    try {
      // restore traces we have saved, or empty
      this.Plotly.newPlot(this.plotEl, this.traces.length ? this.traces : [], { autosize: true })
    } catch (e) {
      // ignore
    }
    // flush queued ops
    this.flushQueue()
  }

  unregister() {
    if (this.Plotly && this.plotEl) {
      try {
        this.Plotly.purge(this.plotEl)
      } catch (_) {}
    }
    this.plotEl = null
    this.Plotly = null
    this.queued = []
  }

  private colorFor(name: string) {
    if (this.nameColor.has(name)) return this.nameColor.get(name)!
    const c = this.palette[this.nextColor % this.palette.length]
    this.nextColor += 1
    this.nameColor.set(name, c)
    return c
  }

  private flushQueue() {
    if (!this.plotEl || !this.Plotly) return
    for (const op of this.queued) {
      if (op.type === 'points') {
        const { name, xs, ys } = op.payload
        this._addPointsInternal(name, xs, ys)
      } else if (op.type === 'curve') {
        const { name, xs, ys, dash } = op.payload
        this._addCurveInternal(name, xs, ys, dash)
      } else if (op.type === 'remove') {
        this._removeTraceByNameInternal(op.payload.name)
      } else if (op.type === 'clear') {
        this._clearInternal()
      }
    }
    this.queued = []
  }

  addPoints(name: string, xs: number[], ys: number[]) {
    if (!xs || xs.length === 0) return
    if (!this.plotEl || !this.Plotly) {
      this.queued.push({ type: 'points', payload: { name, xs, ys } })
      return
    }
    this._addPointsInternal(name, xs, ys)
  }

  private _addPointsInternal(name: string, xs: number[], ys: number[]) {
    const color = this.colorFor(name)
    const trace = {
      x: xs,
      y: ys,
      mode: 'markers',
      type: 'scatter',
      name,
      marker: { color },
    }
    // replace any existing trace with same name (avoid duplicates)
    this.traces = this.traces.filter((t: any) => t.name !== name)
    // save in our traces list (source of truth)
    this.traces.push(trace)
    try {
      this.Plotly.addTraces(this.plotEl, trace)
    } catch (e) {
      // fallback: recreate plot from our traces
      try {
        const gd = this.plotEl
        this.Plotly.newPlot(gd, this.traces)
      } catch (_) {}
    }
  }

  addCurve(name: string, xs: number[], ys: number[], dash: string | null = null) {
    if (!xs || xs.length === 0) return
    if (!this.plotEl || !this.Plotly) {
      this.queued.push({ type: 'curve', payload: { name, xs, ys, dash } })
      return
    }
    this._addCurveInternal(name, xs, ys, dash)
  }

  private _addCurveInternal(name: string, xs: number[], ys: number[], dash: string | null) {
    const color = this.colorFor(name)
    const trace: any = {
      x: xs,
      y: ys,
      mode: 'lines',
      type: 'scatter',
      name,
      line: { color, width: 2 },
    }
    if (dash) trace.line.dash = dash
    // replace any existing trace with same name (avoid duplicates)
    this.traces = this.traces.filter((t: any) => t.name !== name)
    // save trace
    this.traces.push(trace)
    try {
      this.Plotly.addTraces(this.plotEl, trace)
    } catch (e) {
      try {
        const gd = this.plotEl
        this.Plotly.newPlot(gd, this.traces)
      } catch (_) {}
    }
  }

  removeTraceByName(name: string) {
    if (!this.plotEl || !this.Plotly) {
      this.queued.push({ type: 'remove', payload: { name } })
      return
    }
    this._removeTraceByNameInternal(name)
  }

  hasTrace(name: string) {
    return this.traces.some((t: any) => t.name === name)
  }

  getTraceByName(name: string) {
    const t = this.traces.find((tr: any) => tr.name === name)
    if (!t) return null
    return { x: t.x || [], y: t.y || [] }
  }

  getAllTraceNames() {
    return this.traces.map((t: any) => t.name)
  }

  /** Return the stored trace object (as saved in manager) by name, or null */
  getTraceObject(name: string) {
    const t = this.traces.find((tr: any) => tr.name === name)
    return t || null
  }

  addAnnotation(name: string, text: string, x: number, y: number) {
    // remove existing annotation with same name
    this.traces = this.traces.filter((t: any) => t.name !== name)
    const trace: any = {
      x: [x],
      y: [y],
      text: [text],
      mode: 'text',
      type: 'scatter',
      name,
      textfont: { size: 12, color: '#111' },
    }
    this.traces.push(trace)
    try {
      this.Plotly.addTraces(this.plotEl, trace)
    } catch (e) {
      try {
        const gd = this.plotEl
        this.Plotly.newPlot(gd, this.traces)
      } catch (_) {}
    }
  }

  private _removeTraceByNameInternal(name: string) {
    try {
      // remove from saved traces then re-render
      this.traces = this.traces.filter((t: any) => t.name !== name)
      const gd = this.plotEl as any
      this.Plotly.newPlot(gd, this.traces)
    } catch (e) {
      // ignore
    }
  }

  clearPlot() {
    if (!this.plotEl || !this.Plotly) {
      this.queued.push({ type: 'clear', payload: null })
      return
    }
    this._clearInternal()
  }

  private _clearInternal() {
    try {
      this.traces = []
      this.Plotly.newPlot(this.plotEl, [])
    } catch (e) {}
  }
}

const PlotlyManager = new PlotlyManagerClass()

export default PlotlyManager
