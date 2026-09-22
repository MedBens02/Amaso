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

/**
 * The categories a fund offers, for the income and expense forms.
 *
 * A fund with no list attached offers every category rather than none: a
 * budget somebody has just created, or one the association never narrowed,
 * must stay usable. A screen that offers no choices reads as broken, not as
 * strict.
 *
 * The category already chosen is always kept in the list, even when the fund
 * does not offer it. Two reasons, and both of them are bugs otherwise: an
 * expense recorded before the lists existed still has to show its own
 * category when it is reopened, and the select draws the text on its trigger
 * from the option that is mounted - drop the chosen one and the field goes
 * blank while still holding a value.
 */
export function categoriesForBudget<T extends { id: number }>(
  categories: T[],
  budgetId: number | null | undefined,
  linksByBudget: Record<string, number[]> | undefined,
  selectedId?: number | null,
): T[] {
  const allowed = budgetId ? linksByBudget?.[String(budgetId)] : undefined

  if (!allowed || allowed.length === 0) return categories

  const ids = new Set(allowed)

  return categories.filter((category) => ids.has(category.id) || category.id === selectedId)
}
