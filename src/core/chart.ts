import type { GridDims } from './lattice'

export const PAGE_COLS = 25
export const PAGE_ROWS = 30

export interface ChartPage {
  pageRow: number; pageCol: number
  rowStart: number; rowEnd: number
  colStart: number; colEnd: number
}

export function paginate(d: GridDims): ChartPage[] {
  const pages: ChartPage[] = []
  for (let pr = 0; pr * PAGE_ROWS < d.rows; pr++) {
    for (let pc = 0; pc * PAGE_COLS < d.cols; pc++) {
      pages.push({
        pageRow: pr, pageCol: pc,
        rowStart: pr * PAGE_ROWS, rowEnd: Math.min(d.rows, (pr + 1) * PAGE_ROWS),
        colStart: pc * PAGE_COLS, colEnd: Math.min(d.cols, (pc + 1) * PAGE_COLS),
      })
    }
  }
  return pages
}
