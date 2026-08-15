export interface OrderLineInput {
  quantity: number
  unit_price: number
}

export interface DiscountSnapshot {
  percent_off?: number | null
  amount_off?: number | null
}

export interface OrderTotals {
  subtotal: number
  discount: number
  total: number
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function positiveNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function computeOrderTotals(lines: readonly OrderLineInput[], discount?: DiscountSnapshot | null): OrderTotals {
  const subtotal = round2(lines.reduce((sum, line) => sum + round2(positiveNumber(line.quantity) * positiveNumber(line.unit_price)), 0))
  const percent = discount?.percent_off ?? null
  const amount = discount?.amount_off ?? null
  const rawDiscount = percent != null && percent > 0 ? round2((subtotal * percent) / 100) : positiveNumber(amount ?? 0)
  const boundedDiscount = Math.min(Math.max(rawDiscount, 0), subtotal)

  return {
    subtotal,
    discount: round2(boundedDiscount),
    total: round2(subtotal - boundedDiscount),
  }
}
