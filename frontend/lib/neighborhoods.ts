import type { Option, OptionGroup } from "@/components/common/SingleSelectRS"

/** One row of `widows-reference-data.neighborhoods`. */
export interface NeighborhoodOption {
  id: number | null
  label: string
  sector_id: number | null
  sector: string | null
}

const UNFILED = "بدون قطاع"

/**
 * The neighborhoods, gathered under the sector each one belongs to.
 *
 * The family record stores the neighborhood's name, not an id, which is
 * what the widow list, the reports and the printed card all want to show.
 * The sector is therefore not a second thing to choose and keep in step -
 * it is a heading over the list, so that picking a neighborhood in a town
 * with forty of them means finding your part of town first.
 *
 * Neighborhoods nobody has filed under a sector come last, under a heading
 * of their own, rather than being hidden until somebody sorts them out.
 */
export function groupBySector(neighborhoods: NeighborhoodOption[]): Array<Option | OptionGroup> {
  const bySector = new Map<string, Option[]>()

  for (const item of neighborhoods) {
    const key = item.sector ?? UNFILED
    const option = { label: item.label, value: item.label }
    const existing = bySector.get(key)

    if (existing) existing.push(option)
    else bySector.set(key, [option])
  }

  const named = [...bySector.entries()]
    .filter(([sector]) => sector !== UNFILED)
    .sort(([a], [b]) => a.localeCompare(b, "ar"))
    .map(([label, options]) => ({ label, options }))

  const unfiled = bySector.get(UNFILED)

  // A list with no sectors at all reads better flat than under one heading
  // saying the sectors have not been set up.
  if (named.length === 0) return unfiled ?? []

  return unfiled ? [...named, { label: UNFILED, options: unfiled }] : named
}
