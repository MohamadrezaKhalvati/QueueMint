export function selectedVisibleCount(selected: Set<number>, visibleIndexes: number[]) {
  return visibleIndexes.reduce((count, index) => count + Number(selected.has(index)), 0)
}

export function setVisibleSelection(selected: Set<number>, visibleIndexes: number[], checked: boolean) {
  const next = new Set(selected)
  for (const index of visibleIndexes) {
    if (checked) next.add(index)
    else next.delete(index)
  }
  return next
}
