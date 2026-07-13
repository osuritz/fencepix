export interface GridDims { cols: number; rows: number }

export const MAX_CELLS = 50_000
// Normalized design units: every diamond is 2 units wide and 2 tall, so
// columns are 2 units apart, rows 1 unit apart, odd rows shifted +1.
export const CELL_W = 2
export const CELL_H = 2

export function cellCount(d: GridDims): number {
  return d.cols * d.rows
}

export function designSize(d: GridDims): { width: number; height: number } {
  if (d.cols === 0 || d.rows === 0) return { width: 0, height: 0 }
  return {
    width: d.cols * CELL_W + (d.rows > 1 ? CELL_W / 2 : 0),
    height: (d.rows + 1) * (CELL_H / 2),
  }
}

export function cellCenter(row: number, col: number): { x: number; y: number } {
  return { x: col * CELL_W + 1 + (row % 2), y: row * (CELL_H / 2) + 1 }
}

export function cellAt(x: number, y: number, d: GridDims): { row: number; col: number } | null {
  // Diamonds tile the plane, so checking the rows around y and the rounded
  // column in each is exhaustive.
  const nearRow = Math.round(y - 1)
  for (const row of [nearRow, nearRow - 1, nearRow + 1]) {
    if (row < 0 || row >= d.rows) continue
    const col = Math.round((x - 1 - (row % 2)) / CELL_W)
    if (col < 0 || col >= d.cols) continue
    const c = cellCenter(row, col)
    if (Math.abs(x - c.x) + Math.abs(y - c.y) <= 1 + 1e-9) return { row, col }
  }
  return null
}

export function neighbors(row: number, col: number, d: GridDims): Array<{ row: number; col: number }> {
  const shift = row % 2
  return [
    { row: row - 1, col: col - 1 + shift }, // up-left
    { row: row - 1, col: col + shift },     // up-right
    { row: row + 1, col: col - 1 + shift }, // down-left
    { row: row + 1, col: col + shift },     // down-right
  ].filter(n => n.row >= 0 && n.row < d.rows && n.col >= 0 && n.col < d.cols)
}

// Physical→grid, all lengths in inches. W = H = mesh·√2. All rows share a
// column count and the odd-row stagger must fit: cols·W + W/2 ≤ width.
// n rows occupy (n+1)·H/2 of height.
export function gridFromPhysical(width: number, height: number, mesh: number): GridDims {
  const W = mesh * Math.SQRT2
  return {
    cols: Math.max(0, Math.floor((width - W / 2) / W + 1e-9)),
    rows: Math.max(0, Math.floor((height - W / 2) / (W / 2) + 1e-9)),
  }
}

export function physicalFromGrid(d: GridDims, mesh: number): { width: number; height: number } {
  const W = mesh * Math.SQRT2
  return { width: d.cols * W + W / 2, height: (d.rows + 1) * (W / 2) }
}
