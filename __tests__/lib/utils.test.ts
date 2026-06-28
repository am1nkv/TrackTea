import {
  getTimeOfDay,
  formatDateShort,
  formatDateWithWeekday,
  computeMonthlyStats,
  computeWeeklyData,
  getGaugeColor,
  getStartOfMonth,
  getStartOfWeek,
} from '../../lib/utils'
import { Drink } from '../../types'

function makeDrink(overrides: Partial<Drink> = {}): Drink {
  return {
    id: '1',
    user_id: 'u1',
    type: 'bubble_tea',
    sugar_grams: 30,
    price: 5.5,
    is_public: false,
    consumed_at: '2026-06-25T10:00:00.000Z',
    created_at: '2026-06-25T10:00:00.000Z',
    ...overrides,
  }
}

describe('getTimeOfDay', () => {
  it('returns morning before noon', () => {
    expect(getTimeOfDay(new Date('2026-06-28T08:00:00'))).toBe('morning')
    expect(getTimeOfDay(new Date('2026-06-28T00:00:00'))).toBe('morning')
    expect(getTimeOfDay(new Date('2026-06-28T11:59:00'))).toBe('morning')
  })

  it('returns afternoon between 12 and 17', () => {
    expect(getTimeOfDay(new Date('2026-06-28T12:00:00'))).toBe('afternoon')
    expect(getTimeOfDay(new Date('2026-06-28T14:30:00'))).toBe('afternoon')
    expect(getTimeOfDay(new Date('2026-06-28T16:59:00'))).toBe('afternoon')
  })

  it('returns evening from 17 onwards', () => {
    expect(getTimeOfDay(new Date('2026-06-28T17:00:00'))).toBe('evening')
    expect(getTimeOfDay(new Date('2026-06-28T21:00:00'))).toBe('evening')
    expect(getTimeOfDay(new Date('2026-06-28T23:59:00'))).toBe('evening')
  })
})

describe('formatDateShort', () => {
  it('formats an ISO date with month, day, hour, minute', () => {
    const result = formatDateShort('2026-06-15T14:30:00.000Z')
    expect(result).toContain('Jun')
    expect(result).toContain('15')
  })
})

describe('formatDateWithWeekday', () => {
  it('formats an ISO date with weekday, month, day', () => {
    // 2026-06-15 is a Monday
    const result = formatDateWithWeekday('2026-06-15T14:30:00.000Z')
    expect(result).toContain('Jun')
    expect(result).toContain('15')
  })
})

describe('computeMonthlyStats', () => {
  it('returns zeroes for an empty array', () => {
    const stats = computeMonthlyStats([])
    expect(stats).toEqual({ total_sugar: 0, total_spent: 0, drink_count: 0 })
  })

  it('sums sugar and price for a single drink', () => {
    const stats = computeMonthlyStats([makeDrink()])
    expect(stats).toEqual({ total_sugar: 30, total_spent: 5.5, drink_count: 1 })
  })

  it('sums sugar and price across multiple drinks', () => {
    const drinks = [
      makeDrink({ sugar_grams: 20, price: 4.0 }),
      makeDrink({ id: '2', sugar_grams: 35, price: 6.5 }),
      makeDrink({ id: '3', sugar_grams: 15, price: 3.0 }),
    ]
    const stats = computeMonthlyStats(drinks)
    expect(stats.total_sugar).toBe(70)
    expect(stats.total_spent).toBeCloseTo(13.5)
    expect(stats.drink_count).toBe(3)
  })

  it('handles zero sugar and zero price', () => {
    const stats = computeMonthlyStats([makeDrink({ sugar_grams: 0, price: 0 })])
    expect(stats).toEqual({ total_sugar: 0, total_spent: 0, drink_count: 1 })
  })
})

describe('computeWeeklyData', () => {
  it('returns all 7 days with zero sugar for empty input', () => {
    const result = computeWeeklyData([], '2026-06-22T00:00:00.000Z')
    expect(result).toHaveLength(7)
    result.forEach(d => expect(d.sugar_grams).toBe(0))
  })

  it('correctly assigns sugar to the right day', () => {
    // 2026-06-25 is a Thursday
    const drinks = [makeDrink({ consumed_at: '2026-06-25T10:00:00.000Z', sugar_grams: 40 })]
    const result = computeWeeklyData(drinks, '2026-06-22T00:00:00.000Z')
    const thursday = result.find(d => d.day === 'Thu')
    expect(thursday?.sugar_grams).toBe(40)
  })

  it('aggregates multiple drinks on the same day', () => {
    const drinks = [
      makeDrink({ consumed_at: '2026-06-25T08:00:00.000Z', sugar_grams: 20 }),
      makeDrink({ id: '2', consumed_at: '2026-06-25T15:00:00.000Z', sugar_grams: 15 }),
    ]
    const result = computeWeeklyData(drinks, '2026-06-22T00:00:00.000Z')
    const thursday = result.find(d => d.day === 'Thu')
    expect(thursday?.sugar_grams).toBe(35)
  })

  it('filters out drinks before the start of week', () => {
    const drinks = [
      makeDrink({ consumed_at: '2026-06-20T10:00:00.000Z', sugar_grams: 50 }),
    ]
    const result = computeWeeklyData(drinks, '2026-06-22T00:00:00.000Z')
    result.forEach(d => expect(d.sugar_grams).toBe(0))
  })

  it('handles Sunday correctly (maps to index 6)', () => {
    // 2026-06-28 is a Sunday
    const drinks = [makeDrink({ consumed_at: '2026-06-28T12:00:00.000Z', sugar_grams: 25 })]
    const result = computeWeeklyData(drinks, '2026-06-22T00:00:00.000Z')
    const sunday = result.find(d => d.day === 'Sun')
    expect(sunday?.sugar_grams).toBe(25)
  })
})

describe('getGaugeColor', () => {
  it('returns success for percent < 0.5', () => {
    expect(getGaugeColor(0)).toBe('success')
    expect(getGaugeColor(0.25)).toBe('success')
    expect(getGaugeColor(0.49)).toBe('success')
  })

  it('returns warning for percent between 0.5 and 0.8', () => {
    expect(getGaugeColor(0.5)).toBe('warning')
    expect(getGaugeColor(0.65)).toBe('warning')
    expect(getGaugeColor(0.79)).toBe('warning')
  })

  it('returns error for percent >= 0.8', () => {
    expect(getGaugeColor(0.8)).toBe('error')
    expect(getGaugeColor(0.9)).toBe('error')
    expect(getGaugeColor(1.0)).toBe('error')
  })
})

describe('getStartOfMonth', () => {
  it('returns first day of the month', () => {
    const result = getStartOfMonth(new Date('2026-06-15T10:30:00'))
    const date = new Date(result)
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(5) // June = 5
    expect(date.getDate()).toBe(1)
  })
})

describe('getStartOfWeek', () => {
  it('returns the Monday of the week', () => {
    // 2026-06-25 is a Thursday, so start of week = Mon June 22
    const result = getStartOfWeek(new Date('2026-06-25T10:00:00'))
    const date = new Date(result)
    expect(date.getDate()).toBe(22)
  })

  it('returns the Monday when given a Sunday', () => {
    // 2026-06-28 is a Sunday, start of week = Mon June 22
    const result = getStartOfWeek(new Date('2026-06-28T10:00:00'))
    const date = new Date(result)
    expect(date.getDate()).toBe(22)
  })

  it('returns the same day when given a Monday', () => {
    // 2026-06-22 is a Monday
    const result = getStartOfWeek(new Date('2026-06-22T10:00:00'))
    const date = new Date(result)
    expect(date.getDate()).toBe(22)
  })
})
