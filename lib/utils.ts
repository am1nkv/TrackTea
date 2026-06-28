import { Drink, WeeklyData, MonthlyStats } from '../types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function getTimeOfDay(date: Date = new Date()): string {
  const h = date.getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateWithWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function computeMonthlyStats(drinks: Drink[]): MonthlyStats {
  return drinks.reduce(
    (acc, d) => ({
      total_sugar: acc.total_sugar + (d.sugar_grams ?? 0),
      total_spent: acc.total_spent + (d.price ?? 0),
      drink_count: acc.drink_count + 1,
    }),
    { total_sugar: 0, total_spent: 0, drink_count: 0 },
  )
}

export function computeWeeklyData(drinks: Drink[], startOfWeek: string): WeeklyData[] {
  const weeklyMap: Record<string, number> = {}
  drinks
    .filter(d => d.consumed_at >= startOfWeek)
    .forEach(d => {
      const dayIdx = new Date(d.consumed_at).getDay()
      const day = DAYS[dayIdx === 0 ? 6 : dayIdx - 1]
      weeklyMap[day] = (weeklyMap[day] ?? 0) + d.sugar_grams
    })

  return DAYS.map(d => ({ day: d, sugar_grams: weeklyMap[d] ?? 0 }))
}

export function getGaugeColor(percent: number): string {
  if (percent < 0.5) return 'success'
  if (percent < 0.8) return 'warning'
  return 'error'
}

export function getStartOfMonth(date: Date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
}

export function getStartOfWeek(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString()
}
