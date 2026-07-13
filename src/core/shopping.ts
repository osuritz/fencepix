export interface ShoppingLine { colorId: number; count: number; withOverage: number }

export function shoppingList(cells: Uint16Array, overagePct: number): ShoppingLine[] {
  const counts = new Map<number, number>()
  for (const v of cells) if (v !== 0) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .map(([colorId, count]) => ({
      colorId,
      count,
      withOverage: Math.ceil(count * (1 + overagePct / 100)),
    }))
    .sort((a, b) => b.count - a.count || a.colorId - b.colorId)
}
