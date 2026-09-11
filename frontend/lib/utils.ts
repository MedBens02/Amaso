import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A number, whatever the API sent.
 *
 * MySQL DECIMAL columns come back from Laravel as *strings* - "500.00", not
 * 500 - so `sum + donor.total_given` concatenates instead of adding. The
 * donors report showed its total as "0500.001400.001160.00" for exactly this
 * reason, and its average as NaN, because a string divided by a count is not
 * a number. Anything that adds up a value from the API has to go through
 * here first.
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number.parseFloat(String(value ?? ""))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Split `total` across `weights` (e.g. percentages) into clean 2-decimal
 * amounts that sum to `total` exactly. Each weight is floored to the cent,
 * then the leftover cents are handed out one by one to the parts with the
 * largest fractional remainder (the "largest remainder" apportionment
 * method), so no cent is lost or invented to rounding.
 */
export function splitByWeights(total: number, weights: number[]): number[] {
  if (weights.length === 0) return []

  const totalCents = Math.round((total || 0) * 100)
  const weightSum = weights.reduce((sum, w) => sum + w, 0) || 1

  const raw = weights.map((w) => (totalCents * w) / weightSum)
  const floors = raw.map((r) => Math.floor(r))
  const remainder = totalCents - floors.reduce((sum, f) => sum + f, 0)

  const byRemainingFraction = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)

  const cents = [...floors]
  for (let k = 0; k < remainder; k++) {
    cents[byRemainingFraction[k % byRemainingFraction.length].i] += 1
  }

  return cents.map((c) => c / 100)
}
