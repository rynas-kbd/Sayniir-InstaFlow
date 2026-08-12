import { describe, test, expect } from 'vitest'
import { PLAN_CONFIG, PLAN_KEYS, ANNUAL_DISCOUNT_RATE, resolvePlanAmount } from '@/lib/plans'
import { PLAN_LIMITS } from '@/lib/plans/restrictions'
import { AI_PLAN_LIMITS } from '@/lib/ai/credits/limits'

describe('lib/plans — pricing consistency', () => {
  test('annual price is monthly × 12 discounted by ANNUAL_DISCOUNT_RATE, for every catalog plan', () => {
    for (const key of PLAN_KEYS) {
      const cfg = PLAN_CONFIG[key]
      if (cfg.priceMonthlyDzd === null) continue // business — negotiated, no catalog price
      const expected = Math.round(cfg.priceMonthlyDzd * 12 * (1 - ANNUAL_DISCOUNT_RATE))
      expect(cfg.priceAnnualDzd).toBe(expected)
    }
  })

  test('business has no catalog price — it is negotiated per client', () => {
    expect(PLAN_CONFIG.business.priceMonthlyDzd).toBeNull()
    expect(PLAN_CONFIG.business.priceAnnualDzd).toBeNull()
  })

  test('every PlanKey has an entry in PLAN_LIMITS and AI_PLAN_LIMITS', () => {
    for (const key of PLAN_KEYS) {
      expect(PLAN_LIMITS[key]).toBeDefined()
      expect(AI_PLAN_LIMITS[key]).toBeDefined()
    }
  })

  test('resolvePlanAmount returns the catalog price for starter/pro', () => {
    expect(resolvePlanAmount('starter', 'monthly')).toBe(PLAN_CONFIG.starter.priceMonthlyDzd)
    expect(resolvePlanAmount('pro', 'annual')).toBe(PLAN_CONFIG.pro.priceAnnualDzd)
  })

  test('resolvePlanAmount returns null for business with no negotiated price', () => {
    expect(resolvePlanAmount('business', 'monthly', null)).toBeNull()
    expect(resolvePlanAmount('business', 'monthly', {})).toBeNull()
  })

  test('resolvePlanAmount returns the subscription row custom price for business', () => {
    const sub = { custom_price_monthly_dzd: 25000, custom_price_annual_dzd: 240000 }
    expect(resolvePlanAmount('business', 'monthly', sub)).toBe(25000)
    expect(resolvePlanAmount('business', 'annual', sub)).toBe(240000)
  })
})
