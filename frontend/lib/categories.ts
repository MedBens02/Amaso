/**
 * Accounting categories are a free-form tree now that budgets carry the money
 * and categories only classify it. The pickers stay flat single-selects, so a
 * child is shown indented under its parent instead of in a nested menu.
 */
export interface CategoryNode {
  id: number
  label: string
  parent_id?: number | null
  parent?: { id: number; label: string } | null
}

export interface CategoryOption {
  value: string
  label: string
  depth: number
}

/**
 * Orders a flat category list parent-first and prefixes children with an
 * indent, so the hierarchy reads correctly in a plain <select>/react-select.
 * Categories whose parent is missing (deleted, or filtered out) are treated
 * as roots so nothing silently disappears from the picker.
 */
export function buildCategoryOptions(categories: CategoryNode[]): CategoryOption[] {
  const byParent = new Map<number | null, CategoryNode[]>()
  const ids = new Set(categories.map((c) => c.id))

  for (const category of categories) {
    const parentId = category.parent_id ?? category.parent?.id ?? null
    const key = parentId !== null && ids.has(parentId) ? parentId : null
    byParent.set(key, [...(byParent.get(key) || []), category])
  }

  const options: CategoryOption[] = []
  const walk = (parentId: number | null, depth: number) => {
    const children = (byParent.get(parentId) || []).sort((a, b) =>
      a.label.localeCompare(b.label, "ar")
    )
    for (const child of children) {
      options.push({
        value: child.id.toString(),
        label: `${"  ".repeat(depth)}${depth > 0 ? "└ " : ""}${child.label}`,
        depth,
      })
      walk(child.id, depth + 1)
    }
  }
  walk(null, 0)

  return options
}
