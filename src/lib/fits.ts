// ...existing code...
/**
 * Minimal fitting utilities.
 *
 * polynomialFit(xs, ys, degree)
 * - returns { coeffs, evaluate }
 *   coeffs: [c0, c1, ... , c_degree] where p(x) = c0 + c1*x + ... 
 *   evaluate(x) returns p(x)
 *
 * linearFit is a convenience wrapper for degree=1.
 */

export function linearFit(xs: number[], ys: number[]) {
  return polynomialFit(xs, ys, 1)
}

export function polynomialFit(xs: number[], ys: number[], degree: number) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) {
    throw new Error("xs and ys must be arrays")
  }
  const n = xs.length
  if (n === 0 || ys.length !== n) {
    throw new Error("xs and ys must have the same non-zero length")
  }
  const m = degree
  if (n <= m) {
    throw new Error("not enough points for requested polynomial degree")
  }

  // Build normal equations: (V^T V) c = V^T y
  // Where V is Vandermonde matrix (n x (m+1)): V[i][j] = xs[i]^j
  const size = m + 1
  const ATA: number[][] = Array.from({ length: size }, () => Array(size).fill(0))
  const ATy: number[] = Array(size).fill(0)

  // Precompute powers sums to be efficient
  const maxPow = 2 * m
  const powSums: number[] = Array(maxPow + 1).fill(0)
  for (let i = 0; i < n; i++) {
    let xp = 1
    for (let p = 0; p <= maxPow; p++) {
      powSums[p] += xp
      xp *= xs[i]
    }
  }

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= m; j++) {
      ATA[i][j] = powSums[i + j]
    }
  }

  for (let i = 0; i <= m; i++) {
    let sum = 0
    for (let k = 0; k < n; k++) {
      sum += ys[k] * Math.pow(xs[k], i)
    }
    ATy[i] = sum
  }

  const coeffs = solveLinearSystem(ATA, ATy) // may throw on singular
  // prepare evaluator
  const evaluate = (x: number) => {
    let v = 0
    let p = 1
    for (let i = 0; i < coeffs.length; i++) {
      v += coeffs[i] * p
      p *= x
    }
    return v
  }

  // compute fit statistics (R^2, RMSE)
  const preds = xs.map((x) => evaluate(x))
  const nObs = ys.length
  let sse = 0
  let sst = 0
  const meanY = ys.reduce((a, b) => a + b, 0) / nObs
  for (let i = 0; i < nObs; i++) {
    const e = ys[i] - preds[i]
    sse += e * e
    const t = ys[i] - meanY
    sst += t * t
  }
  const r2 = sst === 0 ? 1 : 1 - sse / sst
  const rmse = Math.sqrt(sse / nObs)

  return {
    coeffs,
    evaluate,
    stats: {
      r2,
      rmse,
      sse,
      sst,
    },
  }
}

/** Solve linear system A x = b with partial pivoting.
 *  A is a square matrix (array of arrays). Returns solution array.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length
  // clone to avoid mutating inputs
  const M: number[][] = A.map((row) => row.slice())
  const x = b.slice()

  for (let k = 0; k < n; k++) {
    // partial pivot
    let maxRow = k
    let maxVal = Math.abs(M[k][k])
    for (let i = k + 1; i < n; i++) {
      const v = Math.abs(M[i][k])
      if (v > maxVal) {
        maxVal = v
        maxRow = i
      }
    }
    if (maxVal === 0 || !isFinite(maxVal)) {
      throw new Error("Singular matrix in fit (cannot solve)")
    }
    if (maxRow !== k) {
      const tmp = M[k]; M[k] = M[maxRow]; M[maxRow] = tmp
      const tx = x[k]; x[k] = x[maxRow]; x[maxRow] = tx
    }

    // elimination
    const pivot = M[k][k]
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / pivot
      x[i] -= factor * x[k]
      for (let j = k; j < n; j++) {
        M[i][j] -= factor * M[k][j]
      }
    }
  }

  // back substitution
  const sol = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = x[i]
    for (let j = i + 1; j < n; j++) {
      s -= M[i][j] * sol[j]
    }
    sol[i] = s / M[i][i]
  }
  return sol
}
// ...existing code...